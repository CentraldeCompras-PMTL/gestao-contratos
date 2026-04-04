CREATE TABLE "afs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empenho_id" varchar NOT NULL,
	"numero_af" text DEFAULT 'S/N' NOT NULL,
	"data_pedido_af" date NOT NULL,
	"valor_af" numeric(12, 2) NOT NULL,
	"data_estimada_entrega" date NOT NULL,
	"data_entrega_real" date,
	"flag_entrega_notificada" boolean DEFAULT false,
	"data_extensao" date,
	"criado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ata_afs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ata_empenho_id" varchar NOT NULL,
	"numero_af" text DEFAULT 'S/N' NOT NULL,
	"data_pedido_af" date NOT NULL,
	"quantidade_af" numeric(14, 2) NOT NULL,
	"valor_af" numeric(14, 2) NOT NULL,
	"data_estimada_entrega" date NOT NULL,
	"data_entrega_real" date,
	"criado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ata_contratos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ata_id" varchar NOT NULL,
	"fornecedor_id" varchar NOT NULL,
	"numero_contrato" text NOT NULL,
	"objeto" text NOT NULL,
	"vigencia_inicial" date NOT NULL,
	"vigencia_final" date NOT NULL,
	"status" text DEFAULT 'vigente' NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "ata_contratos_numero_contrato_unique" UNIQUE("numero_contrato")
);
--> statement-breakpoint
CREATE TABLE "ata_empenhos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ata_contrato_id" varchar,
	"ata_pre_pedido_id" varchar NOT NULL,
	"data_empenho" date NOT NULL,
	"numero_empenho" text NOT NULL,
	"quantidade_empenhada" numeric(14, 2) NOT NULL,
	"valor_empenho" numeric(14, 2) NOT NULL,
	"status" text DEFAULT 'ativo' NOT NULL,
	"criado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ata_fornecedores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ata_id" varchar NOT NULL,
	"fornecedor_id" varchar NOT NULL,
	"criado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ata_item_cotacoes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" varchar NOT NULL,
	"valor_unitario_cotado" numeric(14, 2) NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "ata_item_cotacoes_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "ata_item_quantidades" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" varchar NOT NULL,
	"ente_id" varchar NOT NULL,
	"quantidade" numeric(14, 2) DEFAULT '0' NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ata_item_resultados" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" varchar NOT NULL,
	"fornecedor_id" varchar,
	"valor_unitario_licitado" numeric(14, 2),
	"item_fracassado" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "ata_item_resultados_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "ata_itens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ata_id" varchar NOT NULL,
	"codigo_interno" text NOT NULL,
	"descricao" text NOT NULL,
	"unidade_medida" text NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ata_notas_fiscais" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ata_contrato_id" varchar,
	"ata_af_id" varchar NOT NULL,
	"numero_nota" text NOT NULL,
	"quantidade_nota" numeric(14, 2) NOT NULL,
	"valor_nota" numeric(14, 2) NOT NULL,
	"data_nota" date NOT NULL,
	"status_pagamento" text DEFAULT 'nota_recebida' NOT NULL,
	"numero_processo_pagamento" text,
	"data_envio_pagamento" date,
	"data_pagamento" date,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "ata_notas_fiscais_numero_nota_unique" UNIQUE("numero_nota")
);
--> statement-breakpoint
CREATE TABLE "ata_participantes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ata_id" varchar NOT NULL,
	"ente_id" varchar NOT NULL,
	"criado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ata_pre_pedidos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ata_id" varchar NOT NULL,
	"ata_contrato_id" varchar,
	"item_id" varchar NOT NULL,
	"ente_id" varchar NOT NULL,
	"fonte_recurso_id" varchar NOT NULL,
	"ficha_id" varchar NOT NULL,
	"quantidade_solicitada" numeric(14, 2) NOT NULL,
	"status" text DEFAULT 'aberto' NOT NULL,
	"observacao" text,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "atas_registro_preco" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processo_digital_id" varchar NOT NULL,
	"numero_ata" text NOT NULL,
	"objeto" text NOT NULL,
	"vigencia_inicial" date NOT NULL,
	"vigencia_final" date NOT NULL,
	"status" text DEFAULT 'planejamento' NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "atas_registro_preco_numero_ata_unique" UNIQUE("numero_ata")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"details" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contrato_aditivos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contrato_id" varchar NOT NULL,
	"numero_aditivo" text NOT NULL,
	"tipo_aditivo" text NOT NULL,
	"data_assinatura" date NOT NULL,
	"valor_aditivo" numeric(12, 2),
	"nova_vigencia_final" date,
	"justificativa" text,
	"criado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contrato_anexos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contrato_id" varchar NOT NULL,
	"nome_arquivo" text NOT NULL,
	"tipo_documento" text NOT NULL,
	"url_arquivo" text NOT NULL,
	"observacao" text,
	"criado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contratos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processo_digital_id" varchar NOT NULL,
	"fase_contratacao_id" varchar NOT NULL,
	"departamento_id" varchar,
	"numero_contrato" text NOT NULL,
	"fornecedor_id" varchar NOT NULL,
	"valor_contrato" numeric(12, 2) NOT NULL,
	"vigencia_inicial" date NOT NULL,
	"vigencia_final" date NOT NULL,
	"status" text DEFAULT 'vigente' NOT NULL,
	"encerrado_em" date,
	"motivo_encerramento" text,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "contratos_numero_contrato_unique" UNIQUE("numero_contrato")
);
--> statement-breakpoint
CREATE TABLE "departamentos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ente_id" varchar,
	"nome" text NOT NULL,
	"descricao" text,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "departamentos_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "empenhos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contrato_id" varchar NOT NULL,
	"fonte_recurso_id" varchar NOT NULL,
	"ficha_id" varchar NOT NULL,
	"numero_empenho" text DEFAULT 'S/N' NOT NULL,
	"data_empenho" date NOT NULL,
	"valor_empenho" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'ativo' NOT NULL,
	"valor_anulado" numeric(12, 2) DEFAULT '0' NOT NULL,
	"data_anulacao" date,
	"motivo_anulacao" text,
	"criado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "entes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"sigla" text NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "entes_nome_unique" UNIQUE("nome"),
	CONSTRAINT "entes_sigla_unique" UNIQUE("sigla")
);
--> statement-breakpoint
CREATE TABLE "fases_contratacao" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processo_digital_id" varchar NOT NULL,
	"departamento_id" varchar,
	"nome_fase" text NOT NULL,
	"fornecedor_id" varchar NOT NULL,
	"modalidade" text NOT NULL,
	"numero_modalidade" text NOT NULL,
	"data_inicio" date NOT NULL,
	"data_fim" date,
	"criado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fichas_orcamentarias" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fonte_recurso_id" varchar NOT NULL,
	"projeto_atividade_id" varchar NOT NULL,
	"codigo" text NOT NULL,
	"classificacao" text NOT NULL,
	"criado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fontes_recurso" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"codigo" text NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "fontes_recurso_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "fornecedores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"cnpj" text NOT NULL,
	"email" text,
	"telefone" text,
	"cep" text,
	"logradouro" text,
	"numero" text,
	"complemento" text,
	"bairro" text,
	"municipio" text,
	"uf" text,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "fornecedores_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "notas_fiscais" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contrato_id" varchar NOT NULL,
	"numero_nota" text NOT NULL,
	"valor_nota" numeric(12, 2) NOT NULL,
	"data_nota" date NOT NULL,
	"status_pagamento" text DEFAULT 'nota_recebida' NOT NULL,
	"numero_processo_pagamento" text,
	"data_envio_pagamento" date,
	"data_pagamento" date,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "notas_fiscais_numero_nota_unique" UNIQUE("numero_nota")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "processo_item_cotacoes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" varchar NOT NULL,
	"valor_unitario_cotado" numeric(14, 2) NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "processo_item_cotacoes_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "processo_item_quantidades" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" varchar NOT NULL,
	"departamento_id" varchar NOT NULL,
	"quantidade" numeric(14, 2) DEFAULT '0' NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "processo_item_resultados" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" varchar NOT NULL,
	"fornecedor_id" varchar,
	"valor_unitario_licitado" numeric(14, 2),
	"item_fracassado" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "processo_item_resultados_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "processo_itens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processo_id" varchar NOT NULL,
	"codigo_interno" text NOT NULL,
	"descricao" text NOT NULL,
	"unidade_medida" text NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "processos_digitais" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_processo_digital" text NOT NULL,
	"objeto_completo" text NOT NULL,
	"objeto_resumido" text NOT NULL,
	"descricao" text,
	"departamento_id" varchar,
	"status" text DEFAULT 'planejamento' NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now(),
	CONSTRAINT "processos_digitais_numero_processo_digital_unique" UNIQUE("numero_processo_digital")
);
--> statement-breakpoint
CREATE TABLE "projetos_atividade" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fonte_recurso_id" varchar NOT NULL,
	"codigo" text NOT NULL,
	"descricao" text NOT NULL,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_entes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"ente_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'operacional' NOT NULL,
	"ente_id" varchar,
	"can_access_ata_module" boolean DEFAULT false NOT NULL,
	"force_password_change" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "afs" ADD CONSTRAINT "afs_empenho_id_empenhos_id_fk" FOREIGN KEY ("empenho_id") REFERENCES "public"."empenhos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_afs" ADD CONSTRAINT "ata_afs_ata_empenho_id_ata_empenhos_id_fk" FOREIGN KEY ("ata_empenho_id") REFERENCES "public"."ata_empenhos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_contratos" ADD CONSTRAINT "ata_contratos_ata_id_atas_registro_preco_id_fk" FOREIGN KEY ("ata_id") REFERENCES "public"."atas_registro_preco"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_contratos" ADD CONSTRAINT "ata_contratos_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_empenhos" ADD CONSTRAINT "ata_empenhos_ata_contrato_id_ata_contratos_id_fk" FOREIGN KEY ("ata_contrato_id") REFERENCES "public"."ata_contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_empenhos" ADD CONSTRAINT "ata_empenhos_ata_pre_pedido_id_ata_pre_pedidos_id_fk" FOREIGN KEY ("ata_pre_pedido_id") REFERENCES "public"."ata_pre_pedidos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_fornecedores" ADD CONSTRAINT "ata_fornecedores_ata_id_atas_registro_preco_id_fk" FOREIGN KEY ("ata_id") REFERENCES "public"."atas_registro_preco"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_fornecedores" ADD CONSTRAINT "ata_fornecedores_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_item_cotacoes" ADD CONSTRAINT "ata_item_cotacoes_item_id_ata_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."ata_itens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_item_quantidades" ADD CONSTRAINT "ata_item_quantidades_item_id_ata_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."ata_itens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_item_quantidades" ADD CONSTRAINT "ata_item_quantidades_ente_id_entes_id_fk" FOREIGN KEY ("ente_id") REFERENCES "public"."entes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_item_resultados" ADD CONSTRAINT "ata_item_resultados_item_id_ata_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."ata_itens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_item_resultados" ADD CONSTRAINT "ata_item_resultados_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_itens" ADD CONSTRAINT "ata_itens_ata_id_atas_registro_preco_id_fk" FOREIGN KEY ("ata_id") REFERENCES "public"."atas_registro_preco"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_notas_fiscais" ADD CONSTRAINT "ata_notas_fiscais_ata_contrato_id_ata_contratos_id_fk" FOREIGN KEY ("ata_contrato_id") REFERENCES "public"."ata_contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_notas_fiscais" ADD CONSTRAINT "ata_notas_fiscais_ata_af_id_ata_afs_id_fk" FOREIGN KEY ("ata_af_id") REFERENCES "public"."ata_afs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_participantes" ADD CONSTRAINT "ata_participantes_ata_id_atas_registro_preco_id_fk" FOREIGN KEY ("ata_id") REFERENCES "public"."atas_registro_preco"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_participantes" ADD CONSTRAINT "ata_participantes_ente_id_entes_id_fk" FOREIGN KEY ("ente_id") REFERENCES "public"."entes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_pre_pedidos" ADD CONSTRAINT "ata_pre_pedidos_ata_id_atas_registro_preco_id_fk" FOREIGN KEY ("ata_id") REFERENCES "public"."atas_registro_preco"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_pre_pedidos" ADD CONSTRAINT "ata_pre_pedidos_item_id_ata_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."ata_itens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_pre_pedidos" ADD CONSTRAINT "ata_pre_pedidos_ente_id_entes_id_fk" FOREIGN KEY ("ente_id") REFERENCES "public"."entes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_pre_pedidos" ADD CONSTRAINT "ata_pre_pedidos_fonte_recurso_id_fontes_recurso_id_fk" FOREIGN KEY ("fonte_recurso_id") REFERENCES "public"."fontes_recurso"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_pre_pedidos" ADD CONSTRAINT "ata_pre_pedidos_ficha_id_fichas_orcamentarias_id_fk" FOREIGN KEY ("ficha_id") REFERENCES "public"."fichas_orcamentarias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atas_registro_preco" ADD CONSTRAINT "atas_registro_preco_processo_digital_id_processos_digitais_id_fk" FOREIGN KEY ("processo_digital_id") REFERENCES "public"."processos_digitais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contrato_aditivos" ADD CONSTRAINT "contrato_aditivos_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contrato_anexos" ADD CONSTRAINT "contrato_anexos_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_processo_digital_id_processos_digitais_id_fk" FOREIGN KEY ("processo_digital_id") REFERENCES "public"."processos_digitais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_fase_contratacao_id_fases_contratacao_id_fk" FOREIGN KEY ("fase_contratacao_id") REFERENCES "public"."fases_contratacao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_ente_id_entes_id_fk" FOREIGN KEY ("ente_id") REFERENCES "public"."entes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empenhos" ADD CONSTRAINT "empenhos_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empenhos" ADD CONSTRAINT "empenhos_fonte_recurso_id_fontes_recurso_id_fk" FOREIGN KEY ("fonte_recurso_id") REFERENCES "public"."fontes_recurso"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empenhos" ADD CONSTRAINT "empenhos_ficha_id_fichas_orcamentarias_id_fk" FOREIGN KEY ("ficha_id") REFERENCES "public"."fichas_orcamentarias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fases_contratacao" ADD CONSTRAINT "fases_contratacao_processo_digital_id_processos_digitais_id_fk" FOREIGN KEY ("processo_digital_id") REFERENCES "public"."processos_digitais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fases_contratacao" ADD CONSTRAINT "fases_contratacao_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fases_contratacao" ADD CONSTRAINT "fases_contratacao_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fichas_orcamentarias" ADD CONSTRAINT "fichas_orcamentarias_fonte_recurso_id_fontes_recurso_id_fk" FOREIGN KEY ("fonte_recurso_id") REFERENCES "public"."fontes_recurso"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fichas_orcamentarias" ADD CONSTRAINT "fichas_orcamentarias_projeto_atividade_id_projetos_atividade_id_fk" FOREIGN KEY ("projeto_atividade_id") REFERENCES "public"."projetos_atividade"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processo_item_cotacoes" ADD CONSTRAINT "processo_item_cotacoes_item_id_processo_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."processo_itens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processo_item_quantidades" ADD CONSTRAINT "processo_item_quantidades_item_id_processo_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."processo_itens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processo_item_quantidades" ADD CONSTRAINT "processo_item_quantidades_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processo_item_resultados" ADD CONSTRAINT "processo_item_resultados_item_id_processo_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."processo_itens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processo_item_resultados" ADD CONSTRAINT "processo_item_resultados_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processo_itens" ADD CONSTRAINT "processo_itens_processo_id_processos_digitais_id_fk" FOREIGN KEY ("processo_id") REFERENCES "public"."processos_digitais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processos_digitais" ADD CONSTRAINT "processos_digitais_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projetos_atividade" ADD CONSTRAINT "projetos_atividade_fonte_recurso_id_fontes_recurso_id_fk" FOREIGN KEY ("fonte_recurso_id") REFERENCES "public"."fontes_recurso"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entes" ADD CONSTRAINT "user_entes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entes" ADD CONSTRAINT "user_entes_ente_id_entes_id_fk" FOREIGN KEY ("ente_id") REFERENCES "public"."entes"("id") ON DELETE no action ON UPDATE no action;