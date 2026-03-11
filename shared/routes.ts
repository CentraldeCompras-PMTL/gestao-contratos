import { z } from 'zod';
import { 
  insertUserSchema, 
  insertDepartamentoSchema,
  insertFornecedorSchema, 
  insertProcessoDigitalSchema, 
  insertFaseContratacaoSchema,
  insertContratoSchema,
  insertEmpenhoSchema,
  insertAfSchema,
  insertNotaFiscalSchema
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
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/departamentos' as const,
      input: insertDepartamentoSchema,
      responses: { 201: z.any() },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/departamentos/:id' as const,
      input: insertDepartamentoSchema.partial(),
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    }
  },
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: { 200: z.any(), 401: errorSchemas.unauthorized },
    },
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: z.object({ email: z.string().email(), password: z.string(), name: z.string().optional() }),
      responses: { 201: z.any(), 400: errorSchemas.validation },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: { 200: z.any() },
    },
    me: {
      method: 'GET' as const,
      path: '/api/me' as const,
      responses: { 200: z.any(), 401: errorSchemas.unauthorized },
    }
  },
  fornecedores: {
    list: {
      method: 'GET' as const,
      path: '/api/fornecedores' as const,
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/fornecedores' as const,
      input: insertFornecedorSchema,
      responses: { 201: z.any() },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/fornecedores/:id' as const,
      input: insertFornecedorSchema.partial(),
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    }
  },
  processos: {
    list: {
      method: 'GET' as const,
      path: '/api/processos' as const,
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/processos' as const,
      input: insertProcessoDigitalSchema,
      responses: { 201: z.any() },
    },
    get: {
      method: 'GET' as const,
      path: '/api/processos/:id' as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/processos/:id' as const,
      input: insertProcessoDigitalSchema.partial(),
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    }
  },
  fases: {
    list: {
      method: 'GET' as const,
      path: '/api/fases' as const,
      responses: { 200: z.array(z.any()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/fases/:id' as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/fases' as const,
      input: insertFaseContratacaoSchema,
      responses: { 201: z.any() },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/fases/:id' as const,
      input: insertFaseContratacaoSchema.partial(),
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    }
  },
  contratos: {
    list: {
      method: 'GET' as const,
      path: '/api/contratos' as const,
      responses: { 200: z.array(z.any()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/contratos/:id' as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/contratos' as const,
      input: insertContratoSchema,
      responses: { 201: z.any() },
    }
  },
  empenhos: {
    create: {
      method: 'POST' as const,
      path: '/api/contratos/:contratoId/empenhos' as const,
      input: insertEmpenhoSchema.omit({ contratoId: true }),
      responses: { 201: z.any() },
    }
  },
  afs: {
    list: {
      method: 'GET' as const,
      path: '/api/afs' as const,
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/empenhos/:empenhoId/afs' as const,
      input: insertAfSchema.omit({ empenhoId: true }),
      responses: { 201: z.any() },
    },
    notify: {
      method: 'PATCH' as const,
      path: '/api/afs/:id/notify' as const,
      responses: { 200: z.any() },
    },
    updateEntrega: {
      method: 'PATCH' as const,
      path: '/api/afs/:id/entrega' as const,
      input: z.object({ dataEntregaReal: z.string() }),
      responses: { 200: z.any() },
    },
    extend: {
      method: 'PATCH' as const,
      path: '/api/afs/:id/extend' as const,
      input: z.object({ dataExtensao: z.string() }),
      responses: { 200: z.any() },
    }
  },
  notasFiscais: {
    list: {
      method: 'GET' as const,
      path: '/api/notas-fiscais' as const,
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/notas-fiscais' as const,
      input: insertNotaFiscalSchema,
      responses: { 201: z.any() },
    },
    paymentStatus: {
      method: 'PATCH' as const,
      path: '/api/notas-fiscais/:id/pagamento' as const,
      input: z.object({ statusPagamento: z.enum(['pendente', 'pago']), dataPagamento: z.string().optional() }),
      responses: { 200: z.any() },
    }
  },
  notificacoes: {
    list: {
      method: 'GET' as const,
      path: '/api/notificacoes' as const,
      responses: { 200: z.array(z.any()) },
    }
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats' as const,
      responses: { 200: z.any() },
    }
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
