import { db } from "./db";
import { count, desc, eq, inArray } from "drizzle-orm";
import { 
  users, userEntes, entes, departamentos, fornecedores, fontesRecurso, fichasOrcamentarias, processosDigitais, fasesContratacao, contratos, empenhos, afs, notasFiscais, contratoAditivos, contratoAnexos, passwordResetTokens, auditLogs,
  projetosAtividade, processoItens, processoItemQuantidades, processoItemCotacoes, processoItemResultados, processoParticipantes, processoDotacoes,
  classificacoesOrcamentarias,
  type User, type InsertUser, type Ente, type InsertEnte, type Departamento, type InsertDepartamento, type Fornecedor, type InsertFornecedor,
  type FonteRecurso, type InsertFonteRecurso, type FichaOrcamentaria, type InsertFichaOrcamentaria, type ProjetoAtividade, type InsertProjetoAtividade,
  type ClassificacaoOrcamentaria, type InsertClassificacao,
  type ProcessoDigital, type InsertProcessoDigital, type FaseContratacao, type InsertFaseContratacao,
  type Contrato, type InsertContrato, type Empenho, type InsertEmpenho, type Af, type InsertAf, type NotaFiscal, type InsertNotaFiscal,
  type ContratoAditivo, type InsertContratoAditivo, type ContratoAnexo, type InsertContratoAnexo, type FonteRecursoWithFichas,
  type ContratoWithRelations, type ProcessoDigitalWithRelations, type AfWithRelations, type NotaFiscalWithRelations, type AuditLogResponse, type EmpenhoWithRelations
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  getUserEnteIds(userId: string): Promise<string[]>;
  setUserEntes(userId: string, enteIds: string[]): Promise<void>;
  updateUser(id: string, user: { email: string; name: string; role: string; enteId?: string | null; canAccessAtaModule?: boolean }): Promise<User | undefined>;
  updateUserPassword(id: string, password: string, forcePasswordChange?: boolean): Promise<User | undefined>;
  createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  getValidPasswordResetToken(tokenHash: string): Promise<{ id: string; userId: string } | undefined>;
  markPasswordResetTokenUsed(id: string): Promise<void>;
  invalidatePasswordResetTokensForUser(userId: string): Promise<void>;
  createAuditLog(log: { userId?: string | null; action: string; entity: string; entityId?: string | null; details?: string | null }): Promise<void>;
  getAuditLogs(): Promise<AuditLogResponse[]>;

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

  getFontesRecurso(): Promise<FonteRecursoWithFichas[]>;
  getFonteRecurso(id: string): Promise<FonteRecursoWithFichas | undefined>;
  createFonteRecurso(data: InsertFonteRecurso): Promise<FonteRecurso>;
  updateFonteRecurso(id: string, data: Partial<InsertFonteRecurso>): Promise<FonteRecurso | undefined>;
  deleteFonteRecurso(id: string): Promise<FonteRecurso | undefined>;
  getFicha(id: string): Promise<FichaOrcamentaria | undefined>;
  createFicha(data: InsertFichaOrcamentaria): Promise<FichaOrcamentaria>;
  updateFicha(id: string, data: Partial<InsertFichaOrcamentaria>): Promise<FichaOrcamentaria | undefined>;
  deleteFicha(id: string): Promise<FichaOrcamentaria | undefined>;
  getProjetoAtividade(id: string): Promise<ProjetoAtividade | undefined>;
  createProjetoAtividade(data: InsertProjetoAtividade): Promise<ProjetoAtividade>;
  updateProjetoAtividade(id: string, data: Partial<InsertProjetoAtividade>): Promise<ProjetoAtividade | undefined>;
  deleteProjetoAtividade(id: string): Promise<ProjetoAtividade | undefined>;
  
  getClassificacoesOrcamentarias(): Promise<ClassificacaoOrcamentaria[]>;
  getClassificacaoOrcamentaria(id: string): Promise<ClassificacaoOrcamentaria | undefined>;
  createClassificacaoOrcamentaria(data: InsertClassificacao): Promise<ClassificacaoOrcamentaria>;
  updateClassificacaoOrcamentaria(id: string, data: Partial<InsertClassificacao>): Promise<ClassificacaoOrcamentaria | undefined>;
  deleteClassificacaoOrcamentaria(id: string): Promise<ClassificacaoOrcamentaria | undefined>;


  getProcessosDigitais(): Promise<ProcessoDigitalWithRelations[]>;
  getProcessoDigital(id: string): Promise<ProcessoDigitalWithRelations | undefined>;
  createProcessoDigital(processo: InsertProcessoDigital): Promise<ProcessoDigital>;
  updateProcessoDigital(id: string, proc: Partial<InsertProcessoDigital>): Promise<ProcessoDigital>;
  syncFasesFromProcesso(processoId: string, data: { enteId?: string | null; departamentoId?: string | null }): Promise<void>;
  deleteProcessoDigital(id: string): Promise<ProcessoDigital | undefined>;
  addProcessoParticipante(processoId: string, enteId: string): Promise<void>;
  removeProcessoParticipante(processoId: string, enteId: string): Promise<void>;
  
  getFases(): Promise<(FaseContratacao & { fornecedor: Fornecedor; processoDigital: ProcessoDigital; ente: Ente | null; departamento: Departamento | null })[]>;
  getFase(id: string): Promise<(FaseContratacao & { fornecedor: Fornecedor; processoDigital: ProcessoDigital; ente: Ente | null; departamento: Departamento | null }) | undefined>;
  createFaseContratacao(fase: InsertFaseContratacao): Promise<FaseContratacao>;
  updateFaseContratacao(id: string, fase: Partial<InsertFaseContratacao>): Promise<FaseContratacao>;
  syncContratosFromFase(faseId: string, data: { enteId?: string | null; departamentoId?: string | null }): Promise<void>;
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

  getEmpenho(id: string): Promise<EmpenhoWithRelations | undefined>;
  createEmpenho(empenho: InsertEmpenho): Promise<Empenho>;
  updateEmpenho(id: string, empenho: Partial<InsertEmpenho>): Promise<Empenho | undefined>;
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
  updateAf(id: string, af: Partial<InsertAf>): Promise<Af>;
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

  async updateUser(id: string, user: { email: string; name: string; role: string; enteId?: string | null; canAccessAtaModule?: boolean }): Promise<User | undefined> {
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

  async getAuditLogs(): Promise<AuditLogResponse[]> {
    const rows = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userName: users.name,
        userEmail: users.email,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt));

    return rows.map((row) => ({
      ...row,
      userName: row.userName ?? null,
      userEmail: row.userEmail ?? null,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    }));
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

  async countContratosByProcesso(processoDigitalId: string): Promise<number> {
    const [result] = await db
      .select({ value: count() })
      .from(contratos)
      .where(eq(contratos.processoDigitalId, processoDigitalId));
    return result?.value ?? 0;
  }

  async countContratosByFase(faseContratacaoId: string): Promise<number> {
    const [result] = await db
      .select({ value: count() })
      .from(contratos)
      .where(eq(contratos.faseContratacaoId, faseContratacaoId));
    return result?.value ?? 0;
  }

  async countEmpenhosByFicha(fichaId: string): Promise<number> {
    const [result] = await db
      .select({ value: count() })
      .from(empenhos)
      .where(eq(empenhos.fichaId, fichaId));
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

  async getFontesRecurso(): Promise<FonteRecursoWithFichas[]> {
    const rows = await db.query.fontesRecurso.findMany({
      with: {
        fichas: {
          with: {
            classificacao: true,
          }
        },
        projetosAtividade: true,
      },
    });
    return rows as any;
  }

  async getFonteRecurso(id: string): Promise<FonteRecursoWithFichas | undefined> {
    const row = await db.query.fontesRecurso.findFirst({
      where: eq(fontesRecurso.id, id),
      with: {
        fichas: {
          with: {
            classificacao: true,
          }
        },
        projetosAtividade: true,
      },
    });
    return row as any;
  }

  async createFonteRecurso(data: InsertFonteRecurso): Promise<FonteRecurso> {
    const [created] = await db.insert(fontesRecurso).values(data).returning();
    return created;
  }

  async updateFonteRecurso(id: string, data: Partial<InsertFonteRecurso>): Promise<FonteRecurso | undefined> {
    const [updated] = await db.update(fontesRecurso).set(data).where(eq(fontesRecurso.id, id)).returning();
    return updated;
  }

  async deleteFonteRecurso(id: string): Promise<FonteRecurso | undefined> {
    const [deleted] = await db.delete(fontesRecurso).where(eq(fontesRecurso.id, id)).returning();
    return deleted;
  }

  async getFicha(id: string): Promise<FichaOrcamentaria | undefined> {
    const row = await db.query.fichasOrcamentarias.findFirst({
      where: eq(fichasOrcamentarias.id, id),
      with: {
        classificacao: true,
      },
    });
    return row as any;
  }

  async createFicha(data: InsertFichaOrcamentaria): Promise<FichaOrcamentaria> {
    const [created] = await db.insert(fichasOrcamentarias).values(data).returning();
    const full = await this.getFicha(created.id);
    return full!;
  }

  async updateFicha(id: string, data: Partial<InsertFichaOrcamentaria>): Promise<FichaOrcamentaria | undefined> {
    await db.update(fichasOrcamentarias).set(data).where(eq(fichasOrcamentarias.id, id));
    return await this.getFicha(id);
  }

  async deleteFicha(id: string): Promise<FichaOrcamentaria | undefined> {
    const [deleted] = await db.delete(fichasOrcamentarias).where(eq(fichasOrcamentarias.id, id)).returning();
    return deleted as any;
  }

  async getClassificacoesOrcamentarias(): Promise<ClassificacaoOrcamentaria[]> {
    return await db.select().from(classificacoesOrcamentarias).orderBy(desc(classificacoesOrcamentarias.criadoEm));
  }

  async getClassificacaoOrcamentaria(id: string): Promise<ClassificacaoOrcamentaria | undefined> {
    const [row] = await db.select().from(classificacoesOrcamentarias).where(eq(classificacoesOrcamentarias.id, id));
    return row;
  }

  async createClassificacaoOrcamentaria(data: InsertClassificacao): Promise<ClassificacaoOrcamentaria> {
    const [created] = await db.insert(classificacoesOrcamentarias).values(data).returning();
    return created;
  }

  async updateClassificacaoOrcamentaria(id: string, data: Partial<InsertClassificacao>): Promise<ClassificacaoOrcamentaria | undefined> {
    const [updated] = await db.update(classificacoesOrcamentarias).set(data).where(eq(classificacoesOrcamentarias.id, id)).returning();
    return updated;
  }

  async deleteClassificacaoOrcamentaria(id: string): Promise<ClassificacaoOrcamentaria | undefined> {
    const [deleted] = await db.delete(classificacoesOrcamentarias).where(eq(classificacoesOrcamentarias.id, id)).returning();
    return deleted;
  }

  async getProjetoAtividade(id: string): Promise<ProjetoAtividade | undefined> {
    const [projetoAtividade] = await db.select().from(projetosAtividade).where(eq(projetosAtividade.id, id));
    return projetoAtividade;
  }

  async createProjetoAtividade(data: InsertProjetoAtividade): Promise<ProjetoAtividade> {
    const [created] = await db.insert(projetosAtividade).values(data).returning();
    return created;
  }

  async updateProjetoAtividade(id: string, data: Partial<InsertProjetoAtividade>): Promise<ProjetoAtividade | undefined> {
    const [updated] = await db.update(projetosAtividade).set(data).where(eq(projetosAtividade.id, id)).returning();
    return updated;
  }

  async deleteProjetoAtividade(id: string): Promise<ProjetoAtividade | undefined> {
    const [deleted] = await db.delete(projetosAtividade).where(eq(projetosAtividade.id, id)).returning();
    return deleted;
  }

  async getProcessosDigitais(): Promise<ProcessoDigitalWithRelations[]> {
    const procs = await db.query.processosDigitais.findMany({
      with: {
        ente: true,
        departamento: true,
        fases: {
          with: { fornecedor: true, ente: true, departamento: true }
        },
        participantes: {
          with: { ente: true }
        },
        itens: {
          with: {
            quantidades: { with: { ente: true } },
            cotacao: true,
            resultado: { with: { fornecedor: true } }
          }
        },
        dotacoes: {
          with: { fichaOrcamentaria: true }
        },
      }
    });
    return procs as any;
  }

  async getProcessoDigital(id: string): Promise<ProcessoDigitalWithRelations | undefined> {
    const proc = await db.query.processosDigitais.findFirst({
      where: eq(processosDigitais.id, id),
      with: {
        fases: {
          with: { fornecedor: true, ente: true, departamento: true }
        },
        ente: true,
        departamento: true,
        participantes: {
          with: { ente: true },
        },
        dotacoes: {
          with: { fichaOrcamentaria: true },
        },
        itens: {
          with: {
            quantidades: { with: { ente: true } },
            cotacao: true,
            resultado: { with: { fornecedor: true } }
          }
        }
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

  async syncFasesFromProcesso(processoId: string, data: { enteId?: string | null; departamentoId?: string | null }): Promise<void> {
    await db
      .update(fasesContratacao)
      .set({
        ...(data.enteId !== undefined ? { enteId: data.enteId } : {}),
        ...(data.departamentoId !== undefined ? { departamentoId: data.departamentoId } : {}),
      })
      .where(eq(fasesContratacao.processoDigitalId, processoId));

    await db
      .update(contratos)
      .set({
        ...(data.enteId !== undefined ? { enteId: data.enteId } : {}),
        ...(data.departamentoId !== undefined ? { departamentoId: data.departamentoId } : {}),
      })
      .where(eq(contratos.processoDigitalId, processoId));
  }

  async deleteProcessoDigital(id: string): Promise<ProcessoDigital | undefined> {
    const [deleted] = await db.delete(processosDigitais).where(eq(processosDigitais.id, id)).returning();
    return deleted;
  }

  async addProcessoParticipante(processoId: string, enteId: string): Promise<void> {
    await db.insert(processoParticipantes).values({ processoId, enteId }).onConflictDoNothing();
  }

  async removeProcessoParticipante(processoId: string, enteId: string): Promise<void> {
    const records = await db.select().from(processoParticipantes).where(eq(processoParticipantes.processoId, processoId));
    const target = records.find(r => r.enteId === enteId);
    if (target) {
      await db.delete(processoParticipantes).where(eq(processoParticipantes.id, target.id));
    }
  }

  // --- Processo Itens Implementation ---
  async getProcessoItens(processoId: string): Promise<any[]> {
    return await db.query.processoItens.findMany({
      where: eq(processoItens.processoId, processoId),
      with: {
        quantidades: {
          with: { ente: true },
        },
        cotacao: true,
        resultado: {
          with: { fornecedor: true },
        },
      },
    });
  }

  async createProcessoItem(item: any): Promise<any> {
    const [created] = await db.insert(processoItens).values(item).returning();
    return created;
  }

  async updateProcessoItem(id: string, item: any): Promise<any> {
    const [updated] = await db.update(processoItens).set(item).where(eq(processoItens.id, id)).returning();
    return updated;
  }

  async deleteProcessoItem(id: string): Promise<any> {
    const [deleted] = await db.delete(processoItens).where(eq(processoItens.id, id)).returning();
    return deleted;
  }

  async createProcessoItemQuantidade(data: any): Promise<any> {
    const [created] = await db.insert(processoItemQuantidades).values(data).returning();
    return created;
  }

  async updateProcessoItemQuantidade(id: string, data: any): Promise<any> {
    const [updated] = await db.update(processoItemQuantidades).set(data).where(eq(processoItemQuantidades.id, id)).returning();
    return updated;
  }

  async deleteProcessoItemQuantidade(id: string): Promise<any> {
    const [deleted] = await db.delete(processoItemQuantidades).where(eq(processoItemQuantidades.id, id)).returning();
    return deleted;
  }

  async createProcessoItemCotacao(data: any): Promise<any> {
    const [created] = await db.insert(processoItemCotacoes).values(data).returning();
    return created;
  }

  async updateProcessoItemCotacao(id: string, data: any): Promise<any> {
    const [updated] = await db.update(processoItemCotacoes).set(data).where(eq(processoItemCotacoes.id, id)).returning();
    return updated;
  }

  async createProcessoItemResultado(data: any): Promise<any> {
    const [created] = await db.insert(processoItemResultados).values(data).returning();
    return created;
  }

  async updateProcessoItemResultado(id: string, data: any): Promise<any> {
    const [updated] = await db.update(processoItemResultados).set(data).where(eq(processoItemResultados.id, id)).returning();
    return updated;
  }

  async deleteProcessoItemResultado(id: string): Promise<any> {
    const [deleted] = await db.delete(processoItemResultados).where(eq(processoItemResultados.id, id)).returning();
    return deleted;
  }

  async saveProcessoQuantidades(processoId: string, quantidades: any[]): Promise<void> {
    const itens = await db.select({ id: processoItens.id }).from(processoItens).where(eq(processoItens.processoId, processoId));
    const itemIds = itens.map(i => i.id);
    if (itemIds.length > 0) {
      await db.delete(processoItemQuantidades).where(inArray(processoItemQuantidades.itemId, itemIds));
    }
    if (quantidades.length > 0) {
      for (const q of quantidades) {
        if (Number(q.quantidade || 0) > 0) await db.insert(processoItemQuantidades).values(q);
      }
    }
  }

  async saveProcessoCotacoes(processoId: string, cotacoes: any[]): Promise<void> {
    const itens = await db.select({ id: processoItens.id }).from(processoItens).where(eq(processoItens.processoId, processoId));
    const itemIds = itens.map(i => i.id);
    if (itemIds.length > 0) {
      await db.delete(processoItemCotacoes).where(inArray(processoItemCotacoes.itemId, itemIds));
    }
    if (cotacoes.length > 0) {
      for (const c of cotacoes) {
         if (Number(c.valorUnitarioCotado || 0) > 0) await db.insert(processoItemCotacoes).values(c);
      }
    }
  }

  async saveProcessoResultados(processoId: string, resultados: any[]): Promise<void> {
    const itens = await db.select({ id: processoItens.id }).from(processoItens).where(eq(processoItens.processoId, processoId));
    const itemIds = itens.map(i => i.id);
    if (itemIds.length > 0) {
      await db.delete(processoItemResultados).where(inArray(processoItemResultados.itemId, itemIds));
    }
    if (resultados.length > 0) {
      for (const r of resultados) {
         if (r.itemFracassado || Number(r.valorUnitarioLicitado || 0) > 0) await db.insert(processoItemResultados).values({
            ...r,
            valorUnitarioLicitado: r.itemFracassado ? null : r.valorUnitarioLicitado,
            fornecedorId: r.itemFracassado ? null : r.fornecedorId
         });
      }
    }
  }

  async addProcessoDotacao(data: { processoId: string; fichaOrcamentariaId: string; anoDotacao: string; valorEstimado?: string }): Promise<any> {
    const [created] = await db.insert(processoDotacoes).values(data).returning();
    return created;
  }

  async removeProcessoDotacao(dotacaoId: string): Promise<void> {
    await db.delete(processoDotacoes).where(eq(processoDotacoes.id, dotacaoId));
  }

  async getProcessoDotacoes(processoId: string): Promise<any[]> {
    return await db.query.processoDotacoes.findMany({
      where: eq(processoDotacoes.processoId, processoId),
      with: { fichaOrcamentaria: true },
    });
  }

  async getFases(): Promise<(FaseContratacao & { fornecedor: Fornecedor; processoDigital: ProcessoDigital; ente: Ente | null; departamento: Departamento | null })[]> {
    return await db.query.fasesContratacao.findMany({
      with: {
        fornecedor: true,
        processoDigital: {
          with: {
            ente: true,
            departamento: true,
          },
        },
        ente: true,
        departamento: true,
      }
    });
  }

  async getFase(id: string): Promise<(FaseContratacao & { fornecedor: Fornecedor; processoDigital: ProcessoDigital; ente: Ente | null; departamento: Departamento | null }) | undefined> {
    return await db.query.fasesContratacao.findFirst({
      where: eq(fasesContratacao.id, id),
      with: {
        fornecedor: true,
        processoDigital: {
          with: {
            ente: true,
            departamento: true,
          },
        },
        ente: true,
        departamento: true,
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

  async syncContratosFromFase(faseId: string, data: { enteId?: string | null; departamentoId?: string | null }): Promise<void> {
    await db
      .update(contratos)
      .set({
        ...(data.enteId !== undefined ? { enteId: data.enteId } : {}),
        ...(data.departamentoId !== undefined ? { departamentoId: data.departamentoId } : {}),
      })
      .where(eq(contratos.faseContratacaoId, faseId));
  }

  async deleteFaseContratacao(id: string): Promise<FaseContratacao | undefined> {
    const [deleted] = await db.delete(fasesContratacao).where(eq(fasesContratacao.id, id)).returning();
    return deleted;
  }

  async getContratos(): Promise<ContratoWithRelations[]> {
    // Basic fetch with manual relation mapping for stability
    const results = await db.query.contratos.findMany({
      with: {
        ente: true,
        departamento: true,
        fornecedor: true,
        empenhos: { with: { afs: true, fonteRecurso: true, ficha: { with: { classificacao: true } } } },
        notasFiscais: true,
        aditivos: true,
        anexos: true,
      }
    });
    
    // Fetch processosDigitais separately and map them to avoid the deep join bug
    const procIds = results.map(c => c.processoDigitalId);
    const procs = await db.query.processosDigitais.findMany({
      where: inArray(processosDigitais.id, procIds),
      with: {
        ente: true,
        departamento: true,
        fases: { with: { fornecedor: true } },
      }
    });

    // Fetch faseContratacao separately
    const faseIds = results.map(c => c.faseContratacaoId);
    const fases = await db.query.fasesContratacao.findMany({
      where: inArray(fasesContratacao.id, faseIds),
      with: {
        fornecedor: true,
        ente: true,
        departamento: true,
      }
    });

    return results.map(c => ({
      ...c,
      processoDigital: procs.find(p => p.id === c.processoDigitalId),
      faseContratacao: fases.find(f => f.id === c.faseContratacaoId),
    })) as unknown as ContratoWithRelations[];
  }

  async getContratosLight(): Promise<ContratoWithRelations[]> {
    const cs = await db.query.contratos.findMany({
      with: {
        processoDigital: {
          with: {
            ente: true,
            departamento: true,
          },
        },
        faseContratacao: {
          with: { fornecedor: true, ente: true, departamento: true },
        },
        ente: true,
        departamento: true,
        fornecedor: true,
        empenhos: {
          with: {
            fonteRecurso: true,
            ficha: { with: { classificacao: true } },
            afs: true,
          },
        },
        notasFiscais: true,
        aditivos: true,
        anexos: true,
      }
    });
    return cs as unknown as ContratoWithRelations[];
  }

  async getContrato(id: string): Promise<ContratoWithRelations | undefined> {
    const c = await db.query.contratos.findFirst({
      where: eq(contratos.id, id),
      with: {
        processoDigital: {
          with: {
            ente: true,
            departamento: true,
            fases: { with: { fornecedor: true } },
          },
        },
        faseContratacao: {
          with: { fornecedor: true, ente: true, departamento: true },
        },
        ente: true,
        departamento: true,
        fornecedor: true,
        empenhos: { with: { afs: true, fonteRecurso: true, ficha: { with: { classificacao: true } } } },
        notasFiscais: true,
        aditivos: true,
        anexos: true,
      }
    });
    return c as unknown as ContratoWithRelations | undefined;
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

  async getEmpenho(id: string): Promise<EmpenhoWithRelations | undefined> {
    const emp = await db.query.empenhos.findFirst({
      where: eq(empenhos.id, id),
      with: {
        contrato: {
          with: {
            processoDigital: {
              with: {
                ente: true,
              }
            }
          }
        },
        fonteRecurso: true,
        ficha: true,
        afs: true,
      },
    });
    return emp as EmpenhoWithRelations | undefined;
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

  async updateEmpenho(id: string, e: Partial<InsertEmpenho>): Promise<Empenho | undefined> {
    const [updated] = await db.update(empenhos).set(e).where(eq(empenhos.id, id)).returning();
    return updated;
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
    const [updated] = await db.update(empenhos).set(data as any).where(eq(empenhos.id, id)).returning();
    return updated;
  }

  async deleteEmpenho(id: string): Promise<Empenho | undefined> {
    const [deleted] = await db.delete(empenhos).where(eq(empenhos.id, id)).returning();
    return deleted;
  }

  async getAfs(): Promise<AfWithRelations[]> {
    const results = await db.query.afs.findMany({
      with: {
        empenho: {
          with: {
            contrato: {
              with: {
                fornecedor: true,
                processoDigital: {
                  with: {
                    ente: true,
                  }
                }
              }
            }
          }
        }
      }
    });
    return results as unknown as AfWithRelations[];
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

  async updateAf(id: string, af: Partial<InsertAf>): Promise<Af> {
    const [updated] = await db.update(afs).set(af).where(eq(afs.id, id)).returning();
    if (!updated) throw new Error("AF nao encontrada");
    return updated;
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

  async getNotasFiscais(): Promise<NotaFiscalWithRelations[]> {
    const rows = await db.query.notasFiscais.findMany({
      with: {
        contrato: {
          with: {
            fornecedor: true,
            processoDigital: {
              with: {
                ente: true
              }
            }
          }
        },
      }
    });
    return rows as unknown as NotaFiscalWithRelations[];
  }

  async getNotaFiscal(id: string): Promise<NotaFiscalWithRelations | undefined> {
    const row = await db.query.notasFiscais.findFirst({
      where: eq(notasFiscais.id, id),
      with: {
        contrato: {
          with: {
            fornecedor: true,
            processoDigital: {
              with: {
                ente: true,
              },
            },
          },
        },
      }
    });
    return row as unknown as NotaFiscalWithRelations | undefined;
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
    const [updated] = await db.update(notasFiscais).set(data as any).where(eq(notasFiscais.id, id)).returning();
    if (!updated) throw new Error("Nota fiscal não encontrada");
    return updated;
  }

  async deleteNotaFiscal(id: string): Promise<NotaFiscal | undefined> {
    const [deleted] = await db.delete(notasFiscais).where(eq(notasFiscais.id, id)).returning();
    return deleted;
  }
}

export const storage = new DatabaseStorage();
