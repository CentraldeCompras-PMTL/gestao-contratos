import { z } from 'zod';
import { 
  insertUserSchema, 
  insertDepartamentoSchema,
  insertFornecedorSchema, 
  insertEnteSchema,
  insertProcessoDigitalSchema, 
  insertFaseContratacaoSchema,
  insertContratoSchema,
  insertContratoAditivoSchema,
  insertContratoAnexoSchema,
  insertEmpenhoSchema,
  insertAfSchema,
  insertNotaFiscalSchema,
  publicUserSchema,
  auditLogResponseSchema,
  departamentoResponseSchema,
  fornecedorResponseSchema,
  enteResponseSchema,
  cnpjLookupResponseSchema,
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
        enteId: z.string().optional(),
      }),
      responses: { 201: publicUserSchema, 400: errorSchemas.validation, 401: errorSchemas.unauthorized },
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
    }
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
    delete: {
      method: 'DELETE' as const,
      path: '/api/empenhos/:id' as const,
      responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
    }
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
    }
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
    paymentStatus: {
      method: 'PATCH' as const,
      path: '/api/notas-fiscais/:id/pagamento' as const,
      input: z.object({ statusPagamento: z.enum(['pendente', 'pago']), dataPagamento: z.string().optional() }),
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
