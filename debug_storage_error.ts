import { db } from "./server/db";

async function main() {
  try {
    const results = await db.query.contratos.findMany({
      with: {
        departamento: { with: { ente: true } },
        fornecedor: true,
        empenhos: { with: { afs: true, fonteRecurso: true, ficha: true } },
        notasFiscais: true,
        aditivos: true,
        anexos: true,
      }
    });
    console.log("Success");
  } catch (e: any) {
    console.error("ERROR MESSAGE:", e.message);
  }
  process.exit(0);
}

main();
