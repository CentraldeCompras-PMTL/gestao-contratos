import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, boolean, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida");
const timestampSchema = z.string();
export const userRoleSchema = z.enum(["admin", "operacional"]);
export const contractStatusSchema = z.enum(["vigente", "encerrado"]);
export const ataRegistroPrecoStatusSchema = z.enum(["planejamento", "cotacao", "licitada", "vigente", "encerrada"]);
export const ataPrePedidoStatusSchema = z.enum(["aberto", "concluido"]);
export const aditivoTipoSchema = z.enum(["valor", "vigencia", "misto", "apostilamento", "outro"]);
export const empenhoStatusSchema = z.enum(["ativo", "anulado_parcial", "anulado"]);
export const notaFiscalStatusSchema = z.enum(["nota_recebida", "aguardando_pagamento", "pago"]);
export const fichaClassificacaoSchema = z.string().min(1, "Classificacao obrigatoria");
export const fonteRecursoCodigoSchema = z.string().regex(/^\d\.\d{3}\.\d{4}$/, "Codigo da fonte invalido");
export const fichaCodigoSchema = z.string().regex(/^\d{3}$/, "Ficha invalida");
export const projetoAtividadeCodigoSchema = z.string().min(1, "Codigo do projeto/atividade obrigatorio");

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").notNull().default("operacional"),
  enteId: varchar("ente_id"),
  canAccessAtaModule: boolean("can_access_ata_module").notNull().default(false),
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
  codigo: text("codigo").notNull(),
  ano: varchar("ano").notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const fichasOrcamentarias = pgTable("fichas_orcamentarias", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fonteRecursoId: varchar("fonte_recurso_id").references(() => fontesRecurso.id).notNull(),
  projetoAtividadeId: varchar("projeto_atividade_id").references(() => projetosAtividade.id).notNull(),
  codigo: text("codigo").notNull(),
  ano: varchar("ano").notNull(),
  classificacao: text("classificacao").notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const projetosAtividade = pgTable("projetos_atividade", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fonteRecursoId: varchar("fonte_recurso_id").references(() => fontesRecurso.id).notNull(),
  codigo: text("codigo").notNull(),
  ano: varchar("ano").notNull(),
  descricao: text("descricao").notNull(),
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
  status: text("status").notNull().default("planejamento"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const processoParticipantes = pgTable("processo_participantes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processoId: varchar("processo_id").references(() => processosDigitais.id).notNull(),
  departamentoId: varchar("departamento_id").references(() => departamentos.id).notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const processoItens = pgTable("processo_itens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processoId: varchar("processo_id").references(() => processosDigitais.id).notNull(),
  codigoInterno: text("codigo_interno").notNull(),
  descricao: text("descricao").notNull(),
  unidadeMedida: text("unidade_medida").notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const processoItemQuantidades = pgTable("processo_item_quantidades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => processoItens.id).notNull(),
  departamentoId: varchar("departamento_id").references(() => departamentos.id).notNull(),
  quantidade: numeric("quantidade", { precision: 14, scale: 2 }).notNull().default("0"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const processoItemCotacoes = pgTable("processo_item_cotacoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => processoItens.id).notNull().unique(),
  valorUnitarioCotado: numeric("valor_unitario_cotado", { precision: 14, scale: 2 }).notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const processoItemResultados = pgTable("processo_item_resultados", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => processoItens.id).notNull().unique(),
  fornecedorId: varchar("fornecedor_id").references(() => fornecedores.id),
  valorUnitarioLicitado: numeric("valor_unitario_licitado", { precision: 14, scale: 2 }),
  itemFracassado: boolean("item_fracassado").notNull().default(false),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const processoDotacoes = pgTable("processo_dotacoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processoId: varchar("processo_id").references(() => processosDigitais.id).notNull(),
  fichaOrcamentariaId: varchar("ficha_orcamentaria_id").references(() => fichasOrcamentarias.id).notNull(),
  anoDotacao: varchar("ano_dotacao").notNull(),
  valorEstimado: numeric("valor_estimado", { precision: 14, scale: 2 }),
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

export const atasRegistroPreco = pgTable("atas_registro_preco", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processoDigitalId: varchar("processo_digital_id").references(() => processosDigitais.id).notNull(),
  numeroAta: text("numero_ata").notNull().unique(),
  objeto: text("objeto").notNull(),
  vigenciaInicial: date("vigencia_inicial", { mode: "string" }).notNull(),
  vigenciaFinal: date("vigencia_final", { mode: "string" }).notNull(),
  status: text("status").notNull().default("planejamento"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const ataParticipantes = pgTable("ata_participantes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ataId: varchar("ata_id").references(() => atasRegistroPreco.id).notNull(),
  enteId: varchar("ente_id").references(() => entes.id).notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const ataFornecedores = pgTable("ata_fornecedores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ataId: varchar("ata_id").references(() => atasRegistroPreco.id).notNull(),
  fornecedorId: varchar("fornecedor_id").references(() => fornecedores.id).notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const ataItens = pgTable("ata_itens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ataId: varchar("ata_id").references(() => atasRegistroPreco.id).notNull(),
  codigoInterno: text("codigo_interno").notNull(),
  descricao: text("descricao").notNull(),
  unidadeMedida: text("unidade_medida").notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const ataItemQuantidades = pgTable("ata_item_quantidades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => ataItens.id).notNull(),
  enteId: varchar("ente_id").references(() => entes.id).notNull(),
  quantidade: numeric("quantidade", { precision: 14, scale: 2 }).notNull().default("0"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const ataItemCotacoes = pgTable("ata_item_cotacoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => ataItens.id).notNull().unique(),
  valorUnitarioCotado: numeric("valor_unitario_cotado", { precision: 14, scale: 2 }).notNull(),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const ataItemResultados = pgTable("ata_item_resultados", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => ataItens.id).notNull().unique(),
  fornecedorId: varchar("fornecedor_id").references(() => fornecedores.id),
  valorUnitarioLicitado: numeric("valor_unitario_licitado", { precision: 14, scale: 2 }),
  itemFracassado: boolean("item_fracassado").notNull().default(false),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const ataPrePedidos = pgTable("ata_pre_pedidos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ataId: varchar("ata_id").references(() => atasRegistroPreco.id).notNull(),
  ataContratoId: varchar("ata_contrato_id"),
  itemId: varchar("item_id").references(() => ataItens.id).notNull(),
  enteId: varchar("ente_id").references(() => entes.id).notNull(),
  fonteRecursoId: varchar("fonte_recurso_id").references(() => fontesRecurso.id).notNull(),
  fichaId: varchar("ficha_id").references(() => fichasOrcamentarias.id).notNull(),
  quantidadeSolicitada: numeric("quantidade_solicitada", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull().default("aberto"),
  observacao: text("observacao"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const ataContratos = pgTable("ata_contratos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ataId: varchar("ata_id").references(() => atasRegistroPreco.id).notNull(),
  fornecedorId: varchar("fornecedor_id").references(() => fornecedores.id).notNull(),
  numeroContrato: text("numero_contrato").notNull().unique(),
  objeto: text("objeto").notNull(),
  vigenciaInicial: date("vigencia_inicial", { mode: "string" }).notNull(),
  vigenciaFinal: date("vigencia_final", { mode: "string" }).notNull(),
  status: text("status").notNull().default("vigente"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const ataEmpenhos = pgTable("ata_empenhos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ataContratoId: varchar("ata_contrato_id").references(() => ataContratos.id),
  ataPrePedidoId: varchar("ata_pre_pedido_id").references(() => ataPrePedidos.id).notNull(),
  dataEmpenho: date("data_empenho", { mode: "string" }).notNull(),
  numeroEmpenho: text("numero_empenho").notNull(),
  quantidadeEmpenhada: numeric("quantidade_empenhada", { precision: 14, scale: 2 }).notNull(),
  valorEmpenho: numeric("valor_empenho", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull().default("ativo"),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const ataAfs = pgTable("ata_afs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ataEmpenhoId: varchar("ata_empenho_id").references(() => ataEmpenhos.id).notNull(),
  numeroAf: text("numero_af").notNull().default("S/N"),
  dataPedidoAf: date("data_pedido_af", { mode: "string" }).notNull(),
  quantidadeAf: numeric("quantidade_af", { precision: 14, scale: 2 }).notNull(),
  valorAf: numeric("valor_af", { precision: 14, scale: 2 }).notNull(),
  dataEstimadaEntrega: date("data_estimada_entrega", { mode: "string" }).notNull(),
  dataEntregaReal: date("data_entrega_real", { mode: "string" }),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const ataNotasFiscais = pgTable("ata_notas_fiscais", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ataContratoId: varchar("ata_contrato_id").references(() => ataContratos.id),
  ataAfId: varchar("ata_af_id").references(() => ataAfs.id).notNull(),
  numeroNota: text("numero_nota").notNull().unique(),
  quantidadeNota: numeric("quantidade_nota", { precision: 14, scale: 2 }).notNull(),
  valorNota: numeric("valor_nota", { precision: 14, scale: 2 }).notNull(),
  dataNota: date("data_nota", { mode: "string" }).notNull(),
  statusPagamento: text("status_pagamento").notNull().default("nota_recebida"),
  numeroProcessoPagamento: text("numero_processo_pagamento"),
  dataEnvioPagamento: date("data_envio_pagamento", { mode: "string" }),
  dataPagamento: date("data_pagamento", { mode: "string" }),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const empenhos = pgTable("empenhos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contratoId: varchar("contrato_id").references(() => contratos.id).notNull(),
  fonteRecursoId: varchar("fonte_recurso_id").references(() => fontesRecurso.id).notNull(),
  fichaId: varchar("ficha_id").references(() => fichasOrcamentarias.id).notNull(),
  numeroEmpenho: text("numero_empenho").notNull().default("S/N"),
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
  numeroAf: text("numero_af").notNull().default("S/N"),
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

export const atasRegistroPrecoRelations = relations(atasRegistroPreco, ({ one, many }) => ({
  processoDigital: one(processosDigitais, { fields: [atasRegistroPreco.processoDigitalId], references: [processosDigitais.id] }),
  participantes: many(ataParticipantes),
  fornecedores: many(ataFornecedores),
  itens: many(ataItens),
  prePedidos: many(ataPrePedidos),
  contratos: many(ataContratos),
}));

export const ataParticipantesRelations = relations(ataParticipantes, ({ one }) => ({
  ata: one(atasRegistroPreco, { fields: [ataParticipantes.ataId], references: [atasRegistroPreco.id] }),
  ente: one(entes, { fields: [ataParticipantes.enteId], references: [entes.id] }),
}));

export const ataFornecedoresRelations = relations(ataFornecedores, ({ one }) => ({
  ata: one(atasRegistroPreco, { fields: [ataFornecedores.ataId], references: [atasRegistroPreco.id] }),
  fornecedor: one(fornecedores, { fields: [ataFornecedores.fornecedorId], references: [fornecedores.id] }),
}));

export const ataItensRelations = relations(ataItens, ({ one, many }) => ({
  ata: one(atasRegistroPreco, { fields: [ataItens.ataId], references: [atasRegistroPreco.id] }),
  quantidades: many(ataItemQuantidades),
  cotacao: one(ataItemCotacoes, { fields: [ataItens.id], references: [ataItemCotacoes.itemId] }),
  resultado: one(ataItemResultados, { fields: [ataItens.id], references: [ataItemResultados.itemId] }),
  prePedidos: many(ataPrePedidos),
}));

export const ataItemQuantidadesRelations = relations(ataItemQuantidades, ({ one }) => ({
  item: one(ataItens, { fields: [ataItemQuantidades.itemId], references: [ataItens.id] }),
  ente: one(entes, { fields: [ataItemQuantidades.enteId], references: [entes.id] }),
}));

export const ataItemCotacoesRelations = relations(ataItemCotacoes, ({ one }) => ({
  item: one(ataItens, { fields: [ataItemCotacoes.itemId], references: [ataItens.id] }),
}));

export const ataItemResultadosRelations = relations(ataItemResultados, ({ one }) => ({
  item: one(ataItens, { fields: [ataItemResultados.itemId], references: [ataItens.id] }),
  fornecedor: one(fornecedores, { fields: [ataItemResultados.fornecedorId], references: [fornecedores.id] }),
}));

export const ataPrePedidosRelations = relations(ataPrePedidos, ({ one, many }) => ({
  ata: one(atasRegistroPreco, { fields: [ataPrePedidos.ataId], references: [atasRegistroPreco.id] }),
  ataContrato: one(ataContratos, { fields: [ataPrePedidos.ataContratoId], references: [ataContratos.id] }),
  item: one(ataItens, { fields: [ataPrePedidos.itemId], references: [ataItens.id] }),
  ente: one(entes, { fields: [ataPrePedidos.enteId], references: [entes.id] }),
  fonteRecurso: one(fontesRecurso, { fields: [ataPrePedidos.fonteRecursoId], references: [fontesRecurso.id] }),
  ficha: one(fichasOrcamentarias, { fields: [ataPrePedidos.fichaId], references: [fichasOrcamentarias.id] }),
  empenhos: many(ataEmpenhos),
}));

export const ataContratosRelations = relations(ataContratos, ({ one, many }) => ({
  ata: one(atasRegistroPreco, { fields: [ataContratos.ataId], references: [atasRegistroPreco.id] }),
  fornecedor: one(fornecedores, { fields: [ataContratos.fornecedorId], references: [fornecedores.id] }),
  prePedidos: many(ataPrePedidos),
  empenhos: many(ataEmpenhos),
}));

export const ataEmpenhosRelations = relations(ataEmpenhos, ({ one, many }) => ({
  contrato: one(ataContratos, { fields: [ataEmpenhos.ataContratoId], references: [ataContratos.id] }),
  prePedido: one(ataPrePedidos, { fields: [ataEmpenhos.ataPrePedidoId], references: [ataPrePedidos.id] }),
  afs: many(ataAfs),
}));

export const ataAfsRelations = relations(ataAfs, ({ one, many }) => ({
  empenho: one(ataEmpenhos, { fields: [ataAfs.ataEmpenhoId], references: [ataEmpenhos.id] }),
  notasFiscais: many(ataNotasFiscais),
}));

export const ataNotasFiscaisRelations = relations(ataNotasFiscais, ({ one }) => ({
  contrato: one(ataContratos, { fields: [ataNotasFiscais.ataContratoId], references: [ataContratos.id] }),
  af: one(ataAfs, { fields: [ataNotasFiscais.ataAfId], references: [ataAfs.id] }),
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
  atasRegistroPreco: many(atasRegistroPreco),
  itens: many(processoItens),
  participantes: many(processoParticipantes),
  dotacoes: many(processoDotacoes),
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
}));

export const processoDotacoesRelations = relations(processoDotacoes, ({ one }) => ({
  processo: one(processosDigitais, {
    fields: [processoDotacoes.processoId],
    references: [processosDigitais.id],
  }),
  fichaOrcamentaria: one(fichasOrcamentarias, {
    fields: [processoDotacoes.fichaOrcamentariaId],
    references: [fichasOrcamentarias.id],
  }),
}));

// Schemas de Inserção
export const insertUserSchema = z.object(createInsertSchema(users).shape).omit({ id: true, createdAt: true });
export const insertEnteSchema = z.object(createInsertSchema(entes).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertDepartamentoSchema = z.object(createInsertSchema(departamentos).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertFornecedorSchema = z.object(createInsertSchema(fornecedores).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertFonteRecursoSchema = z.object(createInsertSchema(fontesRecurso).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertFichaOrcamentariaSchema = z.object(createInsertSchema(fichasOrcamentarias).shape).omit({ id: true, criadoEm: true });
export const insertProjetoAtividadeSchema = z.object(createInsertSchema(projetosAtividade).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertProcessoDigitalSchema = z.object(createInsertSchema(processosDigitais).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertFaseContratacaoSchema = z.object(createInsertSchema(fasesContratacao).shape).omit({ id: true, criadoEm: true });
export const insertContratoSchema = z.object(createInsertSchema(contratos).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertAtaRegistroPrecoSchema = z.object(createInsertSchema(atasRegistroPreco).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertAtaItemSchema = z.object(createInsertSchema(ataItens).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });

export const insertAtaItemQuantidadeSchema = z.object(createInsertSchema(ataItemQuantidades).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertAtaItemCotacaoSchema = z.object(createInsertSchema(ataItemCotacoes).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertAtaItemResultadoSchema = z.object(createInsertSchema(ataItemResultados).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertAtaPrePedidoSchema = z.object(createInsertSchema(ataPrePedidos).shape).omit({ id: true, criadoEm: true, atualizadoEm: true }).extend({
  status: ataPrePedidoStatusSchema.default("aberto"),
});
export const insertAtaContratoSchema = z.object(createInsertSchema(ataContratos).shape).omit({ id: true, criadoEm: true, atualizadoEm: true, ataId: true });
export const insertAtaEmpenhoSchema = z.object(createInsertSchema(ataEmpenhos).shape).omit({ id: true, criadoEm: true, ataContratoId: true, status: true });
export const insertAtaAfSchema = z.object(createInsertSchema(ataAfs).shape).omit({ id: true, criadoEm: true, ataEmpenhoId: true, dataEntregaReal: true });
export const insertAtaNotaFiscalSchema = z.object(createInsertSchema(ataNotasFiscais).shape).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
  ataContratoId: true,
  statusPagamento: true,
  numeroProcessoPagamento: true,
  dataEnvioPagamento: true,
  dataPagamento: true,
});
export const insertEmpenhoSchema = z.object(createInsertSchema(empenhos).shape).omit({
  id: true,
  criadoEm: true,
  status: true,
  valorAnulado: true,
  dataAnulacao: true,
  motivoAnulacao: true,
});
export const insertAfSchema = z.object(createInsertSchema(afs).shape).omit({ id: true, dataEstimadaEntrega: true, criadoEm: true, flagEntregaNotificada: true, dataExtensao: true });
export const insertNotaFiscalSchema = z.object(createInsertSchema(notasFiscais).shape).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
  dataPagamento: true,
  statusPagamento: true,
  numeroProcessoPagamento: true,
  dataEnvioPagamento: true,
});
export const insertContratoAditivoSchema = z.object(createInsertSchema(contratoAditivos).shape).omit({ id: true, criadoEm: true, contratoId: true }).extend({
  tipoAditivo: aditivoTipoSchema,
});
export const insertContratoAnexoSchema = z.object(createInsertSchema(contratoAnexos).shape).omit({ id: true, criadoEm: true, contratoId: true });

export const insertProcessoItemSchema = z.object(createInsertSchema(processoItens).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertProcessoItemQuantidadeSchema = z.object(createInsertSchema(processoItemQuantidades).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertProcessoItemCotacaoSchema = z.object(createInsertSchema(processoItemCotacoes).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertProcessoItemResultadoSchema = z.object(createInsertSchema(processoItemResultados).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });
export const insertProcessoParticipanteSchema = z.object(createInsertSchema(processoParticipantes).shape).omit({ id: true, criadoEm: true });
export const insertProcessoDotacaoSchema = z.object(createInsertSchema(processoDotacoes).shape).omit({ id: true, criadoEm: true, atualizadoEm: true });

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: userRoleSchema,
  enteId: z.string().nullable().optional(),
  accessibleEnteIds: z.array(z.string()).default([]),
  canAccessAtaModule: z.boolean().default(false),
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
  projetoAtividadeId: z.string(),
  codigo: fichaCodigoSchema,
  ano: z.string(),
  classificacao: fichaClassificacaoSchema,
  criadoEm: timestampSchema.nullable().optional(),
});

export const projetoAtividadeResponseSchema = z.object({
  id: z.string(),
  fonteRecursoId: z.string(),
  codigo: projetoAtividadeCodigoSchema,
  ano: z.string(),
  descricao: z.string(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const fonteRecursoResponseSchema = z.object({
  id: z.string(),
  nome: z.string(),
  codigo: fonteRecursoCodigoSchema,
  ano: z.string(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const fonteRecursoWithFichasSchema = fonteRecursoResponseSchema.extend({
  fichas: z.array(fichaOrcamentariaResponseSchema),
  projetosAtividade: z.array(projetoAtividadeResponseSchema),
});

export const auditLogResponseSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  userEmail: z.string().nullable(),
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
  status: z.string(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const processoParticipanteResponseSchema = z.object({
  id: z.string(),
  processoId: z.string(),
  departamentoId: z.string(),
  criadoEm: timestampSchema.nullable().optional(),
});

export const processoItemResponseSchema = z.object({
  id: z.string(),
  processoId: z.string(),
  codigoInterno: z.string(),
  descricao: z.string(),
  unidadeMedida: z.string(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const processoItemQuantidadeResponseSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  departamentoId: z.string(),
  quantidade: z.union([z.string(), z.number()]),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const processoItemCotacaoResponseSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  valorUnitarioCotado: z.union([z.string(), z.number()]),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const processoItemResultadoResponseSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  fornecedorId: z.string().nullable(),
  valorUnitarioLicitado: z.union([z.string(), z.number()]).nullable(),
  itemFracassado: z.boolean(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const processoDotacaoResponseSchema = z.object({
  id: z.string(),
  processoId: z.string(),
  fichaOrcamentariaId: z.string(),
  anoDotacao: z.string(),
  valorEstimado: z.union([z.string(), z.number()]).nullable(),
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
  numeroAf: z.string(),
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
  numeroEmpenho: z.string(),
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

export const ataRegistroPrecoResponseSchema = z.object({
  id: z.string(),
  processoDigitalId: z.string(),
  numeroAta: z.string(),
  objeto: z.string(),
  vigenciaInicial: isoDateSchema,
  vigenciaFinal: isoDateSchema,
  status: ataRegistroPrecoStatusSchema,
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const ataParticipanteResponseSchema = z.object({
  id: z.string(),
  ataId: z.string(),
  enteId: z.string(),
  criadoEm: timestampSchema.nullable().optional(),
});

export const ataFornecedorResponseSchema = z.object({
  id: z.string(),
  ataId: z.string(),
  fornecedorId: z.string(),
  criadoEm: timestampSchema.nullable().optional(),
});

export const ataItemResponseSchema = z.object({
  id: z.string(),
  ataId: z.string(),
  codigoInterno: z.string(),
  descricao: z.string(),
  unidadeMedida: z.string(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const ataItemQuantidadeResponseSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  enteId: z.string(),
  quantidade: z.union([z.string(), z.number()]),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const ataItemCotacaoResponseSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  valorUnitarioCotado: z.union([z.string(), z.number()]),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const ataItemResultadoResponseSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  fornecedorId: z.string().nullable(),
  valorUnitarioLicitado: z.union([z.string(), z.number()]).nullable(),
  itemFracassado: z.boolean(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const ataPrePedidoResponseSchema = z.object({
  id: z.string(),
  ataId: z.string(),
  ataContratoId: z.string().nullable(),
  itemId: z.string(),
  enteId: z.string(),
  fonteRecursoId: z.string(),
  fichaId: z.string(),
  quantidadeSolicitada: z.union([z.string(), z.number()]),
  status: ataPrePedidoStatusSchema,
  observacao: z.string().nullable(),
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const ataContratoResponseSchema = z.object({
  id: z.string(),
  ataId: z.string(),
  fornecedorId: z.string(),
  numeroContrato: z.string(),
  objeto: z.string(),
  vigenciaInicial: isoDateSchema,
  vigenciaFinal: isoDateSchema,
  status: contractStatusSchema,
  criadoEm: timestampSchema.nullable().optional(),
  atualizadoEm: timestampSchema.nullable().optional(),
});

export const ataEmpenhoResponseSchema = z.object({
  id: z.string(),
  ataContratoId: z.string().nullable(),
  ataPrePedidoId: z.string(),
  dataEmpenho: isoDateSchema,
  numeroEmpenho: z.string(),
  quantidadeEmpenhada: z.union([z.string(), z.number()]),
  valorEmpenho: z.union([z.string(), z.number()]),
  status: z.enum(["ativo"]),
  criadoEm: timestampSchema.nullable().optional(),
});

export const ataAfResponseSchema = z.object({
  id: z.string(),
  ataEmpenhoId: z.string(),
  dataPedidoAf: isoDateSchema,
  quantidadeAf: z.union([z.string(), z.number()]),
  valorAf: z.union([z.string(), z.number()]),
  dataEstimadaEntrega: isoDateSchema,
  dataEntregaReal: isoDateSchema.nullable(),
  criadoEm: timestampSchema.nullable().optional(),
});

export const ataNotaFiscalResponseSchema = z.object({
  id: z.string(),
  ataContratoId: z.string().nullable(),
  ataAfId: z.string(),
  numeroNota: z.string(),
  quantidadeNota: z.union([z.string(), z.number()]),
  valorNota: z.union([z.string(), z.number()]),
  dataNota: isoDateSchema,
  statusPagamento: notaFiscalStatusSchema,
  numeroProcessoPagamento: z.string().nullable(),
  dataEnvioPagamento: isoDateSchema.nullable(),
  dataPagamento: isoDateSchema.nullable(),
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

export const processoParticipanteWithDepartamentoSchema = processoParticipanteResponseSchema.extend({
  departamento: departamentoResponseSchema,
});

export const processoDotacaoWithFichaSchema = processoDotacaoResponseSchema.extend({
  fichaOrcamentaria: fichaOrcamentariaResponseSchema,
});

export const processoItemWithRelationsSchema = processoItemResponseSchema.extend({
  quantidades: z.array(
    processoItemQuantidadeResponseSchema.extend({
      departamento: departamentoResponseSchema,
    }),
  ),
  cotacao: processoItemCotacaoResponseSchema.nullable(),
  resultado: processoItemResultadoResponseSchema.extend({
    fornecedor: fornecedorResponseSchema.nullable(),
  }).nullable(),
});

export const processoDigitalWithRelationsSchema = processoDigitalResponseSchema.extend({
  departamento: departamentoResponseSchema.extend({ ente: enteResponseSchema.nullable() }).nullable(),
  fases: z.array(
    faseContratacaoResponseSchema.extend({
      fornecedor: fornecedorResponseSchema,
    }),
  ),
  participantes: z.array(processoParticipanteWithDepartamentoSchema),
  itens: z.array(processoItemWithRelationsSchema),
  dotacoes: z.array(processoDotacaoWithFichaSchema),
});

export const processoDigitalScopedSchema = processoDigitalResponseSchema.extend({
  departamento: departamentoResponseSchema.extend({ ente: enteResponseSchema.nullable() }).nullable(),
});

export const ataParticipanteWithEnteSchema = ataParticipanteResponseSchema.extend({
  ente: enteResponseSchema,
});

export const ataFornecedorWithFornecedorSchema = ataFornecedorResponseSchema.extend({
  fornecedor: fornecedorResponseSchema,
});

export const ataItemQuantidadeWithEnteSchema = ataItemQuantidadeResponseSchema.extend({
  ente: enteResponseSchema,
});

export const ataItemWithRelationsSchema = ataItemResponseSchema.extend({
  quantidades: z.array(ataItemQuantidadeWithEnteSchema),
  cotacao: ataItemCotacaoResponseSchema.nullable(),
  resultado: ataItemResultadoResponseSchema.extend({
    fornecedor: fornecedorResponseSchema.nullable().optional(),
  }).nullable(),
});

export const ataRegistroPrecoWithRelationsSchema = ataRegistroPrecoResponseSchema.extend({
  processoDigital: processoDigitalScopedSchema,
  participantes: z.array(ataParticipanteWithEnteSchema),
  fornecedores: z.array(ataFornecedorWithFornecedorSchema),
  itens: z.array(ataItemWithRelationsSchema),
});

export const ataPrePedidoWithRelationsSchema = ataPrePedidoResponseSchema.extend({
  ataContrato: ataContratoResponseSchema.nullable().optional(),
  ente: enteResponseSchema,
  fonteRecurso: fonteRecursoResponseSchema,
  ficha: fichaOrcamentariaResponseSchema,
  item: ataItemWithRelationsSchema,
  ata: ataRegistroPrecoWithRelationsSchema,
  empenhos: z.array(ataEmpenhoResponseSchema.extend({
    afs: z.array(ataAfResponseSchema.extend({
      notasFiscais: z.array(ataNotaFiscalResponseSchema).optional(),
    })).optional(),
  })).optional(),
});

export const ataPrePedidoDisponivelItemSchema = ataItemWithRelationsSchema.extend({
  quantidadeParticipante: z.number(),
  quantidadePrePedida: z.number(),
  quantidadeDisponivel: z.number(),
});

export const ataPrePedidoDisponivelSchema = ataRegistroPrecoResponseSchema.extend({
  processoDigital: processoDigitalScopedSchema,
  ente: enteResponseSchema,
  itens: z.array(ataPrePedidoDisponivelItemSchema),
});

export const ataEmpenhoWithRelationsSchema = ataEmpenhoResponseSchema.extend({
  prePedido: ataPrePedidoWithRelationsSchema,
  afs: z.array(ataAfResponseSchema.extend({
    notasFiscais: z.array(ataNotaFiscalResponseSchema).optional(),
  })),
});

export const ataContratoWithRelationsSchema = ataContratoResponseSchema.extend({
  ata: ataRegistroPrecoWithRelationsSchema,
  fornecedor: fornecedorResponseSchema,
  prePedidos: z.array(ataPrePedidoWithRelationsSchema),
  empenhos: z.array(ataEmpenhoWithRelationsSchema),
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
export type AtaRegistroPreco = typeof atasRegistroPreco.$inferSelect;
export type AtaParticipante = typeof ataParticipantes.$inferSelect;
export type AtaFornecedor = typeof ataFornecedores.$inferSelect;
export type AtaItem = typeof ataItens.$inferSelect;
export type AtaItemQuantidade = typeof ataItemQuantidades.$inferSelect;
export type AtaItemCotacao = typeof ataItemCotacoes.$inferSelect;
export type AtaItemResultado = typeof ataItemResultados.$inferSelect;
export type AtaPrePedido = typeof ataPrePedidos.$inferSelect;
export type AtaContrato = typeof ataContratos.$inferSelect;
export type AtaEmpenho = typeof ataEmpenhos.$inferSelect;
export type AtaAf = typeof ataAfs.$inferSelect;
export type AtaNotaFiscal = typeof ataNotasFiscais.$inferSelect;
export type Empenho = typeof empenhos.$inferSelect;
export type Af = typeof afs.$inferSelect;
export type ProcessoParticipante = typeof processoParticipantes.$inferSelect;
export type ProcessoDotacao = typeof processoDotacoes.$inferSelect;
export type ProcessoItem = typeof processoItens.$inferSelect;
export type ProcessoItemQuantidade = typeof processoItemQuantidades.$inferSelect;
export type ProcessoItemCotacao = typeof processoItemCotacoes.$inferSelect;
export type ProcessoItemResultado = typeof processoItemResultados.$inferSelect;
export type Departamento = typeof departamentos.$inferSelect;
export type Ente = typeof entes.$inferSelect;
export type UserEnte = typeof userEntes.$inferSelect;
export type FonteRecurso = typeof fontesRecurso.$inferSelect;
export type FichaOrcamentaria = typeof fichasOrcamentarias.$inferSelect;
export type ProjetoAtividade = typeof projetosAtividade.$inferSelect;
export type NotaFiscal = typeof notasFiscais.$inferSelect;
export type ContratoAditivo = typeof contratoAditivos.$inferSelect;
export type ContratoAnexo = typeof contratoAnexos.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEnte = z.infer<typeof insertEnteSchema>;
export type InsertDepartamento = z.infer<typeof insertDepartamentoSchema>;
export type InsertFornecedor = z.infer<typeof insertFornecedorSchema>;
export type InsertFonteRecurso = z.infer<typeof insertFonteRecursoSchema>;
export type InsertFichaOrcamentaria = z.infer<typeof insertFichaOrcamentariaSchema>;
export type InsertProjetoAtividade = z.infer<typeof insertProjetoAtividadeSchema>;
export type InsertProcessoDigital = z.infer<typeof insertProcessoDigitalSchema>;
export type InsertFaseContratacao = z.infer<typeof insertFaseContratacaoSchema>;
export type InsertContrato = z.infer<typeof insertContratoSchema>;
export type InsertAtaRegistroPreco = z.infer<typeof insertAtaRegistroPrecoSchema>;
export type InsertAtaItem = z.infer<typeof insertAtaItemSchema>;
export type InsertAtaItemQuantidade = z.infer<typeof insertAtaItemQuantidadeSchema>;
export type InsertAtaItemCotacao = z.infer<typeof insertAtaItemCotacaoSchema>;
export type InsertAtaItemResultado = z.infer<typeof insertAtaItemResultadoSchema>;
export type InsertAtaPrePedido = z.infer<typeof insertAtaPrePedidoSchema>;
export type InsertAtaContrato = z.infer<typeof insertAtaContratoSchema>;
export type InsertAtaEmpenho = z.infer<typeof insertAtaEmpenhoSchema>;
export type InsertAtaAf = z.infer<typeof insertAtaAfSchema>;
export type InsertAtaNotaFiscal = z.infer<typeof insertAtaNotaFiscalSchema>;
export type InsertEmpenho = z.infer<typeof insertEmpenhoSchema>;
export type InsertAf = z.infer<typeof insertAfSchema>;
export type InsertNotaFiscal = z.infer<typeof insertNotaFiscalSchema>;
export type InsertContratoAditivo = z.infer<typeof insertContratoAditivoSchema>;
export type InsertContratoAnexo = z.infer<typeof insertContratoAnexoSchema>;
export type InsertProcessoItem = z.infer<typeof insertProcessoItemSchema>;
export type InsertProcessoParticipante = z.infer<typeof insertProcessoParticipanteSchema>;
export type InsertProcessoDotacao = z.infer<typeof insertProcessoDotacaoSchema>;
export type Notificacao = z.infer<typeof notificacaoResponseSchema>;
export type DashboardStats = z.infer<typeof dashboardStatsResponseSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;

export type FaseContratacaoWithRelations = z.infer<typeof faseContratacaoWithRelationsSchema>;
export type ProcessoParticipanteWithDepartamento = z.infer<typeof processoParticipanteWithDepartamentoSchema>;
export type ProcessoDotacaoWithFicha = z.infer<typeof processoDotacaoWithFichaSchema>;
export type ProcessoItemWithRelations = z.infer<typeof processoItemWithRelationsSchema>;
export type ProcessoDigitalWithRelations = z.infer<typeof processoDigitalWithRelationsSchema>;
export type NotaFiscalWithRelations = z.infer<typeof notaFiscalWithRelationsSchema>;
export type AfWithRelations = z.infer<typeof afWithRelationsSchema>;
export type FonteRecursoWithFichas = FonteRecurso & { fichas: FichaOrcamentaria[]; projetosAtividade: ProjetoAtividade[] };
export type EmpenhoWithRelations = z.infer<typeof empenhoWithRelationsSchema>;
export type ContratoWithRelations = z.infer<typeof contratoWithRelationsSchema>;
export type AtaParticipanteWithEnte = z.infer<typeof ataParticipanteWithEnteSchema>;
export type AtaFornecedorWithFornecedor = z.infer<typeof ataFornecedorWithFornecedorSchema>;
export type AtaItemQuantidadeWithEnte = z.infer<typeof ataItemQuantidadeWithEnteSchema>;
export type AtaItemWithRelations = z.infer<typeof ataItemWithRelationsSchema>;
export type AtaRegistroPrecoWithRelations = z.infer<typeof ataRegistroPrecoWithRelationsSchema>;
export type AtaPrePedidoWithRelations = z.infer<typeof ataPrePedidoWithRelationsSchema>;
export type AtaPrePedidoDisponivelItem = z.infer<typeof ataPrePedidoDisponivelItemSchema>;
export type AtaPrePedidoDisponivel = z.infer<typeof ataPrePedidoDisponivelSchema>;
export type AtaEmpenhoWithRelations = z.infer<typeof ataEmpenhoWithRelationsSchema>;
export type AtaContratoWithRelations = z.infer<typeof ataContratoWithRelationsSchema>;
