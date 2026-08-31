import { Prisma, type PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Router, type RequestHandler } from 'express';

import { prisma } from '../database/prisma.js';
import { requireAuthentication } from '../middleware/authentication.js';

const productSelection = {
  id: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
} satisfies Prisma.ProductSelect;

const MAX_QUANTITY = 2_147_483_647;
const quantityExceedsMaximum = Symbol('quantityExceedsMaximum');

type CartRouterDependencies = {
  database?: PrismaClient;
};

const parsePositiveId = (value: unknown): bigint | undefined => {
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    return BigInt(value);
  }
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return BigInt(value);
  }
  return undefined;
};

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= MAX_QUANTITY;

const isUniqueConstraintError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

export const createCartRouter = ({ database = prisma }: CartRouterDependencies = {}): Router => {
  const router = Router();

  const getCart: RequestHandler = async (_request, response, next) => {
    const customerId = response.locals.customerId as bigint | undefined;
    if (customerId === undefined) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const cart = await database.cart.findUnique({
        where: { customerId },
        select: {
          id: true,
          items: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              quantity: true,
              product: { select: productSelection },
            },
          },
        },
      });

      if (cart === null) {
        return response.status(200).json({ id: null, items: [], subtotal: 0, itemCount: 0 });
      }

      let subtotal = new Decimal(0);
      let itemCount = 0;
      const items = cart.items.map((item) => {
        const lineTotal = item.product.price.mul(item.quantity);
        subtotal = subtotal.plus(lineTotal);
        itemCount += item.quantity;

        return {
          id: item.id.toString(),
          quantity: item.quantity,
          product: {
            id: Number(item.product.id),
            name: item.product.name,
            description: item.product.description,
            price: item.product.price.toNumber(),
            imageUrl: item.product.imageUrl,
          },
          lineTotal: lineTotal.toNumber(),
        };
      });

      return response.status(200).json({
        id: cart.id.toString(),
        items,
        subtotal: subtotal.toNumber(),
        itemCount,
      });
    } catch (error) {
      return next(error);
    }
  };

  const addItem: RequestHandler = async (request, response, next) => {
    const customerId = response.locals.customerId as bigint | undefined;
    if (customerId === undefined) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const body = request.body as { productId?: unknown; quantity?: unknown } | undefined;
    const productId = parsePositiveId(body?.productId);
    const quantity = body?.quantity;
    if (productId === undefined || !isPositiveInteger(quantity)) {
      return response.status(400).json({
        message: 'A valid product ID and positive integer quantity are required.',
      });
    }

    try {
      const addItemToCart = () => database.$transaction(async (transaction) => {
        const product = await transaction.product.findFirst({
          where: { id: productId, active: true },
          select: productSelection,
        });
        if (product === null) {
          return null;
        }

        const now = new Date();
        const cart = await transaction.cart.upsert({
          where: { customerId },
          create: { customerId, createdAt: now, updatedAt: now },
          update: { updatedAt: now },
          select: { id: true },
        });

        const cartItemWhere = { cartId_productId: { cartId: cart.id, productId } };
        const updatedItem = await transaction.cartItem.updateMany({
          where: {
            cartId: cart.id,
            productId,
            quantity: { lte: MAX_QUANTITY - quantity },
          },
          data: {
            quantity: { increment: quantity },
            updatedAt: now,
          },
        });

        if (updatedItem.count === 1) {
          const cartItem = await transaction.cartItem.findUniqueOrThrow({
            where: cartItemWhere,
            select: { id: true, quantity: true },
          });
          return { cartItem, product };
        }

        const existingItem = await transaction.cartItem.findUnique({
          where: cartItemWhere,
          select: { id: true },
        });
        if (existingItem !== null) {
          return quantityExceedsMaximum;
        }

        const cartItem = await transaction.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
            createdAt: now,
            updatedAt: now,
          },
          select: { id: true, quantity: true },
        });
        return { cartItem, product };
      });

      let item;
      try {
        item = await addItemToCart();
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }
        item = await addItemToCart();
      }

      if (item === null) {
        return response.status(404).json({ message: 'Product not found.' });
      }
      if (item === quantityExceedsMaximum) {
        return response.status(400).json({
          message: 'A valid product ID and positive integer quantity are required.',
        });
      }

      return response.status(201).json({
        id: item.cartItem.id.toString(),
        quantity: item.cartItem.quantity,
        product: {
          id: Number(item.product.id),
          name: item.product.name,
          description: item.product.description,
          price: item.product.price.toNumber(),
          imageUrl: item.product.imageUrl,
        },
      });
    } catch (error) {
      return next(error);
    }
  };

  const updateItemQuantity: RequestHandler = async (request, response, next) => {
    const customerId = response.locals.customerId as bigint | undefined;
    if (customerId === undefined) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const cartItemId = parsePositiveId(request.params.cartItemId);
    const quantity = (request.body as { quantity?: unknown } | undefined)?.quantity;
    if (cartItemId === undefined || !isPositiveInteger(quantity)) {
      return response.status(400).json({
        message: 'A valid cart item ID and positive integer quantity are required.',
      });
    }

    try {
      const updatedItem = await database.cartItem.updateMany({
        where: { id: cartItemId, cart: { customerId } },
        data: { quantity, updatedAt: new Date() },
      });
      if (updatedItem.count === 0) {
        return response.status(404).json({ message: 'Cart item not found.' });
      }

      const cartItem = await database.cartItem.findFirst({
        where: { id: cartItemId, cart: { customerId } },
        select: {
          id: true,
          quantity: true,
          product: { select: productSelection },
        },
      });
      if (cartItem === null) {
        return response.status(404).json({ message: 'Cart item not found.' });
      }

      return response.status(200).json({
        id: cartItem.id.toString(),
        quantity: cartItem.quantity,
        product: {
          id: Number(cartItem.product.id),
          name: cartItem.product.name,
          description: cartItem.product.description,
          price: cartItem.product.price.toNumber(),
          imageUrl: cartItem.product.imageUrl,
        },
      });
    } catch (error) {
      return next(error);
    }
  };

  const removeItem: RequestHandler = async (request, response, next) => {
    const customerId = response.locals.customerId as bigint | undefined;
    if (customerId === undefined) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const cartItemId = parsePositiveId(request.params.cartItemId);
    if (cartItemId === undefined) {
      return response.status(400).json({ message: 'A valid cart item ID is required.' });
    }

    try {
      const deletedItem = await database.cartItem.deleteMany({
        where: { id: cartItemId, cart: { customerId } },
      });
      if (deletedItem.count === 0) {
        return response.status(404).json({ message: 'Cart item not found.' });
      }

      return response.status(204).send();
    } catch (error) {
      return next(error);
    }
  };

  router.get('/', requireAuthentication, getCart);
  router.post('/items', requireAuthentication, addItem);
  router.patch('/items/:cartItemId', requireAuthentication, updateItemQuantity);
  router.delete('/items/:cartItemId', requireAuthentication, removeItem);
  return router;
};
