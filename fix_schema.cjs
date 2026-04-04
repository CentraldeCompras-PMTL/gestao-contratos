const fs = require('fs');
let code = fs.readFileSync('shared/schema.ts', 'utf8');

// 1. Add status to processosDigitais
code = code.replace(
  /export const processosDigitais = pgTable\("processos_digitais", \{([\s\S]*?)criadoEm:/,
  \`export const processosDigitais = pgTable("processos_digitais", {\$1status: text("status").notNull().default("planejamento"),\n  criadoEm:\`
);

// 2. Add the new tables after processosDigitais
const newTables = \`
export const processoParticipantes = pgTable("processo_participantes", {
  id: varchar("id").primaryKey().default(sql\\\`gen_random_uuid()\\\`),
  processoId: varchar("processo_id").references(() => processosDigitais.id).notNull(),
  departamentoId: varchar("departamento_id").references(() => departamentos.id).notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const processoItens = pgTable("processo_itens", {
  id: varchar("id").primaryKey().default(sql\\\`gen_random_uuid()\\\`),
  processoId: varchar("processo_id").references(() => processosDigitais.id).notNull(),
  codigoInterno: text("codigo_interno").notNull(),
  descricao: text("descricao").notNull(),
  unidadeMedida: text("unidade_medida").notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const processoItemQuantidades = pgTable("processo_item_quantidades", {
  id: varchar("id").primaryKey().default(sql\\\`gen_random_uuid()\\\`),
  itemId: varchar("item_id").references(() => processoItens.id).notNull(),
  departamentoId: varchar("departamento_id").references(() => departamentos.id).notNull(),
  quantidade: numeric("quantidade", { precision: 14, scale: 2 }).notNull().default("0"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const processoItemCotacoes = pgTable("processo_item_cotacoes", {
  id: varchar("id").primaryKey().default(sql\\\`gen_random_uuid()\\\`),
  itemId: varchar("item_id").references(() => processoItens.id).notNull().unique(),
  valorUnitarioCotado: numeric("valor_unitario_cotado", { precision: 14, scale: 2 }).notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const processoItemResultados = pgTable("processo_item_resultados", {
  id: varchar("id").primaryKey().default(sql\\\`gen_random_uuid()\\\`),
  itemId: varchar("item_id").references(() => processoItens.id).notNull().unique(),
  fornecedorId: varchar("fornecedor_id").references(() => fornecedores.id),
  valorUnitarioLicitado: numeric("valor_unitario_licitado", { precision: 14, scale: 2 }),
  itemFracassado: boolean("item_fracassado").notNull().default(false),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});
\`;

code = code.replace(
  /(export const processosDigitais = pgTable[\s\S]*?\}\);)/,
  \`$1\n\${newTables}\`
);

// 3. Update processosDigitaisRelations
const newProcessoRelations = \`export const processosDigitaisRelations = relations(processosDigitais, ({ one, many }) => ({
  departamento: one(departamentos, {
    fields: [processosDigitais.departamentoId],
    references: [departamentos.id],
  }),
  fases: many(fasesContratacao),
  contratos: many(contratos),
  atasRegistroPreco: many(atasRegistroPreco),
  itens: many(processoItens),
  participantes: many(processoParticipantes),
}));

export const processoParticipantesRelations = relations(processoParticipantes, ({ one }) => ({
  processo: one(processosDigitais, {
    fields: [processoParticipantes.processoId],
    references: [processosDigitais.id],
  }),
  departamento: one(departamentos, {
    fields: [processoParticipantes.departamentoId],
    references: [departamentos.id],
  }),
}));

export const processoItensRelations = relations(processoItens, ({ one, many }) => ({
  processo: one(processosDigitais, {
    fields: [processoItens.processoId],
    references: [processosDigitais.id],
  }),
  quantidades: many(processoItemQuantidades),
  cotacao: one(processoItemCotacoes),
  resultado: one(processoItemResultados),
}));

export const processoItemQuantidadesRelations = relations(processoItemQuantidades, ({ one }) => ({
  item: one(processoItens, {
    fields: [processoItemQuantidades.itemId],
    references: [processoItens.id],
  }),
  departamento: one(departamentos, {
    fields: [processoItemQuantidades.departamentoId],
    references: [departamentos.id],
  }),
}));

export const processoItemCotacoesRelations = relations(processoItemCotacoes, ({ one }) => ({
  item: one(processoItens, {
    fields: [processoItemCotacoes.itemId],
    references: [processoItens.id],
  }),
}));

export const processoItemResultadosRelations = relations(processoItemResultados, ({ one }) => ({
  item: one(processoItens, {
    fields: [processoItemResultados.itemId],
    references: [processoItens.id],
  }),
  fornecedor: one(fornecedores, {
    fields: [processoItemResultados.fornecedorId],
    references: [fornecedores.id],
  }),
}));\`;

code = code.replace(
  /export const processosDigitaisRelations = relations\(processosDigitais, \(\{ one, many \}\) => \(\{\s*departamento: one\(departamentos, \{ fields: \[processosDigitais.departamentoId\], references: \[departamentos.id\] \}\),\s*fases: many\(fasesContratacao\),\s*contratos: many\(contratos\),\s*\}\)\);/,
  newProcessoRelations
);

// 4. Update ProcessoDigitalWithRelations type
code = code.replace(
  /export type ProcessoDigitalWithRelations = ProcessoDigital & \{ fases: FaseContratacaoWithRelations\[\]; departamento: \(Departamento & \{ ente: Ente \| null \}\) \| null \};/,
  \`export type ProcessoItemWithRelations = typeof processoItens.$inferSelect & {
  quantidades: (typeof processoItemQuantidades.$inferSelect & { departamento: typeof departamentos.$inferSelect })[];
  cotacao: typeof processoItemCotacoes.$inferSelect | null;
  resultado: (typeof processoItemResultados.$inferSelect & { fornecedor: typeof fornecedores.$inferSelect | null }) | null;
};
export type ProcessoParticipanteWithDepartamento = typeof processoParticipantes.$inferSelect & {
  departamento: typeof departamentos.$inferSelect;
};
export type ProcessoDigitalWithRelations = ProcessoDigital & { 
  fases: FaseContratacaoWithRelations[]; 
  departamento: (Departamento & { ente: Ente | null }) | null;
  participantes?: ProcessoParticipanteWithDepartamento[];
  itens?: ProcessoItemWithRelations[];
};\`
);

// 5. Add Insert schemas
const insertSchemas = \`
export const insertProcessoItemSchema = createInsertSchema(processoItens).omit({ id: true, criadoEm: true, atualizadoEm: true });
export type InsertProcessoItem = z.infer<typeof insertProcessoItemSchema>;
export const insertProcessoItemQuantidadeSchema = createInsertSchema(processoItemQuantidades).omit({ id: true, criadoEm: true, atualizadoEm: true });
export type ProcessoItemQuantidade = typeof processoItemQuantidades.$inferSelect;
export const insertProcessoItemCotacaoSchema = createInsertSchema(processoItemCotacoes).omit({ id: true, criadoEm: true, atualizadoEm: true });
export type ProcessoItemCotacao = typeof processoItemCotacoes.$inferSelect;
export const insertProcessoItemResultadoSchema = createInsertSchema(processoItemResultados).omit({ id: true, criadoEm: true, atualizadoEm: true });
export type ProcessoItemResultado = typeof processoItemResultados.$inferSelect;
export const insertProcessoParticipanteSchema = createInsertSchema(processoParticipantes).omit({ id: true, criadoEm: true });
export type InsertProcessoParticipante = z.infer<typeof insertProcessoParticipanteSchema>;
\`;

code = code.replace(/export type AuditLogResponse = z\.infer<typeof auditLogResponseSchema>;/, 'export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;\\n' + insertSchemas);


fs.writeFileSync('shared/schema.ts', code);
console.log("Successfully rebuilt shared/schema.ts");
