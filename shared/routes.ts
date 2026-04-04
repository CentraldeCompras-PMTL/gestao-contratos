import { z } from 'zod';
import { 
  insertUserSchema, 
  insertDepartamentoSchema,
  insertFornecedorSchema, 
  insertFonteRecursoSchema,
  insertFichaOrcamentariaSchema,
  insertProjetoAtividadeSchema,
  insertEnteSchema,
  insertProcessoDigitalSchema, 
  insertProcessoItemSchema,
  insertProcessoItemQuantidadeSchema,
  insertProcessoItemCotacaoSchema,
  insertProcessoItemResultadoSchema,
  insertFaseContratacaoSchema,
  insertContratoSchema,
  insertAtaRegistroPrecoSchema,
  insertAtaItemSchema,
  insertAtaItemQuantidadeSchema,
  insertAtaItemCotacaoSchema,
  insertAtaItemResultadoSchema,
  insertAtaPrePedidoSchema,
  insertAtaContratoSchema,
  insertAtaEmpenhoSchema,
  insertAtaAfSchema,
  insertAtaNotaFiscalSchema,
  insertContratoAditivoSchema,
  insertContratoAnexoSchema,
  insertEmpenhoSchema,
  insertAfSchema,
  insertNotaFiscalSchema,
  publicUserSchema,
  auditLogResponseSchema,
  departamentoResponseSchema,
  fornecedorResponseSchema,
  fonteRecursoResponseSchema,
  fonteRecursoWithFichasSchema,
  fichaOrcamentariaResponseSchema,
  projetoAtividadeResponseSchema,
  enteResponseSchema,
  cnpjLookupResponseSchema,
  ataRegistroPrecoResponseSchema,
  ataRegistroPrecoWithRelationsSchema,
  ataItemWithRelationsSchema,
  ataPrePedidoDisponivelSchema,
  ataPrePedidoWithRelationsSchema,
  ataContratoWithRelationsSchema,
  ataEmpenhoWithRelationsSchema,
  ataNotaFiscalResponseSchema,
  processoDigitalResponseSchema,
  processoDigitalWithRelationsSchema,
  faseContratacaoWithRelationsSchema,
  contratoResponseSchema,
  contratoWithRelationsSchema,
  contratoAditivoResponseSchema,
  contratoAnexoResponseSchema,
  empenhoResponseSchema,
  afResponseSchema,
  afWithRelationsSchema,
  notaFiscalResponseSchema,
  notaFiscalWithRelationsSchema,
  notificacaoResponseSchema,
  dashboardStatsResponseSchema
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  departamentos: {
    list: {
      method: 'GET' as const,
      path: '/api/departamentos' as const,
      responses: { 200: z.array(departamentoResponseSchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/departamentos' as const,
      input: insertDepartamentoSchema,
      responses: { 201: departamentoResponseSchema },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/departamentos/:id' as const,
      input: insertDepartamentoSchema.partial(),
      responses: { 200: departamentoResponseSchema, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/departamentos/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    }
  },
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: { 200: publicUserSchema, 401: errorSchemas.unauthorized },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: { 200: z.object({ message: z.string() }) },
    },
    forgotPassword: {
      method: 'POST' as const,
      path: '/api/forgot-password' as const,
      input: z.object({ email: z.string().email() }),
      responses: { 200: z.object({ message: z.string() }) },
    },
    resetPassword: {
      method: 'POST' as const,
      path: '/api/reset-password' as const,
      input: z.object({ token: z.string().min(1), password: z.string().min(6) }),
      responses: { 200: z.object({ message: z.string() }) },
    },
    changePassword: {
      method: 'POST' as const,
      path: '/api/change-password' as const,
      input: z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6) }),
      responses: { 200: z.object({ message: z.string() }), 401: errorSchemas.unauthorized },
    },
    me: {
      method: 'GET' as const,
      path: '/api/me' as const,
      responses: { 200: publicUserSchema, 401: errorSchemas.unauthorized },
    }
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: { 200: z.array(publicUserSchema), 401: errorSchemas.unauthorized },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users' as const,
      input: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        role: z.enum(["admin", "operacional"]),
        enteIds: z.array(z.string()).optional(),
        canAccessAtaModule: z.boolean().optional(),
      }),
      responses: { 201: publicUserSchema, 400: errorSchemas.validation, 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/users/:id' as const,
      input: z.object({
        email: z.string().email(),
        name: z.string().min(1),
        role: z.enum(["admin", "operacional"]),
        enteIds: z.array(z.string()).optional(),
        canAccessAtaModule: z.boolean().optional(),
      }),
      responses: { 200: publicUserSchema, 400: errorSchemas.validation, 401: errorSchemas.unauthorized, 404: errorSchemas.notFound },
    },
    resetPassword: {
      method: 'POST' as const,
      path: '/api/users/:id/reset-password' as const,
      input: z.object({ password: z.string().min(6) }),
      responses: { 200: z.object({ message: z.string() }), 400: errorSchemas.validation, 401: errorSchemas.unauthorized, 404: errorSchemas.notFound },
    },
  },
  entes: {
    list: {
      method: 'GET' as const,
      path: '/api/entes' as const,
      responses: { 200: z.array(enteResponseSchema), 401: errorSchemas.unauthorized },
    },
    create: {
      method: 'POST' as const,
      path: '/api/entes' as const,
      input: insertEnteSchema,
      responses: { 201: enteResponseSchema, 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/entes/:id' as const,
      input: insertEnteSchema.partial(),
      responses: { 200: enteResponseSchema, 404: errorSchemas.notFound },
    },
  },
  fornecedores: {
    list: {
      method: 'GET' as const,
      path: '/api/fornecedores' as const,
      responses: { 200: z.array(fornecedorResponseSchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/fornecedores' as const,
      input: insertFornecedorSchema,
      responses: { 201: fornecedorResponseSchema },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/fornecedores/:id' as const,
      input: insertFornecedorSchema.partial(),
      responses: { 200: fornecedorResponseSchema, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/fornecedores/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
    lookupCnpj: {
      method: 'GET' as const,
      path: '/api/fornecedores/cnpj/:cnpj' as const,
      responses: { 200: cnpjLookupResponseSchema, 404: errorSchemas.notFound },
    }
  },
  fontesRecurso: {
    list: {
      method: 'GET' as const,
      path: '/api/fontes-recurso' as const,
      responses: { 200: z.array(fonteRecursoWithFichasSchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/fontes-recurso' as const,
      input: insertFonteRecursoSchema,
      responses: { 201: fonteRecursoResponseSchema },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/fontes-recurso/:id' as const,
      input: insertFonteRecursoSchema.partial(),
      responses: { 200: fonteRecursoResponseSchema, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/fontes-recurso/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
    createFicha: {
      method: 'POST' as const,
      path: '/api/fontes-recurso/:fonteRecursoId/fichas' as const,
      input: insertFichaOrcamentariaSchema.omit({ fonteRecursoId: true }),
      responses: { 201: fichaOrcamentariaResponseSchema, 404: errorSchemas.notFound },
    },
    updateFicha: {
      method: 'PUT' as const,
      path: '/api/fichas/:id' as const,
      input: insertFichaOrcamentariaSchema.omit({ fonteRecursoId: true }).partial(),
      responses: { 200: fichaOrcamentariaResponseSchema, 404: errorSchemas.notFound },
    },
    deleteFicha: {
      method: 'DELETE' as const,
      path: '/api/fichas/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
    createProjetoAtividade: {
      method: 'POST' as const,
      path: '/api/fontes-recurso/:fonteRecursoId/projetos-atividade' as const,
      input: insertProjetoAtividadeSchema.omit({ fonteRecursoId: true }),
      responses: { 201: projetoAtividadeResponseSchema, 404: errorSchemas.notFound },
    },
    updateProjetoAtividade: {
      method: 'PUT' as const,
      path: '/api/projetos-atividade/:id' as const,
      input: insertProjetoAtividadeSchema.omit({ fonteRecursoId: true }).partial(),
      responses: { 200: projetoAtividadeResponseSchema, 404: errorSchemas.notFound },
    },
    deleteProjetoAtividade: {
      method: 'DELETE' as const,
      path: '/api/projetos-atividade/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
  },
  atasRegistroPreco: {
    list: {
      method: 'GET' as const,
      path: '/api/atas-registro-preco' as const,
      responses: { 200: z.array(ataRegistroPrecoWithRelationsSchema) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/atas-registro-preco/:id' as const,
      responses: { 200: ataRegistroPrecoWithRelationsSchema, 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/atas-registro-preco' as const,
      input: z.object({
        numeroAta: z.string().min(1),
        processoDigitalId: z.string().min(1),
        objeto: z.string().min(1),
        vigenciaInicial: z.string().min(1),
        vigenciaFinal: z.string().min(1),
        status: z.enum(["planejamento", "cotacao", "licitada", "vigente", "encerrada"]).default("planejamento"),
        participanteEnteIds: z.array(z.string()).min(1),
        fornecedorIds: z.array(z.string()).default([]),
      }),
      responses: { 201: ataRegistroPrecoResponseSchema },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/atas-registro-preco/:id' as const,
      input: z.object({
        numeroAta: z.string().min(1),
        processoDigitalId: z.string().min(1),
        objeto: z.string().min(1),
        vigenciaInicial: z.string().min(1),
        vigenciaFinal: z.string().min(1),
        status: z.enum(["planejamento", "cotacao", "licitada", "vigente", "encerrada"]),
        participanteEnteIds: z.array(z.string()).min(1),
        fornecedorIds: z.array(z.string()).default([]),
      }),
      responses: { 200: ataRegistroPrecoResponseSchema, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/atas-registro-preco/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
    createItem: {
      method: 'POST' as const,
      path: '/api/atas-registro-preco/:id/itens' as const,
      input: insertAtaItemSchema,
      responses: { 201: ataItemWithRelationsSchema },
    },
    importItems: {
      method: 'POST' as const,
      path: '/api/atas-registro-preco/:id/importar-itens' as const,
      input: z.object({ items: z.array(insertAtaItemSchema).min(1) }),
      responses: { 200: z.array(ataItemWithRelationsSchema) },
    },
    updateItem: {
      method: 'PUT' as const,
      path: '/api/ata-itens/:itemId' as const,
      input: insertAtaItemSchema.partial(),
      responses: { 200: ataItemWithRelationsSchema, 404: errorSchemas.notFound },
    },
    deleteItem: {
      method: 'DELETE' as const,
      path: '/api/ata-itens/:itemId' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
    saveQuantidades: {
      method: 'PUT' as const,
      path: '/api/atas-registro-preco/:id/quantidades' as const,
      input: z.object({
        quantidades: z.array(insertAtaItemQuantidadeSchema.pick({ itemId: true, enteId: true, quantidade: true })),
      }),
      responses: { 200: ataRegistroPrecoWithRelationsSchema, 404: errorSchemas.notFound },
    },
    saveCotacoes: {
      method: 'PUT' as const,
      path: '/api/atas-registro-preco/:id/cotacoes' as const,
      input: z.object({
        cotacoes: z.array(insertAtaItemCotacaoSchema.pick({ itemId: true, valorUnitarioCotado: true })),
      }),
      responses: { 200: ataRegistroPrecoWithRelationsSchema, 404: errorSchemas.notFound },
    },
    saveResultados: {
      method: 'PUT' as const,
      path: '/api/atas-registro-preco/:id/resultados' as const,
      input: z.object({
        resultados: z.array(insertAtaItemResultadoSchema.pick({ itemId: true, fornecedorId: true, valorUnitarioLicitado: true, itemFracassado: true })),
      }),
      responses: { 200: ataRegistroPrecoWithRelationsSchema, 404: errorSchemas.notFound },
    },
  },
  ataPrePedidos: {
    disponiveis: {
      method: 'GET' as const,
      path: '/api/ata-pre-pedidos/disponiveis' as const,
      responses: { 200: z.array(ataPrePedidoDisponivelSchema) },
    },
    list: {
      method: 'GET' as const,
      path: '/api/ata-pre-pedidos' as const,
      responses: { 200: z.array(ataPrePedidoWithRelationsSchema) },
    },
    createBatch: {
      method: 'POST' as const,
      path: '/api/ata-pre-pedidos' as const,
      input: z.object({
        ataId: z.string(),
        enteId: z.string(),
        pedidos: z.array(insertAtaPrePedidoSchema.pick({
          itemId: true,
          fonteRecursoId: true,
          fichaId: true,
          quantidadeSolicitada: true,
          observacao: true,
        })).min(1),
      }),
      responses: { 201: z.array(ataPrePedidoWithRelationsSchema) },
    },
    createEmpenho: {
      method: 'POST' as const,
      path: '/api/ata-pre-pedidos/:id/empenhos' as const,
      input: z.object({
        dataEmpenho: z.string().min(1),
        numeroEmpenho: z.string().min(1),
        quantidadeEmpenhada: z.string().min(1),
        valorEmpenho: z.string().min(1),
      }),
      responses: { 201: ataEmpenhoWithRelationsSchema, 404: errorSchemas.notFound },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/ata-pre-pedidos/:id' as const,
      input: insertAtaPrePedidoSchema.pick({
        fonteRecursoId: true,
        fichaId: true,
        quantidadeSolicitada: true,
        observacao: true,
        status: true,
      }),
      responses: { 200: ataPrePedidoWithRelationsSchema, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/ata-pre-pedidos/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
  },
  ataContratos: {
    list: {
      method: 'GET' as const,
      path: '/api/ata-contratos' as const,
      responses: { 200: z.array(ataContratoWithRelationsSchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/ata-contratos' as const,
      input: z.object({
        ataId: z.string(),
        numeroContrato: z.string().min(1),
        objeto: z.string().min(1),
        vigenciaInicial: z.string().min(1),
        vigenciaFinal: z.string().min(1),
        prePedidoIds: z.array(z.string()).min(1),
      }),
      responses: { 201: ataContratoWithRelationsSchema },
    },
    createEmpenho: {
      method: 'POST' as const,
      path: '/api/ata-contratos/:id/empenhos' as const,
      input: z.object({
        ataPrePedidoId: z.string().min(1),
        dataEmpenho: z.string().min(1),
        numeroEmpenho: z.string().min(1),
        quantidadeEmpenhada: z.string().min(1),
        valorEmpenho: z.string().min(1),
      }),
      responses: { 201: ataEmpenhoWithRelationsSchema, 404: errorSchemas.notFound },
    },
    createAf: {
      method: 'POST' as const,
      path: '/api/ata-empenhos/:id/afs' as const,
      input: z.object({
        dataPedidoAf: z.string().min(1),
        quantidadeAf: z.string().min(1),
        valorAf: z.string().min(1),
        dataEstimadaEntrega: z.string().optional(),
      }),
      responses: { 201: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
  },
  ataNotasFiscais: {
    create: {
      method: 'POST' as const,
      path: '/api/ata-afs/:id/notas-fiscais' as const,
      input: insertAtaNotaFiscalSchema.omit({ ataAfId: true }),
      responses: { 201: ataNotaFiscalResponseSchema, 404: errorSchemas.notFound },
    },
    sendToPayment: {
      method: 'PATCH' as const,
      path: '/api/ata-notas-fiscais/:id/enviar-pagamento' as const,
      input: z.object({
        numeroProcessoPagamento: z.string().min(1),
        dataEnvioPagamento: z.string().min(1),
      }),
      responses: { 200: ataNotaFiscalResponseSchema, 404: errorSchemas.notFound },
    },
    registerPayment: {
      method: 'PATCH' as const,
      path: '/api/ata-notas-fiscais/:id/registrar-pagamento' as const,
      input: z.object({
        dataPagamento: z.string().min(1),
      }),
      responses: { 200: ataNotaFiscalResponseSchema, 404: errorSchemas.notFound },
    },
  },
  processos: {
    list: {
      method: 'GET' as const,
      path: '/api/processos' as const,
      responses: { 200: z.array(processoDigitalWithRelationsSchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/processos' as const,
      input: insertProcessoDigitalSchema,
      responses: { 201: processoDigitalResponseSchema },
    },
    get: {
      method: 'GET' as const,
      path: '/api/processos/:id' as const,
      responses: { 200: processoDigitalWithRelationsSchema, 404: errorSchemas.notFound },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/processos/:id' as const,
      input: insertProcessoDigitalSchema.partial(),
      responses: { 200: processoDigitalResponseSchema, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/processos/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
    addParticipante: {
      method: 'POST' as const,
      path: '/api/processos/:id/participantes' as const,
      input: z.object({ departamentoId: z.string() }),
      responses: { 201: z.any() },
    },
    removeParticipante: {
      method: 'DELETE' as const,
      path: '/api/processos/:id/participantes/:departamentoId' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
    createItem: {
      method: 'POST' as const,
      path: '/api/processos/:id/itens' as const,
      input: insertProcessoItemSchema,
      responses: { 201: z.any() },
    },
    updateItem: {
      method: 'PUT' as const,
      path: '/api/processo-itens/:itemId' as const,
      input: insertProcessoItemSchema.partial(),
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    deleteItem: {
      method: 'DELETE' as const,
      path: '/api/processo-itens/:itemId' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
    saveQuantidades: {
      method: 'PUT' as const,
      path: '/api/processos/:id/quantidades' as const,
      input: z.object({ quantidades: z.array(insertProcessoItemQuantidadeSchema.pick({ itemId: true, departamentoId: true, quantidade: true })) }),
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    saveCotacoes: {
      method: 'PUT' as const,
      path: '/api/processos/:id/cotacoes' as const,
      input: z.object({ cotacoes: z.array(insertProcessoItemCotacaoSchema.pick({ itemId: true, valorUnitarioCotado: true })) }),
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    saveResultados: {
      method: 'PUT' as const,
      path: '/api/processos/:id/resultados' as const,
      input: z.object({ resultados: z.array(insertProcessoItemResultadoSchema.pick({ itemId: true, fornecedorId: true, valorUnitarioLicitado: true, itemFracassado: true })) }),
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    addDotacao: {
      method: 'POST' as const,
      path: '/api/processos/:id/dotacoes' as const,
      input: z.object({
        fichaOrcamentariaId: z.string().min(1),
        anoDotacao: z.string().min(4, 'Ano obrigatorio'),
        valorEstimado: z.string().optional(),
      }),
      responses: { 201: z.any() },
    },
    removeDotacao: {
      method: 'DELETE' as const,
      path: '/api/processos/:id/dotacoes/:dotacaoId' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
  },
  fases: {
    list: {
      method: 'GET' as const,
      path: '/api/fases' as const,
      responses: { 200: z.array(faseContratacaoWithRelationsSchema) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/fases/:id' as const,
      responses: { 200: faseContratacaoWithRelationsSchema, 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/fases' as const,
      input: insertFaseContratacaoSchema,
      responses: { 201: faseContratacaoWithRelationsSchema },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/fases/:id' as const,
      input: insertFaseContratacaoSchema.partial(),
      responses: { 200: faseContratacaoWithRelationsSchema, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/fases/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    }
  },
  contratos: {
    list: {
      method: 'GET' as const,
      path: '/api/contratos' as const,
      responses: { 200: z.array(contratoWithRelationsSchema) },
    },
    listFull: {
      method: 'GET' as const,
      path: '/api/contratos/full' as const,
      responses: { 200: z.array(contratoWithRelationsSchema) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/contratos/:id' as const,
      responses: { 200: contratoWithRelationsSchema, 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/contratos' as const,
      input: insertContratoSchema,
      responses: { 201: contratoResponseSchema },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/contratos/:id' as const,
      input: insertContratoSchema.partial(),
      responses: { 200: contratoResponseSchema, 404: errorSchemas.notFound },
    },
    close: {
      method: 'POST' as const,
      path: '/api/contratos/:id/encerrar' as const,
      input: z.object({ motivoEncerramento: z.string().optional() }),
      responses: { 200: contratoResponseSchema, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/contratos/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
    createAditivo: {
      method: 'POST' as const,
      path: '/api/contratos/:id/aditivos' as const,
      input: insertContratoAditivoSchema,
      responses: { 201: contratoAditivoResponseSchema, 404: errorSchemas.notFound },
    },
    deleteAditivo: {
      method: 'DELETE' as const,
      path: '/api/contratos/aditivos/:aditivoId' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
    createAnexo: {
      method: 'POST' as const,
      path: '/api/contratos/:id/anexos' as const,
      input: insertContratoAnexoSchema,
      responses: { 201: contratoAnexoResponseSchema, 404: errorSchemas.notFound },
    },
    deleteAnexo: {
      method: 'DELETE' as const,
      path: '/api/contratos/anexos/:anexoId' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
  },
  empenhos: {
    create: {
      method: 'POST' as const,
      path: '/api/contratos/:contratoId/empenhos' as const,
      input: insertEmpenhoSchema.omit({ contratoId: true }),
      responses: { 201: empenhoResponseSchema },
    },
    annul: {
      method: 'POST' as const,
      path: '/api/empenhos/:id/anular' as const,
      input: z.object({
        valorAnulado: z.string(),
        dataAnulacao: z.string(),
        motivoAnulacao: z.string().min(1),
      }),
      responses: { 200: empenhoResponseSchema, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/empenhos/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/empenhos/:id' as const,
      input: insertEmpenhoSchema.partial(),
      responses: { 200: empenhoResponseSchema, 404: errorSchemas.notFound },
    },
  },
  afs: {
    list: {
      method: 'GET' as const,
      path: '/api/afs' as const,
      responses: { 200: z.array(afWithRelationsSchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/empenhos/:empenhoId/afs' as const,
      input: insertAfSchema.omit({ empenhoId: true }),
      responses: { 201: afResponseSchema },
    },
    notify: {
      method: 'PATCH' as const,
      path: '/api/afs/:id/notify' as const,
      responses: { 200: afResponseSchema },
    },
    updateEntrega: {
      method: 'PATCH' as const,
      path: '/api/afs/:id/entrega' as const,
      input: z.object({ dataEntregaReal: z.string() }),
      responses: { 200: afResponseSchema },
    },
    extend: {
      method: 'PATCH' as const,
      path: '/api/afs/:id/extend' as const,
      input: z.object({ dataExtensao: z.string() }),
      responses: { 200: afResponseSchema },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/afs/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/afs/:id' as const,
      input: insertAfSchema.partial(),
      responses: { 200: afResponseSchema, 404: errorSchemas.notFound },
    },
  },
  notasFiscais: {
    list: {
      method: 'GET' as const,
      path: '/api/notas-fiscais' as const,
      responses: { 200: z.array(notaFiscalWithRelationsSchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/notas-fiscais' as const,
      input: insertNotaFiscalSchema,
      responses: { 201: notaFiscalResponseSchema },
    },
    sendToPayment: {
      method: 'PATCH' as const,
      path: '/api/notas-fiscais/:id/enviar-pagamento' as const,
      input: z.object({
        numeroProcessoPagamento: z.string().min(1),
        dataEnvioPagamento: z.string(),
      }),
      responses: { 200: notaFiscalResponseSchema },
    },
    registerPayment: {
      method: 'PATCH' as const,
      path: '/api/notas-fiscais/:id/registrar-pagamento' as const,
      input: z.object({ dataPagamento: z.string() }),
      responses: { 200: notaFiscalResponseSchema },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/notas-fiscais/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    }
  },
  notificacoes: {
    list: {
      method: 'GET' as const,
      path: '/api/notificacoes' as const,
      responses: {
        200: z.array(notificacaoResponseSchema),
      },
    }
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats' as const,
      responses: {
        200: dashboardStatsResponseSchema,
      },
    }
  },
  auditLogs: {
    list: {
      method: 'GET' as const,
      path: '/api/audit-logs' as const,
      responses: { 200: z.array(auditLogResponseSchema), 401: errorSchemas.unauthorized },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
