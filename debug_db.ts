import { db } from "./server/db";
import { contratos } from "./shared/schema";

async function main() {
  try {
    const results = await db.select().from(contratos);
    console.log(`Found ${results.length} basic contract rows.`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
