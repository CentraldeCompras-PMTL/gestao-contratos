import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, boolean, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida");
const timestampSchema = z.string();
export const userRoleSchema = z.enum(["admin", "operacional"]);
export const contractStatusSchema = z.enum(["vigente", "encerrado"]);
export const aditivoTipoSchema = z.enum(["valor", "vigencia", "misto", "apostilamento", "outro"]);
export const empenhoStatusSchema = z.enum(["ativo", "anulado_parcial", "anulado"]);
export const notaFiscalStatusSchema = z.enum(["nota_recebida", "aguardando_pagamento", "pago"]);
export const fichaClassificacaoSchema = z.enum(["consumo", "servico", "permanente"]);
export const fonteRecursoCodigoSchema = z.string().regex(/^\d\.\d{3}\.\d{4}$/, "Codigo da fonte invalido");
export const fichaCodigoSchema = z.string().regex(/^\d{3}$/, "Ficha invalida");

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").notNull().default("operacional"),
  enteId: varchar("ente_id"),
  forcePasswordChange: boolean("force_password_change").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userEntes = pgTable("user_entes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  enteId: varchar("ente_id").references(() => entes.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const entes = pgTable("entes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull().unique(),
  sigla: text("sigla").notNull().unique(),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const departamentos = pgTable("departamentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enteId: varchar("ente_id").references(() => entes.id),
  nome: text("nome").notNull().unique(),
  descricao: text("descricao"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const fornecedores = pgTable("fornecedores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  email: text("email"),
  telefone: text("telefone"),
  cep: text("cep"),
  logradouro: text("logradouro"),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  municipio: text("municipio"),
  uf: text("uf"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const fontesRecurso = pgTable("fontes_recurso", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  codigo: text("codigo").notNull().unique(),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const fichasOrcamentarias = pgTable("fichas_orcamentarias", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fonteRecursoId: varchar("fonte_recurso_id").references(() => fontesRecurso.id).notNull(),
  codigo: text("codigo").notNull(),
  classificacao: text("classificacao").notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const processosDigitais = pgTable("processos_digitais", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroProcessoDigital: text("numero_processo_digital").notNull().unique(),
  objetoCompleto: text("objeto_completo").notNull(),
  objetoResumido: text("objeto_resumido").notNull(),
  descricao: text("descricao"),
  departamentoId: varchar("departamento_id").references(() => departamentos.id),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const fasesContratacao = pgTable("fases_contratacao", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processoDigitalId: varchar("processo_digital_id").references(() => processosDigitais.id).notNull(),
  departamentoId: varchar("departamento_id").references(() => departamentos.id),
  nomeFase: text("nome_fase").notNull(),
  fornecedorId: varchar("fornecedor_id").references(() => fornecedores.id).notNull(),
  modalidade: text("modalidade").notNull(),
  numeroModalidade: text("numero_modalidade").notNull(),
  dataInicio: date("data_inicio", { mode: "string" }).notNull(),
  dataFim: date("data_fim", { mode: "string" }),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const contratos = pgTable("contratos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processoDigitalId: varchar("processo_digital_id").references(() => processosDigitais.id).notNull(),
  faseContratacaoId: varchar("fase_contratacao_id").references(() => fasesContratacao.id).notNull(),
  departamentoId: varchar("departamento_id").references(() => departamentos.id),
  numeroContrato: text("numero_contrato").notNull().unique(),
  fornecedorId: varchar("fornecedor_id").references(() => fornecedores.id).notNull(),
  valorContrato: numeric("valor_contrato", { precision: 12, scale: 2 }).notNull(),
  vigenciaInicial: date("vigencia_inicial", { mode: "string" }).notNull(),
  vigenciaFinal: date("vigencia_final", { mode: "string" }).notNull(),
  status: text("status").notNull().default("vigente"),
  encerradoEm: date("encerrado_em", { mode: "string" }),
  motivoEncerramento: text("motivo_encerramento"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const empenhos = pgTable("empenhos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contratoId: varchar("contrato_id").references(() => contratos.id).notNull(),
  fonteRecursoId: varchar("fonte_recurso_id").references(() => fontesRecurso.id).notNull(),
  fichaId: varchar("ficha_id").references(() => fichasOrcamentarias.id).notNull(),
  dataEmpenho: date("data_empenho", { mode: "string" }).notNull(),
  valorEmpenho: numeric("valor_empenho", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("ativo"),
  valorAnulado: numeric("valor_anulado", { precision: 12, scale: 2 }).notNull().default("0"),
  dataAnulacao: date("data_anulacao", { mode: "string" }),
  motivoAnulacao: text("motivo_anulacao"),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const afs = pgTable("afs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empenhoId: varchar("empenho_id").references(() => empenhos.id).notNull(),
  dataPedidoAf: date("data_pedido_af", { mode: "string" }).notNull(),
  valorAf: numeric("valor_af", { precision: 12, scale: 2 }).notNull(),
  dataEstimadaEntrega: date("data_estimada_entrega", { mode: "string" }).notNull(),
  dataEntregaReal: date("data_entrega_real", { mode: "string" }),
  flagEntregaNotificada: boolean("flag_entrega_notificada").default(false),
  dataExtensao: date("data_extensao", { mode: "string" }),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const notasFiscais = pgTable("notas_fiscais", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contratoId: varchar("contrato_id").references(() => contratos.id).notNull(),
  numeroNota: text("numero_nota").notNull().unique(),
  valorNota: numeric("valor_nota", { precision: 12, scale: 2 }).notNull(),
  dataNota: date("data_nota", { mode: "string" }).notNull(),
  statusPagamento: text("status_pagamento").notNull().default("nota_recebida"),
  numeroProcessoPagamento: text("numero_processo_pagamento"),
  dataEnvioPagamento: date("data_envio_pagamento", { mode: "string" }),
  dataPagamento: date("data_pagamento", { mode: "string" }),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const contratoAditivos = pgTable("contrato_aditivos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contratoId: varchar("contrato_id").references(() => contratos.id).notNull(),
  numeroAditivo: text("numero_aditivo").notNull(),
  tipoAditivo: text("tipo_aditivo").notNull(),
  dataAssinatura: date("data_assinatura", { mode: "string" }).notNull(),
  valorAditivo: numeric("valor_aditivo", { precision: 12, scale: 2 }),
  novaVigenciaFinal: date("nova_vigencia_final", { mode: "string" }),
  justificativa: text("justificativa"),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const contratoAnexos = pgTable("contrato_anexos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contratoId: varchar("contrato_id").references(() => contratos.id).notNull(),
  nomeArquivo: text("nome_arquivo").notNull(),
  tipoDocumento: text("tipo_documento").notNull(),
  urlArquivo: text("url_arquivo").notNull(),
  observacao: text("observacao"),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const contratosRelations = relations(contratos, ({ one, many }) => ({
  processoDigital: one(processosDigitais, { fields: [contratos.processoDigitalId], references: [processosDigitais.id] }),
  faseContratacao: one(fasesContratacao, { fields: [contratos.faseContratacaoId], references: [fasesContratacao.id] }),
  departamento: one(departamentos, { fields: [contratos.departamentoId], references: [departamentos.id] }),
  fornecedor: one(fornecedores, { fields: [contratos.fornecedorId], references: [fornecedores.id] }),
  empenhos: many(empenhos),
  notasFiscais: many(notasFiscais),
  aditivos: many(contratoAditivos),
  anexos: many(contratoAnexos),
}));

export const notasFiscaisRelations = relations(notasFiscais, ({ one }) => ({
  contrato: one(contratos, { fields: [notasFiscais.contratoId], references: [contratos.id] }),
}));

export const empenhosRelations = relations(empenhos, ({ one, many }) => ({
  contrato: one(contratos, { fields: [empenhos.contratoId], references: [contratos.id] }),
  fonteRecurso: one(fontesRecurso, { fields: [empenhos.fonteRecursoId], references: [fontesRecurso.id] }),
  ficha: one(fichasOrcamentarias, { fields: [empenhos.fichaId], references: [fichasOrcamentarias.id] }),
  afs: many(afs),
}));

export const afsRelations = relations(afs, ({ one }) => ({
  empenho: one(empenhos, { fields: [afs.empenhoId], references: [empenhos.id] }),
}));

export const entesRelations = relations(entes, ({ many }) => ({
  departamentos: many(departamentos),
}));

export const departamentosRelations = relations(departamentos, ({ one, many }) => ({
  ente: one(entes, { fields: [departamentos.enteId], references: [entes.id] }),
  processos: many(processosDigitais),
}));

export const processosDigitaisRelations = relations(processosDigitais, ({ one, many }) => ({
  departamento: one(departamentos, { fields: [processosDigitais.departamentoId], references: [departamentos.id] }),
  fases: many(fasesContratacao),
  contratos: many(contratos),
}));

export const fasesContratacaoRelations = relations(fasesContratacao, ({ one, many }) => ({
  processoDigital: one(processosDigitais, { fields: [fasesContratacao.processoDigitalId], references: [processosDigitais.id] }),
  departamento: one(departamentos, { fields: [fasesContratacao.departamentoId], references: [departamentos.id] }),
  fornecedor: one(fornecedores, { fields: [fasesContratacao.fornecedorId], references: [fornecedores.id] }),
  contratos: many(contratos),
}));

export const fornecedoresRelations = relations(fornecedores, ({ many }) => ({
  contratos: many(contratos),
  fasesContratacao: many(fasesContratacao),
}));

export const fontesRecursoRelations = relations(fontesRecurso, ({ many }) => ({
  fichas: many(fichasOrcamentarias),
  empenhos: many(empenhos),
}));

export const fichasOrcamentariasRelations = relations(fichasOrcamentarias, ({ one, many }) => ({
  fonteRecurso: one(fontesRecurso, { fields: [fichasOrcamentarias.fonteRecursoId], references: [fontesRecurso.id] }),
  empenhos: many(empenhos),
}));

export const contratoAditivosRelations = relations(contratoAditivos, ({ one }) => ({
  contrato: one(contratos, { fields: [contratoAditivos.contratoId], references: [contratos.id] }),
}));

export const contratoAnexosRelations = relations(contratoAnexos, ({ one }) => ({
  contrato: one(contratos, { fields: [contratoAnexos.contratoId], references: [contratos.id] }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true }).extend({
  role: userRoleSchema.default("operacional"),
});
export const insertEnteSchema = createInsertSchema(entes).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertDepartamentoSchema = createInsertSchema(departamentos).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertFornecedorSchema = createInsertSchema(fornecedores).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertFonteRecursoSchema = createInsertSchema(fontesRecurso).omit({ id: true, criadoEm: true, atualizadoEm: true }).extend({
  codigo: fonteRecursoCodigoSchema,
});
export const insertFichaOrcamentariaSchema = createInsertSchema(fichasOrcamentarias).omit({ id: true, criadoEm: true }).extend({
  codigo: fichaCodigoSchema,
  classificacao: fichaClassificacaoSchema,
});
export const insertProcessoDigitalSchema = createInsertSchema(processosDigitais).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertFaseContratacaoSchema = createInsertSchema(fasesContratacao).omit({ id: true, criadoEm: true });
export const insertContratoSchema = createInsertSchema(contratos).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertEmpenhoSchema = createInsertSchema(empenhos).omit({
  id: true,
  criadoEm: true,
  status: true,
  valorAnulado: true,
  dataAnulacao: true,
  motivoAnulacao: true,
});
export const insertAfSchema = createInsertSchema(afs).omit({ id: true, dataEstimadaEntrega: true, criadoEm: true, flagEntregaNotificada: true, dataExtensao: true });
export const insertNotaFiscalSchema = createInsertSchema(notasFiscais).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
  dataPagamento: true,
  statusPagamento: true,
  numeroProcessoPagamento: true,
  dataEnvioPagamento: true,
});
export const insertContratoAditivoSchema = createInsertSchema(contratoAditivos).omit({ id: true, criadoEm: true, contratoId: true }).extend({
  tipoAditivo: aditivoTipoSchema,
});
export const insertContratoAnexoSchema = createInsertSchema(contratoAnexos).omit({ id: true, criadoEm: true, contratoId: true });

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: userRoleSchema,
  enteId: z.string().nullable().optional(),
  accessibleEnteIds: z.array(z.string()).default([]),
  forcePasswordChange: z.boolean(),
  createdAt: timestampSchema.nullable().optional(),
});

export const enteResponseSchema = z.object({
  id: z.string(),
  nome: z.string(),
  sigla: z.string(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const fichaOrcamentariaResponseSchema = z.object({
  id: z.string(),
  fonteRecursoId: z.string(),
  codigo: fichaCodigoSchema,
  classificacao: fichaClassificacaoSchema,
  criadoEm: timestampSchema.nullable().optional(),
});

export const fonteRecursoResponseSchema = z.object({
  id: z.string(),
  nome: z.string(),
  codigo: fonteRecursoCodigoSchema,
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const fonteRecursoWithFichasSchema = fonteRecursoResponseSchema.extend({
  fichas: z.array(fichaOrcamentariaResponseSchema),
});

export const auditLogResponseSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string().nullable(),
  details: z.string().nullable(),
  createdAt: timestampSchema.nullable().optional(),
});

export const departamentoResponseSchema = z.object({
  id: z.string(),
  enteId: z.string().nullable(),
  nome: z.string(),
  descricao: z.string().nullable(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const fornecedorResponseSchema = z.object({
  id: z.string(),
  nome: z.string(),
  cnpj: z.string(),
  email: z.string().nullable(),
  telefone: z.string().nullable(),
  cep: z.string().nullable(),
  logradouro: z.string().nullable(),
  numero: z.string().nullable(),
  complemento: z.string().nullable(),
  bairro: z.string().nullable(),
  municipio: z.string().nullable(),
  uf: z.string().nullable(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const cnpjLookupResponseSchema = z.object({
  cnpj: z.string(),
  nome: z.string(),
  email: z.string().nullable(),
  telefone: z.string().nullable(),
  cep: z.string().nullable(),
  logradouro: z.string().nullable(),
  numero: z.string().nullable(),
  complemento: z.string().nullable(),
  bairro: z.string().nullable(),
  municipio: z.string().nullable(),
  uf: z.string().nullable(),
});

export const processoDigitalResponseSchema = z.object({
  id: z.string(),
  numeroProcessoDigital: z.string(),
  objetoCompleto: z.string(),
  objetoResumido: z.string(),
  descricao: z.string().nullable(),
  departamentoId: z.string().nullable(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const faseContratacaoResponseSchema = z.object({
  id: z.string(),
  processoDigitalId: z.string(),
  departamentoId: z.string().nullable(),
  nomeFase: z.string(),
  fornecedorId: z.string(),
  modalidade: z.string(),
  numeroModalidade: z.string(),
  dataInicio: isoDateSchema,
  dataFim: isoDateSchema.nullable(),
  criadoEm: timestampSchema.nullable().optional(),
});

export const afResponseSchema = z.object({
  id: z.string(),
  empenhoId: z.string(),
  dataPedidoAf: isoDateSchema,
  valorAf: z.union([z.string(), z.number()]),
  dataEstimadaEntrega: isoDateSchema,
  dataEntregaReal: isoDateSchema.nullable(),
  flagEntregaNotificada: z.boolean().nullable().optional(),
  dataExtensao: isoDateSchema.nullable(),
  criadoEm: timestampSchema.nullable().optional(),
});

export const empenhoResponseSchema = z.object({
  id: z.string(),
  contratoId: z.string(),
  fonteRecursoId: z.string(),
  fichaId: z.string(),
  dataEmpenho: isoDateSchema,
  valorEmpenho: z.union([z.string(), z.number()]),
  status: empenhoStatusSchema,
  valorAnulado: z.union([z.string(), z.number()]),
  dataAnulacao: isoDateSchema.nullable(),
  motivoAnulacao: z.string().nullable(),
  criadoEm: timestampSchema.nullable().optional(),
});

export const contratoResponseSchema = z.object({
  id: z.string(),
  processoDigitalId: z.string(),
  faseContratacaoId: z.string(),
  departamentoId: z.string().nullable(),
  numeroContrato: z.string(),
  fornecedorId: z.string(),
  valorContrato: z.union([z.string(), z.number()]),
  vigenciaInicial: isoDateSchema,
  vigenciaFinal: isoDateSchema,
  status: contractStatusSchema,
  encerradoEm: isoDateSchema.nullable(),
  motivoEncerramento: z.string().nullable(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const notaFiscalResponseSchema = z.object({
  id: z.string(),
  contratoId: z.string(),
  numeroNota: z.string(),
  valorNota: z.union([z.string(), z.number()]),
  dataNota: isoDateSchema,
  statusPagamento: notaFiscalStatusSchema,
  numeroProcessoPagamento: z.string().nullable(),
  dataEnvioPagamento: isoDateSchema.nullable(),
  dataPagamento: isoDateSchema.nullable(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const contratoAditivoResponseSchema = z.object({
  id: z.string(),
  contratoId: z.string(),
  numeroAditivo: z.string(),
  tipoAditivo: aditivoTipoSchema,
  dataAssinatura: isoDateSchema,
  valorAditivo: z.union([z.string(), z.number()]).nullable(),
  novaVigenciaFinal: isoDateSchema.nullable(),
  justificativa: z.string().nullable(),
  criadoEm: timestampSchema.nullable().optional(),
});

export const contratoAnexoResponseSchema = z.object({
  id: z.string(),
  contratoId: z.string(),
  nomeArquivo: z.string(),
  tipoDocumento: z.string(),
  urlArquivo: z.string(),
  observacao: z.string().nullable(),
  criadoEm: timestampSchema.nullable().optional(),
});

export const faseContratacaoWithRelationsSchema = faseContratacaoResponseSchema.extend({
  fornecedor: fornecedorResponseSchema,
  processoDigital: processoDigitalResponseSchema,
  departamento: departamentoResponseSchema.nullable(),
});

export const processoDigitalWithRelationsSchema = processoDigitalResponseSchema.extend({
  departamento: departamentoResponseSchema.extend({ ente: enteResponseSchema.nullable() }).nullable(),
  fases: z.array(
    faseContratacaoResponseSchema.extend({
      fornecedor: fornecedorResponseSchema,
    }),
  ),
});

export const processoDigitalScopedSchema = processoDigitalResponseSchema.extend({
  departamento: departamentoResponseSchema.extend({ ente: enteResponseSchema.nullable() }).nullable(),
});

export const empenhoWithRelationsSchema = empenhoResponseSchema.extend({
  fonteRecurso: fonteRecursoResponseSchema,
  ficha: fichaOrcamentariaResponseSchema,
  afs: z.array(afResponseSchema),
});

export const contratoWithRelationsSchema = contratoResponseSchema.extend({
  processoDigital: processoDigitalScopedSchema,
  faseContratacao: faseContratacaoWithRelationsSchema,
  departamento: departamentoResponseSchema.nullable(),
  fornecedor: fornecedorResponseSchema,
  empenhos: z.array(empenhoWithRelationsSchema),
  notasFiscais: z.array(notaFiscalResponseSchema),
  aditivos: z.array(contratoAditivoResponseSchema),
  anexos: z.array(contratoAnexoResponseSchema),
});

export const notaFiscalWithRelationsSchema = notaFiscalResponseSchema.extend({
  contrato: contratoResponseSchema.extend({
    processoDigital: processoDigitalScopedSchema,
    fornecedor: fornecedorResponseSchema,
  }),
});

export const afWithRelationsSchema = afResponseSchema.extend({
  empenho: empenhoResponseSchema.extend({
    contrato: contratoResponseSchema.extend({
      fornecedor: fornecedorResponseSchema,
      processoDigital: processoDigitalScopedSchema,
    }),
  }),
});

export const notificacaoResponseSchema = z.object({
  id: z.string(),
  empenhoId: z.string(),
  af: afWithRelationsSchema,
  isLate: z.boolean(),
  notified: z.boolean().nullable().optional(),
  contrato: z.string(),
  fornecedor: z.string(),
  objeto: z.string(),
});

export const dashboardStatsResponseSchema = z.object({
  totalContratos: z.number(),
  totalProcessos: z.number(),
  totalFornecedores: z.number(),
  valorTotal: z.number(),
  saldoTotal: z.number(),
});

export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, "password"> & { accessibleEnteIds: string[] };
export type Fornecedor = typeof fornecedores.$inferSelect;
export type ProcessoDigital = typeof processosDigitais.$inferSelect;
export type FaseContratacao = typeof fasesContratacao.$inferSelect;
export type Contrato = typeof contratos.$inferSelect;
export type Empenho = typeof empenhos.$inferSelect;
export type Af = typeof afs.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEnte = z.infer<typeof insertEnteSchema>;
export type InsertDepartamento = z.infer<typeof insertDepartamentoSchema>;
export type InsertFornecedor = z.infer<typeof insertFornecedorSchema>;
export type InsertFonteRecurso = z.infer<typeof insertFonteRecursoSchema>;
export type InsertFichaOrcamentaria = z.infer<typeof insertFichaOrcamentariaSchema>;
export type InsertProcessoDigital = z.infer<typeof insertProcessoDigitalSchema>;
export type InsertFaseContratacao = z.infer<typeof insertFaseContratacaoSchema>;
export type InsertContrato = z.infer<typeof insertContratoSchema>;
export type InsertEmpenho = z.infer<typeof insertEmpenhoSchema>;
export type InsertAf = z.infer<typeof insertAfSchema>;
export type InsertNotaFiscal = z.infer<typeof insertNotaFiscalSchema>;
export type InsertContratoAditivo = z.infer<typeof insertContratoAditivoSchema>;
export type InsertContratoAnexo = z.infer<typeof insertContratoAnexoSchema>;
export type Departamento = typeof departamentos.$inferSelect;
export type Ente = typeof entes.$inferSelect;
export type UserEnte = typeof userEntes.$inferSelect;
export type FonteRecurso = typeof fontesRecurso.$inferSelect;
export type FichaOrcamentaria = typeof fichasOrcamentarias.$inferSelect;
export type NotaFiscal = typeof notasFiscais.$inferSelect;
export type ContratoAditivo = typeof contratoAditivos.$inferSelect;
export type ContratoAnexo = typeof contratoAnexos.$inferSelect;

export type FaseContratacaoWithRelations = FaseContratacao & {
  fornecedor: Fornecedor;
  processoDigital: ProcessoDigital;
  departamento: Departamento | null;
};
export type ProcessoDigitalWithRelations = ProcessoDigital & { fases: FaseContratacaoWithRelations[]; departamento: (Departamento & { ente: Ente | null }) | null };
export type NotaFiscalWithRelations = NotaFiscal & { 
  contrato: Contrato & { 
    processoDigital: ProcessoDigital & { departamento: (Departamento & { ente: Ente | null }) | null };
    fornecedor: Fornecedor;
  } 
};
export type AfWithRelations = Af & {
  empenho: Empenho & {
    contrato: Contrato & {
      fornecedor: Fornecedor;
      processoDigital: ProcessoDigital & { departamento: (Departamento & { ente: Ente | null }) | null };
    }
  }
};
export type FonteRecursoWithFichas = FonteRecurso & { fichas: FichaOrcamentaria[] };
export type EmpenhoWithRelations = Empenho & { afs: Af[]; fonteRecurso: FonteRecurso; ficha: FichaOrcamentaria };
export type ContratoWithRelations = Contrato & { 
  empenhos: EmpenhoWithRelations[];
  processoDigital: ProcessoDigital & { departamento: (Departamento & { ente: Ente | null }) | null };
  faseContratacao: FaseContratacaoWithRelations;
  departamento: Departamento | null;
  fornecedor: Fornecedor;
  notasFiscais: NotaFiscal[];
  aditivos: ContratoAditivo[];
  anexos: ContratoAnexo[];
};
export type Notificacao = z.infer<typeof notificacaoResponseSchema>;
export type DashboardStats = z.infer<typeof dashboardStatsResponseSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
