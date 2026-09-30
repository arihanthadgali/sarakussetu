import { mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import sharp from "sharp";

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_MAX_WIDTH = 1000;

export const productImageDirectory = resolve(
  process.cwd(),
  "uploads",
  "products",
);

mkdirSync(productImageDirectory, { recursive: true });

export function isLocalProductImage(imageUrl: string | null | undefined): boolean {
  return typeof imageUrl === "string" && imageUrl.startsWith("/uploads/products/");
}

export async function saveProductImage(input: {
  buffer: Buffer;
}): Promise<string> {
  const fileName = `${randomUUID()}.webp`;
  const outputPath = join(productImageDirectory, fileName);

  await sharp(input.buffer)
    .rotate()
    .resize({
      width: PRODUCT_IMAGE_MAX_WIDTH,
      height: PRODUCT_IMAGE_MAX_WIDTH,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toFile(outputPath);

  return `/uploads/products/${fileName}`;
}

export async function deleteProductImage(
  imageUrl: string | null | undefined,
): Promise<void> {
  if (
    typeof imageUrl !== "string" ||
    !imageUrl.startsWith("/uploads/products/")
  ) {
    return;
  }

  const fileName = basename(
    imageUrl.slice("/uploads/products/".length),
  );

  if (!/^[0-9a-f-]{36}\.webp$/i.test(fileName)) {
    return;
  }

  await unlink(
    join(productImageDirectory, fileName),
  ).catch(() => undefined);
}
