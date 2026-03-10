import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  users, fornecedores, processosDigitais, fasesContratacao, contratos, empenhos, afs,
  type User, type InsertUser, type Fornecedor, type InsertFornecedor,
  type ProcessoDigital, type InsertProcessoDigital, type FaseContratacao, type InsertFaseContratacao,
  type Contrato, type InsertContrato, type Empenho, type InsertEmpenho, type Af, type InsertAf,
  type ContratoWithRelations, type ProcessoDigitalWithRelations, type AfWithRelations
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getFornecedores(): Promise<Fornecedor[]>;
  getFornecedor(id: string): Promise<Fornecedor | undefined>;
  createFornecedor(fornecedor: InsertFornecedor): Promise<Fornecedor>;
  updateFornecedor(id: string, fornecedor: Partial<InsertFornecedor>): Promise<Fornecedor>;

  getProcessosDigitais(): Promise<ProcessoDigitalWithRelations[]>;
  getProcessoDigital(id: string): Promise<ProcessoDigitalWithRelations | undefined>;
  createProcessoDigital(processo: InsertProcessoDigital): Promise<ProcessoDigital>;
  
  getFases(): Promise<(FaseContratacao & { fornecedor: Fornecedor; processoDigital: ProcessoDigital })[]>;
  getFase(id: string): Promise<(FaseContratacao & { fornecedor: Fornecedor; processoDigital: ProcessoDigital }) | undefined>;
  createFaseContratacao(fase: InsertFaseContratacao): Promise<FaseContratacao>;
  updateFaseContratacao(id: string, fase: Partial<InsertFaseContratacao>): Promise<FaseContratacao>;

  getContratos(): Promise<ContratoWithRelations[]>;
  getContrato(id: string): Promise<ContratoWithRelations | undefined>;
  createContrato(contrato: InsertContrato): Promise<Contrato>;

  createEmpenho(empenho: InsertEmpenho): Promise<Empenho>;

  getAfs(): Promise<AfWithRelations[]>;
  createAf(af: InsertAf): Promise<Af>;
  updateAfEntrega(id: string, dataEntregaReal: string): Promise<Af>;
  notifyAf(id: string): Promise<Af>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getFornecedores(): Promise<Fornecedor[]> {
    return await db.select().from(fornecedores);
  }

  async getFornecedor(id: string): Promise<Fornecedor | undefined> {
    const [f] = await db.select().from(fornecedores).where(eq(fornecedores.id, id));
    return f;
  }

  async createFornecedor(f: InsertFornecedor): Promise<Fornecedor> {
    const [created] = await db.insert(fornecedores).values(f).returning();
    return created;
  }

  async updateFornecedor(id: string, f: Partial<InsertFornecedor>): Promise<Fornecedor> {
    const [updated] = await db.update(fornecedores).set(f).where(eq(fornecedores.id, id)).returning();
    return updated;
  }

  async getProcessosDigitais(): Promise<ProcessoDigitalWithRelations[]> {
    const procs = await db.query.processosDigitais.findMany({
      with: {
        fases: {
          with: { fornecedor: true }
        },
      }
    });
    return procs as ProcessoDigitalWithRelations[];
  }

  async getProcessoDigital(id: string): Promise<ProcessoDigitalWithRelations | undefined> {
    const proc = await db.query.processosDigitais.findFirst({
      where: eq(processosDigitais.id, id),
      with: {
        fases: {
          with: { fornecedor: true }
        },
      }
    });
    return proc as ProcessoDigitalWithRelations | undefined;
  }

  async createProcessoDigital(proc: InsertProcessoDigital): Promise<ProcessoDigital> {
    const [created] = await db.insert(processosDigitais).values(proc).returning();
    return created;
  }

  async getFases(): Promise<(FaseContratacao & { fornecedor: Fornecedor; processoDigital: ProcessoDigital })[]> {
    return await db.query.fasesContratacao.findMany({
      with: {
        fornecedor: true,
        processoDigital: true
      }
    });
  }

  async getFase(id: string): Promise<(FaseContratacao & { fornecedor: Fornecedor; processoDigital: ProcessoDigital }) | undefined> {
    return await db.query.fasesContratacao.findFirst({
      where: eq(fasesContratacao.id, id),
      with: {
        fornecedor: true,
        processoDigital: true
      }
    });
  }

  async createFaseContratacao(fase: InsertFaseContratacao): Promise<FaseContratacao> {
    const [created] = await db.insert(fasesContratacao).values(fase).returning();
    return created;
  }

  async updateFaseContratacao(id: string, fase: Partial<InsertFaseContratacao>): Promise<FaseContratacao> {
    const [updated] = await db.update(fasesContratacao).set(fase).where(eq(fasesContratacao.id, id)).returning();
    return updated;
  }

  async getContratos(): Promise<ContratoWithRelations[]> {
    const cs = await db.query.contratos.findMany({
      with: {
        processoDigital: true,
        faseContratacao: true,
        fornecedor: true,
        empenhos: {
          with: { afs: true }
        }
      }
    });
    return cs as ContratoWithRelations[];
  }

  async getContrato(id: string): Promise<ContratoWithRelations | undefined> {
    const c = await db.query.contratos.findFirst({
      where: eq(contratos.id, id),
      with: {
        processoDigital: true,
        faseContratacao: true,
        fornecedor: true,
        empenhos: {
          with: { afs: true }
        }
      }
    });
    return c as ContratoWithRelations | undefined;
  }

  async createContrato(c: InsertContrato): Promise<Contrato> {
    const [created] = await db.insert(contratos).values(c).returning();
    return created;
  }

  async createEmpenho(e: InsertEmpenho): Promise<Empenho> {
    const [created] = await db.insert(empenhos).values(e).returning();
    return created;
  }

  async getAfs(): Promise<AfWithRelations[]> {
    const afsData = await db.query.afs.findMany({
      with: {
        empenho: {
          with: {
            contrato: {
              with: {
                fornecedor: true,
                processoDigital: true
              }
            }
          }
        }
      }
    });
    return afsData as AfWithRelations[];
  }

  async createAf(af: InsertAf): Promise<Af> {
    // Calculando data_estimada_entrega (+30 dias)
    const dtPedido = new Date(af.dataPedidoAf);
    const dtEstimada = new Date(dtPedido.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const [created] = await db.insert(afs).values({
      ...af,
      dataEstimadaEntrega: dtEstimada.toISOString().split('T')[0],
      flagEntregaNotificada: false
    }).returning();
    return created;
  }

  async updateAfEntrega(id: string, dataEntregaReal: string): Promise<Af> {
    const [updated] = await db.update(afs).set({ dataEntregaReal }).where(eq(afs.id, id)).returning();
    return updated;
  }

  async notifyAf(id: string): Promise<Af> {
    const [updated] = await db.update(afs).set({ flagEntregaNotificada: true }).where(eq(afs.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
