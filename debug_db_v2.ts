import { db } from "./server/db";
import { contratos } from "./shared/schema";

async function main() {
  try {
    console.log("Database URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
    const results = await db.select().from(contratos);
    console.log(`Found ${results.length} basic contract rows.`);
    process.exit(0);
  } catch (e: any) {
    console.error("Error Message:", e.message);
    console.error("Error Stack:", e.stack);
    process.exit(1);
  }
}

main();
