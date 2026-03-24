import { db } from "./db";
import { count, eq } from "drizzle-orm";
import { 
  users, userEntes, entes, departamentos, fornecedores, processosDigitais, fasesContratacao, contratos, empenhos, afs, notasFiscais, contratoAditivos, contratoAnexos, passwordResetTokens, auditLogs,
  type User, type InsertUser, type Ente, type InsertEnte, type Departamento, type InsertDepartamento, type Fornecedor, type InsertFornecedor,
  type ProcessoDigital, type InsertProcessoDigital, type FaseContratacao, type InsertFaseContratacao,
  type Contrato, type InsertContrato, type Empenho, type InsertEmpenho, type Af, type InsertAf, type NotaFiscal, type InsertNotaFiscal,
  type ContratoAditivo, type InsertContratoAditivo, type ContratoAnexo, type InsertContratoAnexo,
  type ContratoWithRelations, type ProcessoDigitalWithRelations, type AfWithRelations, type NotaFiscalWithRelations, type AuditLog
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  getUserEnteIds(userId: string): Promise<string[]>;
  setUserEntes(userId: string, enteIds: string[]): Promise<void>;
  updateUser(id: string, user: { email: string; name: string; role: string; enteId?: string | null }): Promise<User | undefined>;
  updateUserPassword(id: string, password: string, forcePasswordChange?: boolean): Promise<User | undefined>;
  createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  getValidPasswordResetToken(tokenHash: string): Promise<{ id: string; userId: string } | undefined>;
  markPasswordResetTokenUsed(id: string): Promise<void>;
  invalidatePasswordResetTokensForUser(userId: string): Promise<void>;
  createAuditLog(log: { userId?: string | null; action: string; entity: string; entityId?: string | null; details?: string | null }): Promise<void>;
  getAuditLogs(): Promise<AuditLog[]>;

  getEntes(): Promise<Ente[]>;
  createEnte(ente: InsertEnte): Promise<Ente>;
  updateEnte(id: string, ente: Partial<InsertEnte>): Promise<Ente>;

  getDepartamentos(): Promise<Departamento[]>;
  getDepartamento(id: string): Promise<Departamento | undefined>;
  createDepartamento(departamento: InsertDepartamento): Promise<Departamento>;
  updateDepartamento(id: string, departamento: Partial<InsertDepartamento>): Promise<Departamento>;
  deleteDepartamento(id: string): Promise<Departamento | undefined>;

  getFornecedores(): Promise<Fornecedor[]>;
  getFornecedor(id: string): Promise<Fornecedor | undefined>;
  createFornecedor(fornecedor: InsertFornecedor): Promise<Fornecedor>;
  updateFornecedor(id: string, fornecedor: Partial<InsertFornecedor>): Promise<Fornecedor>;
  countContratosByFornecedor(fornecedorId: string): Promise<number>;
  countFasesByFornecedor(fornecedorId: string): Promise<number>;
  deleteFornecedor(id: string): Promise<Fornecedor | undefined>;

  getProcessosDigitais(): Promise<ProcessoDigitalWithRelations[]>;
  getProcessoDigital(id: string): Promise<ProcessoDigitalWithRelations | undefined>;
  createProcessoDigital(processo: InsertProcessoDigital): Promise<ProcessoDigital>;
  deleteProcessoDigital(id: string): Promise<ProcessoDigital | undefined>;
  
  getFases(): Promise<(FaseContratacao & { fornecedor: Fornecedor; processoDigital: ProcessoDigital })[]>;
  getFase(id: string): Promise<(FaseContratacao & { fornecedor: Fornecedor; processoDigital: ProcessoDigital }) | undefined>;
  createFaseContratacao(fase: InsertFaseContratacao): Promise<FaseContratacao>;
  updateFaseContratacao(id: string, fase: Partial<InsertFaseContratacao>): Promise<FaseContratacao>;
  deleteFaseContratacao(id: string): Promise<FaseContratacao | undefined>;

  getContratos(): Promise<ContratoWithRelations[]>;
  getContrato(id: string): Promise<ContratoWithRelations | undefined>;
  createContrato(contrato: InsertContrato): Promise<Contrato>;
  updateContrato(id: string, contrato: Partial<InsertContrato>): Promise<Contrato | undefined>;
  closeContrato(id: string, motivoEncerramento?: string): Promise<Contrato | undefined>;
  deleteContrato(id: string): Promise<Contrato | undefined>;
  createContratoAditivo(contratoId: string, aditivo: InsertContratoAditivo): Promise<ContratoAditivo>;
  getContratoAditivo(id: string): Promise<ContratoAditivo | undefined>;
  deleteContratoAditivo(id: string): Promise<ContratoAditivo | undefined>;
  createContratoAnexo(contratoId: string, anexo: InsertContratoAnexo): Promise<ContratoAnexo>;
  getContratoAnexo(id: string): Promise<ContratoAnexo | undefined>;
  deleteContratoAnexo(id: string): Promise<ContratoAnexo | undefined>;

  getEmpenho(id: string): Promise<(Empenho & { afs: Af[]; contrato: Contrato }) | undefined>;
  createEmpenho(empenho: InsertEmpenho): Promise<Empenho>;
  updateEmpenhoAnulacao(
    id: string,
    data: {
      status: string;
      valorAnulado: string;
      dataAnulacao: string;
      motivoAnulacao: string;
    },
  ): Promise<Empenho | undefined>;
  deleteEmpenho(id: string): Promise<Empenho | undefined>;

  getAfs(): Promise<AfWithRelations[]>;
  getAf(id: string): Promise<Af | undefined>;
  createAf(af: InsertAf): Promise<Af>;
  updateAfEntrega(id: string, dataEntregaReal: string): Promise<Af>;
  notifyAf(id: string): Promise<Af>;
  extendAf(id: string, dataExtensao: string): Promise<Af>;
  deleteAf(id: string): Promise<Af | undefined>;

  getNotasFiscais(): Promise<NotaFiscalWithRelations[]>;
  getNotaFiscal(id: string): Promise<NotaFiscalWithRelations | undefined>;
  createNotaFiscal(nota: InsertNotaFiscal): Promise<NotaFiscal>;
  updateNotaFiscalPagamento(
    id: string,
    data: {
      statusPagamento: string;
      numeroProcessoPagamento?: string | null;
      dataEnvioPagamento?: string | null;
      dataPagamento?: string | null;
    },
  ): Promise<NotaFiscal>;
  deleteNotaFiscal(id: string): Promise<NotaFiscal | undefined>;
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

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserEnteIds(userId: string): Promise<string[]> {
    const rows = await db.select().from(userEntes).where(eq(userEntes.userId, userId));
    return rows.map((row) => row.enteId);
  }

  async setUserEntes(userId: string, enteIds: string[]): Promise<void> {
    await db.delete(userEntes).where(eq(userEntes.userId, userId));
    if (enteIds.length === 0) {
      return;
    }
    await db.insert(userEntes).values(
      enteIds.map((enteId) => ({
        userId,
        enteId,
      })),
    );
  }

  async updateUser(id: string, user: { email: string; name: string; role: string; enteId?: string | null }): Promise<User | undefined> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async getEntes(): Promise<Ente[]> {
    return await db.select().from(entes);
  }

  async createEnte(ente: InsertEnte): Promise<Ente> {
    const [created] = await db.insert(entes).values(ente).returning();
    return created;
  }

  async updateEnte(id: string, ente: Partial<InsertEnte>): Promise<Ente> {
    const [updated] = await db.update(entes).set(ente).where(eq(entes.id, id)).returning();
    return updated;
  }

  async updateUserPassword(id: string, password: string, forcePasswordChange = false): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ password, forcePasswordChange }).where(eq(users.id, id)).returning();
    return updated;
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });
  }

  async getValidPasswordResetToken(tokenHash: string): Promise<{ id: string; userId: string } | undefined> {
    const now = new Date();
    const tokens = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
    const token = tokens.find((item) => !item.usedAt && item.expiresAt > now);
    if (!token) return undefined;
    return { id: token.id, userId: token.userId };
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
  }

  async invalidatePasswordResetTokensForUser(userId: string): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.userId, userId));
  }

  async createAuditLog(log: { userId?: string | null; action: string; entity: string; entityId?: string | null; details?: string | null }): Promise<void> {
    await db.insert(auditLogs).values({
      userId: log.userId ?? null,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId ?? null,
      details: log.details ?? null,
    });
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs);
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

  async countContratosByFornecedor(fornecedorId: string): Promise<number> {
    const [result] = await db
      .select({ value: count() })
      .from(contratos)
      .where(eq(contratos.fornecedorId, fornecedorId));
    return result?.value ?? 0;
  }

  async countFasesByFornecedor(fornecedorId: string): Promise<number> {
    const [result] = await db
      .select({ value: count() })
      .from(fasesContratacao)
      .where(eq(fasesContratacao.fornecedorId, fornecedorId));
    return result?.value ?? 0;
  }

  async deleteFornecedor(id: string): Promise<Fornecedor | undefined> {
    const [deleted] = await db.delete(fornecedores).where(eq(fornecedores.id, id)).returning();
    return deleted;
  }

  async getProcessosDigitais(): Promise<ProcessoDigitalWithRelations[]> {
    const procs = await db.query.processosDigitais.findMany({
      with: {
        fases: {
          with: { fornecedor: true }
        },
        departamento: {
          with: { ente: true },
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
        departamento: {
          with: { ente: true },
        },
      }
    });
    return proc as ProcessoDigitalWithRelations | undefined;
  }

  async createProcessoDigital(proc: InsertProcessoDigital): Promise<ProcessoDigital> {
    const [created] = await db.insert(processosDigitais).values(proc).returning();
    return created;
  }

  async updateProcessoDigital(id: string, proc: Partial<InsertProcessoDigital>): Promise<ProcessoDigital> {
    const [updated] = await db.update(processosDigitais).set(proc).where(eq(processosDigitais.id, id)).returning();
    return updated;
  }

  async deleteProcessoDigital(id: string): Promise<ProcessoDigital | undefined> {
    const [deleted] = await db.delete(processosDigitais).where(eq(processosDigitais.id, id)).returning();
    return deleted;
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

  async deleteFaseContratacao(id: string): Promise<FaseContratacao | undefined> {
    const [deleted] = await db.delete(fasesContratacao).where(eq(fasesContratacao.id, id)).returning();
    return deleted;
  }

  async getContratos(): Promise<ContratoWithRelations[]> {
    const cs = await db.query.contratos.findMany({
      with: {
        processoDigital: {
          with: {
            departamento: {
              with: { ente: true },
            },
          },
        },
        faseContratacao: true,
        fornecedor: true,
        empenhos: {
          with: { afs: true }
        },
        notasFiscais: true,
        aditivos: true,
        anexos: true,
      }
    });
    return cs as ContratoWithRelations[];
  }

  async getContrato(id: string): Promise<ContratoWithRelations | undefined> {
    const c = await db.query.contratos.findFirst({
      where: eq(contratos.id, id),
      with: {
        processoDigital: {
          with: {
            departamento: {
              with: { ente: true },
            },
          },
        },
        faseContratacao: true,
        fornecedor: true,
        empenhos: {
          with: { afs: true }
        },
        notasFiscais: true,
        aditivos: true,
        anexos: true,
      }
    });
    return c as ContratoWithRelations | undefined;
  }

  async createContrato(c: InsertContrato): Promise<Contrato> {
    const [created] = await db.insert(contratos).values(c).returning();
    return created;
  }

  async updateContrato(id: string, c: Partial<InsertContrato>): Promise<Contrato | undefined> {
    const [updated] = await db.update(contratos).set(c).where(eq(contratos.id, id)).returning();
    return updated;
  }

  async closeContrato(id: string, motivoEncerramento?: string): Promise<Contrato | undefined> {
    const [updated] = await db
      .update(contratos)
      .set({
        status: "encerrado",
        encerradoEm: new Date().toISOString().slice(0, 10),
        motivoEncerramento: motivoEncerramento ?? null,
      })
      .where(eq(contratos.id, id))
      .returning();
    return updated;
  }

  async deleteContrato(id: string): Promise<Contrato | undefined> {
    const [deleted] = await db.delete(contratos).where(eq(contratos.id, id)).returning();
    return deleted;
  }

  async createContratoAditivo(contratoId: string, aditivo: InsertContratoAditivo): Promise<ContratoAditivo> {
    const [created] = await db.insert(contratoAditivos).values({ ...aditivo, contratoId }).returning();
    return created;
  }

  async getContratoAditivo(id: string): Promise<ContratoAditivo | undefined> {
    const [aditivo] = await db.select().from(contratoAditivos).where(eq(contratoAditivos.id, id));
    return aditivo;
  }

  async deleteContratoAditivo(id: string): Promise<ContratoAditivo | undefined> {
    const [deleted] = await db.delete(contratoAditivos).where(eq(contratoAditivos.id, id)).returning();
    return deleted;
  }

  async createContratoAnexo(contratoId: string, anexo: InsertContratoAnexo): Promise<ContratoAnexo> {
    const [created] = await db.insert(contratoAnexos).values({ ...anexo, contratoId }).returning();
    return created;
  }

  async getContratoAnexo(id: string): Promise<ContratoAnexo | undefined> {
    const [anexo] = await db.select().from(contratoAnexos).where(eq(contratoAnexos.id, id));
    return anexo;
  }

  async deleteContratoAnexo(id: string): Promise<ContratoAnexo | undefined> {
    const [deleted] = await db.delete(contratoAnexos).where(eq(contratoAnexos.id, id)).returning();
    return deleted;
  }

  async getEmpenho(id: string): Promise<(Empenho & { afs: Af[]; contrato: Contrato }) | undefined> {
    return await db.query.empenhos.findFirst({
      where: eq(empenhos.id, id),
      with: {
        afs: true,
        contrato: true,
      }
    });
  }

  async createEmpenho(e: InsertEmpenho): Promise<Empenho> {
    const [created] = await db.insert(empenhos).values({
      ...e,
      status: "ativo",
      valorAnulado: "0",
      dataAnulacao: null,
      motivoAnulacao: null,
    }).returning();
    return created;
  }

  async updateEmpenhoAnulacao(
    id: string,
    data: {
      status: string;
      valorAnulado: string;
      dataAnulacao: string;
      motivoAnulacao: string;
    },
  ): Promise<Empenho | undefined> {
    const [updated] = await db.update(empenhos).set(data).where(eq(empenhos.id, id)).returning();
    return updated;
  }

  async deleteEmpenho(id: string): Promise<Empenho | undefined> {
    const [deleted] = await db.delete(empenhos).where(eq(empenhos.id, id)).returning();
    return deleted;
  }

  async getAfs(): Promise<AfWithRelations[]> {
    const afsData = await db.query.afs.findMany({
      with: {
        empenho: {
          with: {
            contrato: {
              with: {
                fornecedor: true,
                processoDigital: {
                  with: {
                    departamento: {
                      with: { ente: true },
                    },
                  },
                }
              }
            }
          }
        }
      }
    });
    return afsData as AfWithRelations[];
  }

  async getAf(id: string): Promise<Af | undefined> {
    const [af] = await db.select().from(afs).where(eq(afs.id, id));
    return af;
  }

  async createAf(af: InsertAf): Promise<Af> {
    const [year, month, day] = af.dataPedidoAf.split("-").map(Number);
    const dtEstimada = new Date(Date.UTC(year, month - 1, day + 30));
    
    const [created] = await db.insert(afs).values({
      ...af,
      dataEstimadaEntrega: dtEstimada.toISOString().slice(0, 10),
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

  async extendAf(id: string, dataExtensao: string): Promise<Af> {
    const [updated] = await db.update(afs).set({ dataExtensao }).where(eq(afs.id, id)).returning();
    return updated;
  }

  async deleteAf(id: string): Promise<Af | undefined> {
    const [deleted] = await db.delete(afs).where(eq(afs.id, id)).returning();
    return deleted;
  }

  async getDepartamentos(): Promise<Departamento[]> {
    return await db.select().from(departamentos);
  }

  async getDepartamento(id: string): Promise<Departamento | undefined> {
    const [d] = await db.select().from(departamentos).where(eq(departamentos.id, id));
    return d;
  }

  async createDepartamento(d: InsertDepartamento): Promise<Departamento> {
    const [created] = await db.insert(departamentos).values(d).returning();
    return created;
  }

  async updateDepartamento(id: string, d: Partial<InsertDepartamento>): Promise<Departamento> {
    const [updated] = await db.update(departamentos).set(d).where(eq(departamentos.id, id)).returning();
    return updated;
  }

  async deleteDepartamento(id: string): Promise<Departamento | undefined> {
    const [deleted] = await db.delete(departamentos).where(eq(departamentos.id, id)).returning();
    return deleted;
  }

  async getNotasFiscais(): Promise<NotaFiscalWithRelations[]> {
    return await db.query.notasFiscais.findMany({
      with: {
        contrato: {
          with: {
            processoDigital: {
              with: {
                departamento: {
                  with: { ente: true },
                },
              },
            },
            fornecedor: true
          }
        }
      }
    });
  }

  async getNotaFiscal(id: string): Promise<NotaFiscalWithRelations | undefined> {
    return await db.query.notasFiscais.findFirst({
      where: eq(notasFiscais.id, id),
      with: {
        contrato: {
          with: {
            processoDigital: {
              with: {
                departamento: {
                  with: { ente: true },
                },
              },
            },
            fornecedor: true,
          },
        },
      },
    });
  }

  async createNotaFiscal(nota: InsertNotaFiscal): Promise<NotaFiscal> {
    const [created] = await db.insert(notasFiscais).values({
      ...nota,
      statusPagamento: "nota_recebida",
      numeroProcessoPagamento: null,
      dataEnvioPagamento: null,
      dataPagamento: null,
    }).returning();
    return created;
  }

  async updateNotaFiscalPagamento(
    id: string,
    data: {
      statusPagamento: string;
      numeroProcessoPagamento?: string | null;
      dataEnvioPagamento?: string | null;
      dataPagamento?: string | null;
    },
  ): Promise<NotaFiscal> {
    const [updated] = await db.update(notasFiscais).set(data).where(eq(notasFiscais.id, id)).returning();
    return updated;
  }

  async deleteNotaFiscal(id: string): Promise<NotaFiscal | undefined> {
    const [deleted] = await db.delete(notasFiscais).where(eq(notasFiscais.id, id)).returning();
    return deleted;
  }
}

export const storage = new DatabaseStorage();
