import { storage } from "./server/storage";

async function test() {
  try {
    console.log("Checking contracts...");
    const contratos = await storage.getContratos();
    console.log(`Found ${contratos.length} contracts.`);
    if (contratos.length > 0) {
      console.log("First contract sample:", JSON.stringify(contratos[0], null, 2).slice(0, 500));
    }
    
    console.log("Checking empenhos...");
    const empenhos = await storage.getEmpenho("some-id-to-test"); // we don't have ids easily, skip or find first
    
    process.exit(0);
  } catch (e) {
    console.error("Error in test:", e);
    process.exit(1);
  }
}

test();
