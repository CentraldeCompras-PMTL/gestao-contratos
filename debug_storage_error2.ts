import { db } from "./server/db";

async function main() {
  try {
    const results = await db.query.contratos.findMany({
      with: {
        empenhos: { with: { afs: true, fonteRecurso: true, ficha: true } },
      }
    });
    console.log("Success");
  } catch (e: any) {
    console.log("===============================");
    console.log(e.message);
    console.log("===============================");
  }
  process.exit(0);
}

main();
