// Seeds curriculum *identity* rows only — name, major, orientation, entry-
// year range — from docs/06_Curriculum_Dataset.md §2 / docs/01_Product_Overview.md
// §5. This is fully specified, verified data (not TBD), unlike the course
// catalog/requirements, which stay unseeded until the Curriculum Data phase
// (docs/10_Claude_Master_Prompt.md §29 step 5). Idempotent: safe to re-run.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CURRICULA = [
  {
    name: "Computer Engineering — Software Engineering",
    major: "Computer Engineering",
    orientation: "Software Engineering",
    entryYearFrom: null,
    entryYearTo: 1402,
  },
  {
    name: "Computer Engineering — Information Technology",
    major: "Computer Engineering",
    orientation: "Information Technology",
    entryYearFrom: null,
    entryYearTo: 1402,
  },
  {
    name: "Computer Engineering — Unified",
    major: "Computer Engineering",
    orientation: "Unified",
    entryYearFrom: 1403,
    entryYearTo: null,
  },
];

async function main() {
  for (const curriculum of CURRICULA) {
    await prisma.curriculum.upsert({
      where: { name: curriculum.name },
      update: {},
      create: curriculum,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
