import type { Prisma, PrismaClient } from "@prisma/client";
import multer from "multer";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";

import { requireAuthentication } from "../../middleware/authentication.js";
import { requireAdminAuthentication } from "../../middleware/admin-authentication.js";
import {
  deleteProductImage,
  PRODUCT_IMAGE_MAX_BYTES,
  saveProductImage,
} from "../../services/product-image-storage.js";

type Database = Pick<PrismaClient, "product">;

const productSelection = {
  id: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

const productInputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).nullable().optional(),
  price: z.coerce.number().finite().min(0).max(99999999.99),
  active: z.boolean().optional(),
});

const productUpdateSchema = productInputSchema.partial();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: PRODUCT_IMAGE_MAX_BYTES,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    const isAllowed =
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/webp";

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Only JPG, PNG, and WebP images are allowed."));
    }
  },
});

type ProductRecord = Prisma.ProductGetPayload<{
  select: typeof productSelection;
}>;

function toProductResponse(product: ProductRecord) {
  return {
    id: Number(product.id),
    name: product.name,
    description: product.description,
    price: product.price.toNumber(),
    imageUrl: product.imageUrl,
    active: product.active,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function parseProductBody(request: Request, partial: boolean) {
  const schema = partial ? productUpdateSchema : productInputSchema;
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message ?? "Invalid product data.",
    };
  }

  return { data: result.data };
}

function handleUploadError(error: unknown, response: Response): boolean {
  if (!(error instanceof multer.MulterError) && !(error instanceof Error)) {
    return false;
  }

  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    response.status(413).json({
      error: "Product image must be 5 MB or smaller.",
    });
    return true;
  }

  if (error.message === "Only JPG, PNG, and WebP images are allowed.") {
    response.status(400).json({
      error: error.message,
    });
    return true;
  }

  return false;
}

export function createAdminProductsRouter({
  database,
}: {
  database: Database;
}) {
  const getProducts = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const products = await database.product.findMany({
        orderBy: {
          name: "asc",
        },
        select: productSelection,
      });

      response.status(200).json(products.map(toProductResponse));
    } catch (error) {
      next(error);
    }
  };

  const createProduct = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = parseProductBody(request, false);

      if ("error" in parsed) {
        response.status(400).json({
          error: parsed.error,
        });
        return;
      }

      const now = new Date();

      const product = await database.product.create({
        data: {
          name: parsed.data.name!,
          description: parsed.data.description ?? null,
          price: parsed.data.price!,
          active: parsed.data.active ?? true,
          createdAt: now,
          updatedAt: now,
        },
        select: productSelection,
      });

      response.status(201).json(toProductResponse(product));
    } catch (error) {
      next(error);
    }
  };

  const updateProduct = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const productId = Number(request.params.id);

      if (!Number.isSafeInteger(productId) || productId <= 0) {
        response.status(400).json({
          error: "Invalid product id.",
        });
        return;
      }

      const parsed = parseProductBody(request, true);

      if ("error" in parsed) {
        response.status(400).json({
          error: parsed.error,
        });
        return;
      }

      if (Object.keys(parsed.data).length === 0) {
        response.status(400).json({
          error: "No product changes were provided.",
        });
        return;
      }

      const product = await database.product.update({
        where: {
          id: BigInt(productId),
        },
        data: {
          ...parsed.data,
          updatedAt: new Date(),
        },
        select: productSelection,
      });

      response.status(200).json(toProductResponse(product));
    } catch (error) {
      next(error);
    }
  };

  const uploadProductImage = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const productId = Number(request.params.id);

      if (!Number.isSafeInteger(productId) || productId <= 0) {
        response.status(400).json({
          error: "Invalid product id.",
        });
        return;
      }

      const product = await database.product.findUnique({
        where: {
          id: BigInt(productId),
        },
        select: {
          id: true,
          imageUrl: true,
        },
      });

      if (product === null) {
        response.status(404).json({
          error: "Product not found.",
        });
        return;
      }

      if (!request.file) {
        response.status(400).json({
          error: "Product image is required.",
        });
        return;
      }

      const imageUrl = await saveProductImage({
        buffer: request.file.buffer,
      });

      try {
        const updatedProduct = await database.product.update({
          where: {
            id: product.id,
          },
          data: {
            imageUrl,
            updatedAt: new Date(),
          },
          select: productSelection,
        });

        await deleteProductImage(product.imageUrl);

        response.status(200).json(toProductResponse(updatedProduct));
      } catch (error) {
        await deleteProductImage(imageUrl);
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  const deleteProductImageHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const productId = Number(request.params.id);

      if (!Number.isSafeInteger(productId) || productId <= 0) {
        response.status(400).json({
          error: "Invalid product id.",
        });
        return;
      }

      const product = await database.product.findUnique({
        where: {
          id: BigInt(productId),
        },
        select: {
          id: true,
          imageUrl: true,
        },
      });

      if (product === null) {
        response.status(404).json({
          error: "Product not found.",
        });
        return;
      }

      const updatedProduct = await database.product.update({
        where: {
          id: product.id,
        },
        data: {
          imageUrl: null,
          updatedAt: new Date(),
        },
        select: productSelection,
      });

      await deleteProductImage(product.imageUrl);

      response.status(200).json(toProductResponse(updatedProduct));
    } catch (error) {
      next(error);
    }
  };

  const router = Router();

  const adminMiddleware = [
    requireAuthentication,
    requireAdminAuthentication,
  ];

  router.get("/", ...adminMiddleware, getProducts);

  router.post("/", ...adminMiddleware, createProduct);

  router.patch("/:id", ...adminMiddleware, updateProduct);

  router.post(
    "/:id/image",
    ...adminMiddleware,
    (request, response, next) => {
      upload.single("image")(request, response, (error: unknown) => {
        if (handleUploadError(error, response)) {
          return;
        }

        if (error) {
          next(error);
          return;
        }

        uploadProductImage(request, response, next);
      });
    },
  );

  router.delete(
    "/:id/image",
    ...adminMiddleware,
    deleteProductImageHandler,
  );

  return router;
}