import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const departamentos = pgTable("departamentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
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
  nomeFase: text("nome_fase").notNull(),
  fornecedorId: varchar("fornecedor_id").references(() => fornecedores.id).notNull(),
  modalidade: text("modalidade").notNull(),
  numeroModalidade: text("numero_modalidade").notNull(),
  dataInicio: text("data_inicio").notNull(),
  dataFim: text("data_fim"),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const contratos = pgTable("contratos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processoDigitalId: varchar("processo_digital_id").references(() => processosDigitais.id).notNull(),
  faseContratacaoId: varchar("fase_contratacao_id").references(() => fasesContratacao.id).notNull(),
  numeroContrato: text("numero_contrato").notNull().unique(),
  fornecedorId: varchar("fornecedor_id").references(() => fornecedores.id).notNull(),
  valorContrato: numeric("valor_contrato", { precision: 12, scale: 2 }).notNull(),
  vigenciaInicial: text("vigencia_inicial").notNull(),
  vigenciaFinal: text("vigencia_final").notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const empenhos = pgTable("empenhos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contratoId: varchar("contrato_id").references(() => contratos.id).notNull(),
  dataEmpenho: text("data_empenho").notNull(),
  valorEmpenho: numeric("valor_empenho", { precision: 12, scale: 2 }).notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const afs = pgTable("afs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empenhoId: varchar("empenho_id").references(() => empenhos.id).notNull(),
  dataPedidoAf: text("data_pedido_af").notNull(),
  valorAf: numeric("valor_af", { precision: 12, scale: 2 }).notNull(),
  dataEstimadaEntrega: text("data_estimada_entrega").notNull(),
  dataEntregaReal: text("data_entrega_real"),
  flagEntregaNotificada: boolean("flag_entrega_notificada").default(false),
  dataExtensao: text("data_extensao"),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const notasFiscais = pgTable("notas_fiscais", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contratoId: varchar("contrato_id").references(() => contratos.id).notNull(),
  numeroNota: text("numero_nota").notNull().unique(),
  valorNota: numeric("valor_nota", { precision: 12, scale: 2 }).notNull(),
  dataNota: text("data_nota").notNull(),
  statusPagamento: text("status_pagamento").default("pendente"),
  dataPagamento: text("data_pagamento"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const contratosRelations = relations(contratos, ({ one, many }) => ({
  processoDigital: one(processosDigitais, { fields: [contratos.processoDigitalId], references: [processosDigitais.id] }),
  faseContratacao: one(fasesContratacao, { fields: [contratos.faseContratacaoId], references: [fasesContratacao.id] }),
  fornecedor: one(fornecedores, { fields: [contratos.fornecedorId], references: [fornecedores.id] }),
  empenhos: many(empenhos),
  notasFiscais: many(notasFiscais),
}));

export const notasFiscaisRelations = relations(notasFiscais, ({ one }) => ({
  contrato: one(contratos, { fields: [notasFiscais.contratoId], references: [contratos.id] }),
}));

export const empenhosRelations = relations(empenhos, ({ one, many }) => ({
  contrato: one(contratos, { fields: [empenhos.contratoId], references: [contratos.id] }),
  afs: many(afs),
}));

export const afsRelations = relations(afs, ({ one }) => ({
  empenho: one(empenhos, { fields: [afs.empenhoId], references: [empenhos.id] }),
}));

export const departamentosRelations = relations(departamentos, ({ many }) => ({
  processos: many(processosDigitais),
}));

export const processosDigitaisRelations = relations(processosDigitais, ({ one, many }) => ({
  departamento: one(departamentos, { fields: [processosDigitais.departamentoId], references: [departamentos.id] }),
  fases: many(fasesContratacao),
  contratos: many(contratos),
}));

export const fasesContratacaoRelations = relations(fasesContratacao, ({ one, many }) => ({
  processoDigital: one(processosDigitais, { fields: [fasesContratacao.processoDigitalId], references: [processosDigitais.id] }),
  fornecedor: one(fornecedores, { fields: [fasesContratacao.fornecedorId], references: [fornecedores.id] }),
  contratos: many(contratos),
}));

export const fornecedoresRelations = relations(fornecedores, ({ many }) => ({
  contratos: many(contratos),
  fasesContratacao: many(fasesContratacao),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDepartamentoSchema = createInsertSchema(departamentos).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertFornecedorSchema = createInsertSchema(fornecedores).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertProcessoDigitalSchema = createInsertSchema(processosDigitais).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertFaseContratacaoSchema = createInsertSchema(fasesContratacao).omit({ id: true, criadoEm: true });
export const insertContratoSchema = createInsertSchema(contratos).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertEmpenhoSchema = createInsertSchema(empenhos).omit({ id: true, criadoEm: true });
export const insertAfSchema = createInsertSchema(afs).omit({ id: true, dataEstimadaEntrega: true, criadoEm: true, flagEntregaNotificada: true, dataExtensao: true });
export const insertNotaFiscalSchema = createInsertSchema(notasFiscais).omit({ id: true, criadoEm: true, atualizadoEm: true, dataPagamento: true, statusPagamento: true });

export type User = typeof users.$inferSelect;
export type Fornecedor = typeof fornecedores.$inferSelect;
export type ProcessoDigital = typeof processosDigitais.$inferSelect;
export type FaseContratacao = typeof fasesContratacao.$inferSelect;
export type Contrato = typeof contratos.$inferSelect;
export type Empenho = typeof empenhos.$inferSelect;
export type Af = typeof afs.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDepartamento = z.infer<typeof insertDepartamentoSchema>;
export type InsertFornecedor = z.infer<typeof insertFornecedorSchema>;
export type InsertProcessoDigital = z.infer<typeof insertProcessoDigitalSchema>;
export type InsertFaseContratacao = z.infer<typeof insertFaseContratacaoSchema>;
export type InsertContrato = z.infer<typeof insertContratoSchema>;
export type InsertEmpenho = z.infer<typeof insertEmpenhoSchema>;
export type InsertAf = z.infer<typeof insertAfSchema>;
export type InsertNotaFiscal = z.infer<typeof insertNotaFiscalSchema>;
export type Departamento = typeof departamentos.$inferSelect;
export type NotaFiscal = typeof notasFiscais.$inferSelect;

export type FaseContratacaoWithRelations = FaseContratacao & { fornecedor: Fornecedor; processoDigital: ProcessoDigital };
export type ProcessoDigitalWithRelations = ProcessoDigital & { fases: FaseContratacaoWithRelations[]; departamento: Departamento | null };
export type NotaFiscalWithRelations = NotaFiscal & { 
  contrato: Contrato & { 
    processoDigital: ProcessoDigital;
    fornecedor: Fornecedor;
  } 
};
export type AfWithRelations = Af & {
  empenho: Empenho & {
    contrato: Contrato & {
      fornecedor: Fornecedor;
      processoDigital: ProcessoDigital;
    }
  }
};
export type EmpenhoWithRelations = Empenho & { afs: Af[] };
export type ContratoWithRelations = Contrato & { 
  empenhos: EmpenhoWithRelations[];
  processoDigital: ProcessoDigital;
  faseContratacao: FaseContratacao;
  fornecedor: Fornecedor;
};
