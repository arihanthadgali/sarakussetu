import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "../src/database/prisma.js";

const sql = readFileSync(resolve("scripts/seed-catalog.sql"), "utf8");

async function main() {
  await prisma.$executeRawUnsafe(sql);
  console.log("Product catalogue inserted successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
