import type { Express } from "express";
import type { Server } from "http";
import { z } from "zod";
import { api } from "@shared/routes";
import { comparePasswords, hashPassword, setupAuth } from "./auth";
import { storage } from "./storage";
import { HttpError, ensureDateOrder, parseDateOnly, parseMoney, startOfTodayUtc } from "./validation";
import { sendMail } from "./mail";
import { createResetToken, hashToken } from "./security";
import { registerAtaRegistroPrecoRoutes } from "./routes-arp";

function getErrorStatus(error: unknown): number {
  if (error instanceof HttpError) return error.status;
  if (error instanceof z.ZodError) return 400;
  return 500;
}

function getErrorMessage(error: unknown, fallback = "Erro interno"): string {
  if (error instanceof HttpError) return error.message;
  if (error instanceof z.ZodError) return error.errors[0]?.message ?? "Dados invalidos";
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

type CnpjLookupResult = {
  cnpj: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
};

async function lookupCnpjFromBrasilApi(cnpj: string): Promise<CnpjLookupResult | null> {
  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`BrasilAPI:${response.status}`);
  }

  const payload = await response.json() as {
    cnpj?: string;
    razao_social?: string;
    email?: string | null;
    ddd_telefone_1?: string | null;
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    municipio?: string | null;
    uf?: string | null;
  };

  return {
    cnpj: payload.cnpj ?? cnpj,
    nome: payload.razao_social ?? "",
    email: payload.email ?? null,
    telefone: payload.ddd_telefone_1 ?? null,
    cep: payload.cep ?? null,
    logradouro: payload.logradouro ?? null,
    numero: payload.numero ?? null,
    complemento: payload.complemento ?? null,
    bairro: payload.bairro ?? null,
    municipio: payload.municipio ?? null,
    uf: payload.uf ?? null,
  };
}

async function lookupCnpjFromPublicaCnpjWs(cnpj: string): Promise<CnpjLookupResult | null> {
  const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`CNPJ.ws:${response.status}`);
  }

  const payload = await response.json() as {
    estabelecimento?: {
      cnpj?: string;
      email?: string | null;
      telefone1?: string | null;
      cep?: string | null;
      logradouro?: string | null;
      numero?: string | null;
      complemento?: string | null;
      bairro?: string | null;
      cidade?: { nome?: string | null } | null;
      estado?: { sigla?: string | null } | null;
    } | null;
    razao_social?: string | null;
  };

  return {
    cnpj: payload.estabelecimento?.cnpj ?? cnpj,
    nome: payload.razao_social ?? "",
    email: payload.estabelecimento?.email ?? null,
    telefone: payload.estabelecimento?.telefone1 ?? null,
    cep: payload.estabelecimento?.cep ?? null,
    logradouro: payload.estabelecimento?.logradouro ?? null,
    numero: payload.estabelecimento?.numero ?? null,
    complemento: payload.estabelecimento?.complemento ?? null,
    bairro: payload.estabelecimento?.bairro ?? null,
    municipio: payload.estabelecimento?.cidade?.nome ?? null,
    uf: payload.estabelecimento?.estado?.sigla ?? null,
  };
}

async function lookupCnpj(cnpj: string): Promise<CnpjLookupResult> {
  const providers = [lookupCnpjFromBrasilApi, lookupCnpjFromPublicaCnpjWs];
  let providerError: Error | null = null;

  for (const provider of providers) {
    try {
      const result = await provider(cnpj);
      if (result) {
        return result;
      }
    } catch (error) {
      providerError = error instanceof Error ? error : new Error("Servico de CNPJ indisponivel");
    }
  }

  if (providerError) {
    throw new HttpError(502, "Os servicos publicos de consulta de CNPJ estao indisponiveis no momento. Voce pode preencher os dados manualmente e tentar novamente depois.");
  }

  throw new HttpError(404, "CNPJ nao encontrado");
}

function getEmpenhoMetrics(
  empenho: {
    valorEmpenho: string | number;
    valorAnulado?: string | number | null;
    afs: Array<{ valorAf: string | number }>;
  },
) {
  const valorEmpenho = parseMoney(empenho.valorEmpenho, "Valor do empenho");
  const valorAnulado = parseMoney(empenho.valorAnulado ?? "0", "Valor anulado");
  const totalAfs = empenho.afs.reduce((acc, af) => acc + parseMoney(af.valorAf, "Valor da AF"), 0);
  const saldoDisponivel = valorEmpenho - totalAfs - valorAnulado;
  const valorComprometido = valorEmpenho - valorAnulado;

  return { valorEmpenho, valorAnulado, totalAfs, saldoDisponivel, valorComprometido };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nao autorizado" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nao autorizado" });
    }
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Acesso restrito ao administrador" });
    }
    next();
  };

  const getUserId = (req: any): string | null => req.user?.id ?? null;
  const getUserEnteIds = (req: any): string[] => {
    if (Array.isArray(req.user?.accessibleEnteIds) && req.user.accessibleEnteIds.length > 0) {
      return req.user.accessibleEnteIds;
    }
    return req.user?.enteId ? [req.user.enteId] : [];
  };
  const isAdmin = (req: any): boolean => req.user?.role === "admin";
  const hasEnteAccess = (req: any, enteId: string | null | undefined) => {
    if (isAdmin(req)) return true;
    if (!enteId) return false;
    return getUserEnteIds(req).includes(enteId);
  };
  const audit = async (req: any, action: string, entity: string, entityId?: string | null, details?: string | null) => {
    await storage.createAuditLog({
      userId: getUserId(req),
      action,
      entity,
      entityId,
      details,
    });
  };

  const ensureEnteAccess = (req: any, enteId: string | null | undefined) => {
    if (!hasEnteAccess(req, enteId)) {
      throw new HttpError(403, "Acesso restrito ao ente do usuario");
    }
  };
  const normalizeEnteName = (value: string | null | undefined) =>
    (value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const hasFazendaEnte = async (enteIds: string[]) => {
    if (enteIds.length === 0) return false;
    const allEntes = await storage.getEntes();
    return allEntes
      .filter((ente) => enteIds.includes(ente.id))
      .some((ente) => {
        const nome = normalizeEnteName(ente.nome);
        const sigla = normalizeEnteName(ente.sigla);
        return nome.includes("fazenda") || sigla.includes("fazenda") || sigla === "sefaz";
      });
  };

  const toPublicUser = async (user: any) => {
    const accessibleEnteIds = await storage.getUserEnteIds(user.id);
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      role: user.role === "admin" ? "admin" : "operacional",
      enteId: user.enteId ?? null,
      accessibleEnteIds,
      canAccessAtaModule: Boolean(user.canAccessAtaModule),
      forcePasswordChange: Boolean(user.forcePasswordChange),
      createdAt: user.createdAt ?? null,
    };
  };

  app.get(api.users.list.path, requireAdmin, async (_req, res) => {
    const users = await storage.getUsers();
    res.json(await Promise.all(users.map((user) => toPublicUser(user))));
  });

  app.post(api.users.create.path, requireAdmin, async (req, res) => {
    try {
      const data = api.users.create.input.parse(req.body);
      if (data.role === "operacional" && (!data.enteIds || data.enteIds.length === 0)) {
        throw new HttpError(400, "Usuario operacional deve ser vinculado a um ente");
      }
      if (data.canAccessAtaModule && data.role !== "admin" && !await hasFazendaEnte(data.enteIds ?? [])) {
        throw new HttpError(400, "O acesso ao modulo de atas exige vinculo com a Secretaria de Fazenda");
      }
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        throw new HttpError(400, "Email ja cadastrado");
      }
      const user = await storage.createUser({
        ...data,
        enteId: data.role === "admin" ? null : data.enteIds?.[0] ?? null,
        canAccessAtaModule: Boolean(data.canAccessAtaModule),
        password: await hashPassword(data.password),
        forcePasswordChange: true,
      });
      await storage.setUserEntes(user.id, data.role === "admin" ? [] : data.enteIds ?? []);
      await audit(req, "create", "user", user.id, `Usuario ${user.email} criado com perfil ${user.role}`);
      res.status(201).json(await toPublicUser(user));
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar usuario") });
    }
  });

  app.put(api.users.update.path, requireAdmin, async (req, res) => {
    try {
      const data = api.users.update.input.parse(req.body);
      if (data.role === "operacional" && (!data.enteIds || data.enteIds.length === 0)) {
        throw new HttpError(400, "Usuario operacional deve ser vinculado a um ente");
      }
      if (data.canAccessAtaModule && data.role !== "admin" && !await hasFazendaEnte(data.enteIds ?? [])) {
        throw new HttpError(400, "O acesso ao modulo de atas exige vinculo com a Secretaria de Fazenda");
      }

      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "Usuario nao encontrado" });
      }

      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser && existingUser.id !== targetUser.id) {
        throw new HttpError(400, "Email ja cadastrado");
      }

      const updatedUser = await storage.updateUser(targetUser.id, {
        email: data.email,
        name: data.name,
        role: data.role,
        enteId: data.role === "admin" ? null : data.enteIds?.[0] ?? null,
        canAccessAtaModule: Boolean(data.canAccessAtaModule),
      });

      await storage.setUserEntes(targetUser.id, data.role === "admin" ? [] : data.enteIds ?? []);
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario nao encontrado" });
      }

      await audit(req, "update", "user", updatedUser.id, `Usuario ${updatedUser.email} atualizado`);
      res.json(await toPublicUser(updatedUser));
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao atualizar usuario") });
    }
  });

  app.post(api.users.resetPassword.path, requireAdmin, async (req, res) => {
    try {
      const data = api.users.resetPassword.input.parse(req.body);
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "Usuario nao encontrado" });
      }

      await storage.updateUserPassword(targetUser.id, await hashPassword(data.password), true);
      await audit(req, "admin_reset_password", "user", targetUser.id, `Senha redefinida para ${targetUser.email}`);
      res.json({ message: "Senha redefinida com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao redefinir senha do usuario") });
    }
  });

  app.get(api.auditLogs.list.path, requireAdmin, async (_req, res) => {
    const logs = await storage.getAuditLogs();
    res.json(logs);
  });

  app.get(api.entes.list.path, requireAuth, async (req, res) => {
    const entes = await storage.getEntes();
    if (isAdmin(req)) {
      return res.json(entes);
    }
    return res.json(entes.filter((ente) => getUserEnteIds(req).includes(ente.id)));
  });

  app.post(api.entes.create.path, requireAdmin, async (req, res) => {
    try {
      const data = api.entes.create.input.parse(req.body);
      const ente = await storage.createEnte(data);
      await audit(req, "create", "ente", ente.id, ente.nome);
      res.status(201).json(ente);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar ente") });
    }
  });

  app.put(api.entes.update.path, requireAdmin, async (req, res) => {
    try {
      const data = api.entes.update.input.parse(req.body);
      const ente = await storage.updateEnte(req.params.id, data);
      await audit(req, "update", "ente", ente.id, ente.nome);
      res.json(ente);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao atualizar ente") });
    }
  });

  app.post(api.auth.forgotPassword.path, async (req, res) => {
    try {
      const { email } = api.auth.forgotPassword.input.parse(req.body);
      const user = await storage.getUserByEmail(email);

      if (user) {
        await storage.invalidatePasswordResetTokensForUser(user.id);
        const { token, tokenHash } = createResetToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await storage.createPasswordResetToken(user.id, tokenHash, expiresAt);

        const appUrl = process.env.APP_URL || "http://localhost:5000";
        const resetUrl = `${appUrl}/reset-password?token=${token}`;
        await sendMail({
          to: user.email,
          subject: "Recuperacao de senha - Gestao de Contratos",
          text: `Use este link para redefinir sua senha: ${resetUrl}`,
          html: `<p>Use este link para redefinir sua senha:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        });

        await storage.createAuditLog({
          userId: user.id,
          action: "password_reset_requested",
          entity: "user",
          entityId: user.id,
          details: `Solicitacao de recuperacao para ${user.email}`,
        });
      }

      res.json({ message: "Se o e-mail existir, enviaremos as instrucoes de recuperacao." });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao solicitar recuperacao de senha") });
    }
  });

  app.post(api.auth.resetPassword.path, async (req, res) => {
    try {
      const data = api.auth.resetPassword.input.parse(req.body);
      const token = await storage.getValidPasswordResetToken(hashToken(data.token));
      if (!token) {
        throw new HttpError(400, "Token invalido ou expirado");
      }
      const password = await hashPassword(data.password);
      await storage.updateUserPassword(token.userId, password, false);
      await storage.markPasswordResetTokenUsed(token.id);
      await storage.createAuditLog({
        userId: token.userId,
        action: "password_reset_completed",
        entity: "user",
        entityId: token.userId,
        details: "Senha redefinida via token",
      });
      res.json({ message: "Senha redefinida com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao redefinir senha") });
    }
  });

  app.post(api.auth.changePassword.path, requireAuth, async (req, res) => {
    try {
      const data = api.auth.changePassword.input.parse(req.body);
      const authenticatedUserId = (req.user as { id: string } | undefined)?.id;
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Nao autorizado" });
      }
      const user = await storage.getUser(authenticatedUserId);
      if (!user) {
        return res.status(401).json({ message: "Nao autorizado" });
      }
      const valid = await comparePasswords(data.currentPassword, user.password);
      if (!valid) {
        throw new HttpError(400, "Senha atual incorreta");
      }
      await storage.updateUserPassword(user.id, await hashPassword(data.newPassword), false);
      await audit(req, "change_password", "user", user.id, "Senha alterada pelo proprio usuario");
      res.json({ message: "Senha alterada com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao alterar senha") });
    }
  });

  app.get(api.departamentos.list.path, requireAuth, async (req, res) => {
    const d = await storage.getDepartamentos();
    if (!isAdmin(req)) {
      return res.json(d.filter((item) => hasEnteAccess(req, item.enteId)));
    }
    res.json(d);
  });

  registerAtaRegistroPrecoRoutes(app, {
    requireAuth,
    isAdmin,
    getUserEnteIds,
    ensureEnteAccess,
    audit,
    getErrorStatus,
    getErrorMessage,
  });

  app.post(api.departamentos.create.path, requireAuth, async (req, res) => {
    try {
      const data = api.departamentos.create.input.parse(req.body);
      ensureEnteAccess(req, data.enteId);
      const d = await storage.createDepartamento(data);
      await audit(req, "create", "departamento", d.id, d.nome);
      res.status(201).json(d);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar departamento") });
    }
  });

  app.put(api.departamentos.update.path, requireAuth, async (req, res) => {
    try {
      const data = api.departamentos.update.input.parse(req.body);
      const current = await storage.getDepartamento(req.params.id);
      if (!current) {
        return res.status(404).json({ message: "Departamento nao encontrado" });
      }
      ensureEnteAccess(req, current.enteId);
      if (data.enteId) {
        ensureEnteAccess(req, data.enteId);
      }
      const d = await storage.updateDepartamento(req.params.id, data);
      await audit(req, "update", "departamento", d.id, d.nome);
      res.json(d);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao atualizar departamento") });
    }
  });

  app.delete(api.departamentos.delete.path, requireAuth, async (req, res) => {
    try {
      const current = await storage.getDepartamento(req.params.id);
      if (!current) {
        return res.status(404).json({ message: "Departamento nao encontrado" });
      }
      ensureEnteAccess(req, current.enteId);
      const processos = await storage.getProcessosDigitais();
      const hasProcessos = processos.some((item) => item.departamentoId === current.id);
      if (hasProcessos) {
        throw new HttpError(400, "Nao e possivel excluir departamento com processos vinculados");
      }
      const deleted = await storage.deleteDepartamento(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Departamento nao encontrado" });
      }
      await audit(req, "delete", "departamento", deleted.id, deleted.nome);
      res.json({ message: "Departamento excluido com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao excluir departamento") });
    }
  });

  app.get(api.fornecedores.list.path, requireAuth, async (_req, res) => {
    const fornecedores = await storage.getFornecedores();
    res.json(fornecedores);
  });

  app.post(api.fornecedores.create.path, requireAuth, async (req, res) => {
    try {
      const data = api.fornecedores.create.input.parse(req.body);
      const f = await storage.createFornecedor(data);
      await audit(req, "create", "fornecedor", f.id, f.nome);
      res.status(201).json(f);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar fornecedor") });
    }
  });

  app.put(api.fornecedores.update.path, requireAuth, async (req, res) => {
    try {
      const data = api.fornecedores.update.input.parse(req.body);
      const current = await storage.getFornecedor(req.params.id);
      if (!current) return res.status(404).json({ message: "Fornecedor nao encontrado" });
      if (data.cnpj && normalizeCnpj(data.cnpj) !== normalizeCnpj(current.cnpj)) {
        throw new HttpError(400, "O CNPJ do fornecedor nao pode ser alterado");
      }
      const f = await storage.updateFornecedor(req.params.id, data);
      await audit(req, "update", "fornecedor", f.id, f.nome);
      res.json(f);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao atualizar fornecedor") });
    }
  });

  app.delete(api.fornecedores.delete.path, requireAuth, async (req, res) => {
    try {
      const fornecedor = await storage.getFornecedor(req.params.id);
      if (!fornecedor) {
        return res.status(404).json({ message: "Fornecedor nao encontrado" });
      }

      const [contratosCount, fasesCount] = await Promise.all([
        storage.countContratosByFornecedor(fornecedor.id),
        storage.countFasesByFornecedor(fornecedor.id),
      ]);

      if (contratosCount > 0 || fasesCount > 0) {
        throw new HttpError(400, "Nao e possivel excluir fornecedor vinculado a fase ou contrato");
      }

      const deleted = await storage.deleteFornecedor(fornecedor.id);
      if (!deleted) {
        return res.status(404).json({ message: "Fornecedor nao encontrado" });
      }
      await audit(req, "delete", "fornecedor", deleted.id, deleted.nome);
      res.json({ message: "Fornecedor excluido com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao excluir fornecedor") });
    }
  });

  app.get(api.fornecedores.lookupCnpj.path, requireAuth, async (req, res) => {
    try {
      const cnpj = normalizeCnpj(req.params.cnpj);
      if (cnpj.length !== 14) {
        throw new HttpError(400, "CNPJ invalido");
      }
      const result = await lookupCnpj(cnpj);
      res.json(result);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao consultar CNPJ") });
    }
  });

  app.get(api.fontesRecurso.list.path, requireAuth, async (_req, res) => {
    const fontes = await storage.getFontesRecurso();
    res.json(fontes);
  });

  app.post(api.fontesRecurso.create.path, requireAuth, async (req, res) => {
    try {
      const data = api.fontesRecurso.create.input.parse(req.body);
      const fonte = await storage.createFonteRecurso(data);
      await audit(req, "create", "fonte_recurso", fonte.id, `${fonte.codigo} - ${fonte.nome}`);
      res.status(201).json(fonte);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar fonte de recurso") });
    }
  });

  app.put(api.fontesRecurso.update.path, requireAuth, async (req, res) => {
    try {
      const data = api.fontesRecurso.update.input.parse(req.body);
      const current = await storage.getFonteRecurso(req.params.id);
      if (!current) return res.status(404).json({ message: "Fonte de recurso nao encontrada" });
      const updated = await storage.updateFonteRecurso(req.params.id, data);
      await audit(req, "update", "fonte_recurso", updated?.id, updated ? `${updated.codigo} - ${updated.nome}` : null);
      res.json(updated);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao atualizar fonte de recurso") });
    }
  });

  app.delete(api.fontesRecurso.delete.path, requireAuth, async (req, res) => {
    try {
      const fonte = await storage.getFonteRecurso(req.params.id);
      if (!fonte) return res.status(404).json({ message: "Fonte de recurso nao encontrada" });
      const contratos = await storage.getContratos();
      const hasEmpenhos = contratos.some((contrato) => contrato.empenhos.some((empenho) => empenho.fonteRecursoId === fonte.id));
      if (fonte.fichas.length > 0 || hasEmpenhos) {
        throw new HttpError(400, "Nao e possivel excluir fonte com fichas ou empenhos vinculados");
      }
      const deleted = await storage.deleteFonteRecurso(fonte.id);
      await audit(req, "delete", "fonte_recurso", deleted?.id, deleted ? `${deleted.codigo} - ${deleted.nome}` : null);
      res.json({ message: "Fonte de recurso excluida com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao excluir fonte de recurso") });
    }
  });

  app.post(api.fontesRecurso.createFicha.path, requireAuth, async (req, res) => {
    try {
      const fonte = await storage.getFonteRecurso(req.params.fonteRecursoId);
      if (!fonte) return res.status(404).json({ message: "Fonte de recurso nao encontrada" });
      const data = api.fontesRecurso.createFicha.input.parse(req.body);
      const ficha = await storage.createFicha({ ...data, fonteRecursoId: fonte.id });
      await audit(req, "create", "ficha_orcamentaria", ficha.id, `Fonte ${fonte.codigo} - Ficha ${ficha.codigo}`);
      res.status(201).json(ficha);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar ficha") });
    }
  });

  app.put(api.fontesRecurso.updateFicha.path, requireAuth, async (req, res) => {
    try {
      const current = await storage.getFicha(req.params.id);
      if (!current) return res.status(404).json({ message: "Ficha nao encontrada" });
      const data = api.fontesRecurso.updateFicha.input.parse(req.body);
      const updated = await storage.updateFicha(req.params.id, data);
      await audit(req, "update", "ficha_orcamentaria", updated?.id, updated ? `Ficha ${updated.codigo}` : null);
      res.json(updated);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao atualizar ficha") });
    }
  });

  app.delete(api.fontesRecurso.deleteFicha.path, requireAuth, async (req, res) => {
    try {
      const ficha = await storage.getFicha(req.params.id);
      if (!ficha) return res.status(404).json({ message: "Ficha nao encontrada" });
      const contratos = await storage.getContratos();
      const hasEmpenhos = contratos.some((contrato) => contrato.empenhos.some((empenho) => empenho.fichaId === ficha.id));
      if (hasEmpenhos) {
        throw new HttpError(400, "Nao e possivel excluir ficha com empenhos vinculados");
      }
      const deleted = await storage.deleteFicha(ficha.id);
      await audit(req, "delete", "ficha_orcamentaria", deleted?.id, deleted ? `Ficha ${deleted.codigo}` : null);
      res.json({ message: "Ficha excluida com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao excluir ficha") });
    }
  });

  app.put(api.processos.update.path, requireAuth, async (req, res) => {
    try {
      const data = api.processos.update.input.parse({
        ...req.body,
        departamentoId: req.body.departamentoId || undefined,
      });
      const current = await storage.getProcessoDigital(req.params.id);
      if (!current) {
        return res.status(404).json({ message: "Processo nao encontrado" });
      }
      ensureEnteAccess(req, current.departamento?.enteId);
      if (data.departamentoId) {
        const departamento = await storage.getDepartamento(data.departamentoId);
        if (!departamento) throw new HttpError(404, "Departamento nao encontrado");
        ensureEnteAccess(req, departamento.enteId);
      }
      const p = await storage.updateProcessoDigital(req.params.id, data);
      await audit(req, "update", "processo", p.id, p.numeroProcessoDigital);
      res.json(p);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao atualizar processo") });
    }
  });

  app.get(api.processos.list.path, requireAuth, async (req, res) => {
    const p = await storage.getProcessosDigitais();

  const format = (processos: any[]) =>
    processos.map((proc) => ({
      ...proc,
      fases: proc.fases.map((f: any) => ({
        ...f,
        fornecedorId: f.fornecedor_id, // 🔥 AQUI É A CORREÇÃO
      })),
    }));

  if (!isAdmin(req)) {
    return res.json(p.filter((item) => hasEnteAccess(req, item.departamento?.enteId)));
  }

  res.json(p);
});

 app.get(api.processos.get.path, requireAuth, async (req, res) => {
  const p = await storage.getProcessoDigital(req.params.id);
  if (!p) return res.status(404).json({ message: "Processo nao encontrado" });
  ensureEnteAccess(req, p.departamento?.enteId);

  const formatted = {
    ...p,
    fases: p.fases.map((f: any) => ({
      ...f,
      fornecedorId: f.fornecedor_id,
    })),
  };

  res.json(p);
});

  app.post(api.processos.create.path, requireAuth, async (req, res) => {
    try {
      const data = api.processos.create.input.parse({
        ...req.body,
        departamentoId: req.body.departamentoId || undefined,
      });
      if (data.departamentoId) {
        const departamento = await storage.getDepartamento(data.departamentoId);
        if (!departamento) throw new HttpError(404, "Departamento nao encontrado");
        ensureEnteAccess(req, departamento.enteId);
      }
      const p = await storage.createProcessoDigital(data);
      await audit(req, "create", "processo", p.id, p.numeroProcessoDigital);
      res.status(201).json(p);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar processo") });
    }
  });

  app.delete(api.processos.delete.path, requireAuth, async (req, res) => {
    try {
      const processo = await storage.getProcessoDigital(req.params.id);
      if (!processo) {
        return res.status(404).json({ message: "Processo nao encontrado" });
      }
      ensureEnteAccess(req, processo.departamento?.enteId);
      if (processo.fases.length > 0) {
        throw new HttpError(400, "Nao e possivel excluir processo com fases cadastradas");
      }
      const contratosDoProcesso = (await storage.getContratos()).filter((item) => item.processoDigitalId === processo.id);
      if (contratosDoProcesso.length > 0) {
        throw new HttpError(400, "Nao e possivel excluir processo com contratos vinculados");
      }
      const deleted = await storage.deleteProcessoDigital(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Processo nao encontrado" });
      }
      await audit(req, "delete", "processo", deleted.id, deleted.numeroProcessoDigital);
      res.json({ message: "Processo excluido com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao excluir processo") });
    }
  });

  app.get(api.fases.list.path, requireAuth, async (req, res) => {
    const f = await storage.getFases();
    if (!isAdmin(req)) {
      const processos = await storage.getProcessosDigitais();
      const allowedIds = new Set(
        processos.filter((item) => hasEnteAccess(req, item.departamento?.enteId)).map((item) => item.id),
      );
      return res.json(f.filter((item) => allowedIds.has(item.processoDigitalId)));
    }
    res.json(f);
  });

  app.get(api.fases.get.path, requireAuth, async (req, res) => {
    const f = await storage.getFase(req.params.id);
    if (!f) return res.status(404).json({ message: "Fase nao encontrada" });
    const processo = await storage.getProcessoDigital(f.processoDigitalId);
    ensureEnteAccess(req, processo?.departamento?.enteId);
    res.json(f);
  });

  app.post(api.fases.create.path, requireAuth, async (req, res) => {
    try {
      const parsed = api.fases.create.input.parse(req.body);
      const processo = await storage.getProcessoDigital(parsed.processoDigitalId);
      if (!processo) throw new HttpError(404, "Processo nao encontrado");
      ensureEnteAccess(req, processo.departamento?.enteId);
      const departamentoId = parsed.departamentoId ?? processo.departamentoId ?? null;
      if (departamentoId) {
        const departamento = await storage.getDepartamento(departamentoId);
        if (!departamento) throw new HttpError(404, "Departamento nao encontrado");
        ensureEnteAccess(req, departamento.enteId);
      }
      const data = {
        ...parsed,
        departamentoId: departamentoId ?? undefined,
      };
      parseDateOnly(data.dataInicio, "Data de inicio");
      if (data.dataFim) {
        ensureDateOrder(data.dataInicio, data.dataFim, "data de inicio", "data de fim");
      }
      const f = await storage.createFaseContratacao(data);
      const created = await storage.getFase(f.id);
      await audit(req, "create", "fase", f.id, f.nomeFase);
      res.status(201).json(created);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar fase") });
    }
  });

  app.put(api.fases.update.path, requireAuth, async (req, res) => {
    try {
      const parsed = api.fases.update.input.parse(req.body);
      const current = await storage.getFase(req.params.id);
      if (!current) {
        return res.status(404).json({ message: "Fase nao encontrada" });
      }
      const currentProcesso = await storage.getProcessoDigital(current.processoDigitalId);
      ensureEnteAccess(req, currentProcesso?.departamento?.enteId);
      const nextProcessoId = parsed.processoDigitalId ?? current.processoDigitalId;
      const nextProcesso = await storage.getProcessoDigital(nextProcessoId);
      if (!nextProcesso) {
        throw new HttpError(404, "Processo nao encontrado");
      }
      ensureEnteAccess(req, nextProcesso.departamento?.enteId);
      const departamentoId = parsed.departamentoId ?? current.departamentoId ?? nextProcesso.departamentoId ?? null;
      if (departamentoId) {
        const departamento = await storage.getDepartamento(departamentoId);
        if (!departamento) throw new HttpError(404, "Departamento nao encontrado");
        ensureEnteAccess(req, departamento.enteId);
      }
      const data = {
        ...parsed,
        departamentoId: departamentoId ?? undefined,
      };

      const nextStart = data.dataInicio ?? current.dataInicio;
      const nextEnd = data.dataFim ?? current.dataFim;
      parseDateOnly(nextStart, "Data de inicio");
      if (nextEnd) {
        ensureDateOrder(nextStart, nextEnd, "data de inicio", "data de fim");
      }

      const f = await storage.updateFaseContratacao(req.params.id, data);
      const updated = await storage.getFase(f.id);
      await audit(req, "update", "fase", f.id, f.nomeFase);
      res.json(updated);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao atualizar fase") });
    }
  });

  app.delete(api.fases.delete.path, requireAuth, async (req, res) => {
    try {
      const fase = await storage.getFase(req.params.id);
      if (!fase) {
        return res.status(404).json({ message: "Fase nao encontrada" });
      }
      const processo = await storage.getProcessoDigital(fase.processoDigitalId);
      ensureEnteAccess(req, processo?.departamento?.enteId);
      const contratosDaFase = (await storage.getContratos()).filter((item) => item.faseContratacaoId === fase.id);
      if (contratosDaFase.length > 0) {
        throw new HttpError(400, "Nao e possivel excluir fase vinculada a contrato");
      }
      const deleted = await storage.deleteFaseContratacao(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Fase nao encontrada" });
      }
      await audit(req, "delete", "fase", deleted.id, deleted.nomeFase);
      res.json({ message: "Fase excluida com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao excluir fase") });
    }
  });

  app.get(api.contratos.list.path, requireAuth, async (req, res) => {
    const c = await storage.getContratos();
    if (!isAdmin(req)) {
      return res.json(c.filter((item) => hasEnteAccess(req, item.processoDigital.departamento?.enteId)));
    }
    res.json(c);
  });

  app.get(api.contratos.get.path, requireAuth, async (req, res) => {
    const c = await storage.getContrato(req.params.id);
    if (!c) return res.status(404).json({ message: "Contrato nao encontrado" });
    ensureEnteAccess(req, c.processoDigital.departamento?.enteId);
    res.json(c);
  });

  app.post(api.contratos.create.path, requireAuth, async (req, res) => {
    try {
      const parsedBody = { ...req.body, valorContrato: String(req.body.valorContrato) };
      const parsed = api.contratos.create.input.parse(parsedBody);
      const processo = await storage.getProcessoDigital(parsed.processoDigitalId);
      if (!processo) throw new HttpError(404, "Processo nao encontrado");
      ensureEnteAccess(req, processo.departamento?.enteId);
      ensureDateOrder(parsed.vigenciaInicial, parsed.vigenciaFinal, "vigencia inicial", "vigencia final");
      parseMoney(parsed.valorContrato, "Valor do contrato");

      const fase = await storage.getFase(parsed.faseContratacaoId);
      if (!fase) {
        throw new HttpError(404, "Fase de contratacao nao encontrada");
      }
      if (fase.processoDigitalId !== parsed.processoDigitalId) {
        throw new HttpError(400, "A fase informada nao pertence ao processo selecionado");
      }
      if (fase.fornecedorId !== parsed.fornecedorId) {
        throw new HttpError(400, "O fornecedor do contrato deve ser o mesmo da fase selecionada");
      }
      const departamentoId = parsed.departamentoId ?? fase.departamentoId ?? processo.departamentoId ?? null;
      if (departamentoId) {
        const departamento = await storage.getDepartamento(departamentoId);
        if (!departamento) throw new HttpError(404, "Departamento nao encontrado");
        ensureEnteAccess(req, departamento.enteId);
      }
      if (fase.departamentoId && departamentoId && fase.departamentoId !== departamentoId) {
        throw new HttpError(400, "O departamento do contrato deve ser o mesmo da fase selecionada");
      }
      const data = {
        ...parsed,
        departamentoId: departamentoId ?? undefined,
      };

      const c = await storage.createContrato(data);
      await audit(req, "create", "contrato", c.id, c.numeroContrato);
      res.status(201).json(c);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar contrato") });
    }
  });

  app.put(api.contratos.update.path, requireAuth, async (req, res) => {
    try {
      const parsedBody = {
        ...req.body,
        ...(req.body.valorContrato !== undefined ? { valorContrato: String(req.body.valorContrato) } : {}),
      };
      const data = api.contratos.update.input.parse(parsedBody);
      const current = await storage.getContrato(req.params.id);
      if (!current) {
        return res.status(404).json({ message: "Contrato nao encontrado" });
      }
      ensureEnteAccess(req, current.processoDigital.departamento?.enteId);
      if (current.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao pode ser alterado");
      }

      const nextData = {
        processoDigitalId: data.processoDigitalId ?? current.processoDigitalId,
        faseContratacaoId: data.faseContratacaoId ?? current.faseContratacaoId,
        departamentoId: data.departamentoId ?? current.departamentoId ?? null,
        fornecedorId: data.fornecedorId ?? current.fornecedorId,
        valorContrato: data.valorContrato ?? String(current.valorContrato),
        vigenciaInicial: data.vigenciaInicial ?? current.vigenciaInicial,
        vigenciaFinal: data.vigenciaFinal ?? current.vigenciaFinal,
      };

      ensureDateOrder(nextData.vigenciaInicial, nextData.vigenciaFinal, "vigencia inicial", "vigencia final");
      parseMoney(nextData.valorContrato, "Valor do contrato");

      const fase = await storage.getFase(nextData.faseContratacaoId);
      if (!fase) {
        throw new HttpError(404, "Fase de contratacao nao encontrada");
      }
      if (fase.processoDigitalId !== nextData.processoDigitalId) {
        throw new HttpError(400, "A fase informada nao pertence ao processo selecionado");
      }
      if (fase.fornecedorId !== nextData.fornecedorId) {
        throw new HttpError(400, "O fornecedor do contrato deve ser o mesmo da fase selecionada");
      }
      const processo = await storage.getProcessoDigital(nextData.processoDigitalId);
      if (!processo) {
        throw new HttpError(404, "Processo nao encontrado");
      }
      const departamentoId = nextData.departamentoId ?? fase.departamentoId ?? processo.departamentoId ?? null;
      if (departamentoId) {
        const departamento = await storage.getDepartamento(departamentoId);
        if (!departamento) throw new HttpError(404, "Departamento nao encontrado");
        ensureEnteAccess(req, departamento.enteId);
      }
      if (fase.departamentoId && departamentoId && fase.departamentoId !== departamentoId) {
        throw new HttpError(400, "O departamento do contrato deve ser o mesmo da fase selecionada");
      }

      const updated = await storage.updateContrato(req.params.id, {
        ...data,
        departamentoId: departamentoId ?? undefined,
      });
      if (!updated) {
        return res.status(404).json({ message: "Contrato nao encontrado" });
      }
      await audit(req, "update", "contrato", updated.id, updated.numeroContrato);
      res.json(updated);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao atualizar contrato") });
    }
  });

  app.post(api.contratos.close.path, requireAuth, async (req, res) => {
    try {
      const data = api.contratos.close.input.parse(req.body);
      const contrato = await storage.getContrato(req.params.id);
      if (!contrato) {
        return res.status(404).json({ message: "Contrato nao encontrado" });
      }
      ensureEnteAccess(req, contrato.processoDigital.departamento?.enteId);
      if (contrato.status === "encerrado") {
        throw new HttpError(400, "Contrato ja esta encerrado");
      }

      const allAfs = contrato.empenhos.flatMap((empenho) => empenho.afs);
      const pendingEntrega = allAfs.some((af) => !af.dataEntregaReal);
      if (pendingEntrega) {
        throw new HttpError(400, "Nao e possivel encerrar contrato com AF pendente de entrega");
      }

      const pendingNotas = contrato.notasFiscais.some((nota) => nota.statusPagamento !== "pago");
      if (pendingNotas) {
        throw new HttpError(400, "Nao e possivel encerrar contrato com nota fiscal pendente de pagamento");
      }

      const updated = await storage.closeContrato(req.params.id, data.motivoEncerramento);
      if (!updated) {
        return res.status(404).json({ message: "Contrato nao encontrado" });
      }
      await audit(req, "close", "contrato", updated.id, data.motivoEncerramento ?? "Contrato encerrado");
      res.json(updated);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao encerrar contrato") });
    }
  });

  app.delete(api.contratos.delete.path, requireAuth, async (req, res) => {
    try {
      const contrato = await storage.getContrato(req.params.id);
      if (!contrato) {
        return res.status(404).json({ message: "Contrato nao encontrado" });
      }
      ensureEnteAccess(req, contrato.processoDigital.departamento?.enteId);

      if (contrato.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao pode ser excluido");
      }
      if (contrato.empenhos.length > 0) {
        throw new HttpError(400, "Nao e possivel excluir contrato com empenhos vinculados");
      }
      if (contrato.notasFiscais.length > 0) {
        throw new HttpError(400, "Nao e possivel excluir contrato com notas fiscais vinculadas");
      }

      const deleted = await storage.deleteContrato(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Contrato nao encontrado" });
      }
      await audit(req, "delete", "contrato", deleted.id, deleted.numeroContrato);
      res.json({ message: "Contrato excluido com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao excluir contrato") });
    }
  });

  app.post(api.contratos.createAditivo.path, requireAuth, async (req, res) => {
    try {
      const data = api.contratos.createAditivo.input.parse(req.body);
      const contrato = await storage.getContrato(req.params.id);
      if (!contrato) {
        return res.status(404).json({ message: "Contrato nao encontrado" });
      }
      ensureEnteAccess(req, contrato.processoDigital.departamento?.enteId);
      if (contrato.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao aceita novos aditivos");
      }
      parseDateOnly(data.dataAssinatura, "Data de assinatura");
      if (data.novaVigenciaFinal) {
        ensureDateOrder(contrato.vigenciaFinal, data.novaVigenciaFinal, "vigencia atual", "nova vigencia final");
      }
      if (data.valorAditivo !== null && data.valorAditivo !== undefined) {
        parseMoney(String(data.valorAditivo), "Valor do aditivo");
      }
      const aditivo = await storage.createContratoAditivo(contrato.id, data);
      await audit(req, "create", "contrato_aditivo", aditivo.id, aditivo.numeroAditivo);
      res.status(201).json(aditivo);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar aditivo") });
    }
  });

  app.delete(api.contratos.deleteAditivo.path, requireAuth, async (req, res) => {
    try {
      const aditivo = await storage.getContratoAditivo(req.params.aditivoId);
      if (!aditivo) {
        return res.status(404).json({ message: "Aditivo nao encontrado" });
      }
      const contrato = await storage.getContrato(aditivo.contratoId);
      ensureEnteAccess(req, contrato?.processoDigital.departamento?.enteId);
      if (contrato?.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao permite exclusao de aditivo");
      }
      const deleted = await storage.deleteContratoAditivo(req.params.aditivoId);
      if (!deleted) {
        return res.status(404).json({ message: "Aditivo nao encontrado" });
      }
      await audit(req, "delete", "contrato_aditivo", deleted.id, deleted.numeroAditivo);
      res.json({ message: "Aditivo excluido com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao excluir aditivo") });
    }
  });

  app.post(api.contratos.createAnexo.path, requireAuth, async (req, res) => {
    try {
      const data = api.contratos.createAnexo.input.parse(req.body);
      const contrato = await storage.getContrato(req.params.id);
      if (!contrato) {
        return res.status(404).json({ message: "Contrato nao encontrado" });
      }
      ensureEnteAccess(req, contrato.processoDigital.departamento?.enteId);
      if (contrato.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao aceita novos anexos");
      }
      const anexo = await storage.createContratoAnexo(contrato.id, data);
      await audit(req, "create", "contrato_anexo", anexo.id, anexo.nomeArquivo);
      res.status(201).json(anexo);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar anexo") });
    }
  });

  app.delete(api.contratos.deleteAnexo.path, requireAuth, async (req, res) => {
    try {
      const anexo = await storage.getContratoAnexo(req.params.anexoId);
      if (!anexo) {
        return res.status(404).json({ message: "Anexo nao encontrado" });
      }
      const contrato = await storage.getContrato(anexo.contratoId);
      ensureEnteAccess(req, contrato?.processoDigital.departamento?.enteId);
      if (contrato?.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao permite exclusao de anexo");
      }
      const deleted = await storage.deleteContratoAnexo(req.params.anexoId);
      if (!deleted) {
        return res.status(404).json({ message: "Anexo nao encontrado" });
      }
      await audit(req, "delete", "contrato_anexo", deleted.id, deleted.nomeArquivo);
      res.json({ message: "Anexo excluido com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao excluir anexo") });
    }
  });

  app.post(api.empenhos.create.path, requireAuth, async (req, res) => {
    try {
      const parsedBody = { ...req.body, valorEmpenho: String(req.body.valorEmpenho) };
      const data = api.empenhos.create.input.parse(parsedBody);
      parseDateOnly(data.dataEmpenho, "Data do empenho");

      const contrato = await storage.getContrato(req.params.contratoId);
      if (!contrato) {
        return res.status(404).json({ message: "Contrato nao encontrado" });
      }
      ensureEnteAccess(req, contrato.processoDigital.departamento?.enteId);
      if (contrato.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao aceita novos empenhos");
      }

      const valorContrato = parseMoney(contrato.valorContrato, "Valor do contrato");
      const totalEmpenhado = contrato.empenhos.reduce(
        (acc, empenho) => acc + getEmpenhoMetrics(empenho).valorComprometido,
        0,
      );
      const novoEmpenho = parseMoney(data.valorEmpenho, "Valor do empenho");

      if (totalEmpenhado + novoEmpenho > valorContrato) {
        throw new HttpError(400, "O valor do empenho nao pode ultrapassar o saldo do contrato");
      }

      const fonte = await storage.getFonteRecurso(data.fonteRecursoId);
      if (!fonte) {
        throw new HttpError(404, "Fonte de recurso nao encontrada");
      }
      const ficha = await storage.getFicha(data.fichaId);
      if (!ficha) {
        throw new HttpError(404, "Ficha nao encontrada");
      }
      if (ficha.fonteRecursoId !== fonte.id) {
        throw new HttpError(400, "A ficha informada nao pertence a fonte de recurso selecionada");
      }

      const e = await storage.createEmpenho({
        ...data,
        contratoId: req.params.contratoId,
      });
      await audit(req, "create", "empenho", e.id, `Contrato ${req.params.contratoId}`);
      res.status(201).json(e);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar empenho") });
    }
  });

  app.post(api.empenhos.annul.path, requireAuth, async (req, res) => {
    try {
      const data = api.empenhos.annul.input.parse({
        ...req.body,
        valorAnulado: String(req.body.valorAnulado),
      });
      parseDateOnly(data.dataAnulacao, "Data da anulacao");

      const empenho = await storage.getEmpenho(req.params.id);
      if (!empenho) {
        return res.status(404).json({ message: "Empenho nao encontrado" });
      }

      const contrato = await storage.getContrato(empenho.contratoId);
      ensureEnteAccess(req, contrato?.processoDigital.departamento?.enteId);

      if (empenho.contrato.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao permite anulacao de empenho");
      }

      const valorSolicitado = parseMoney(data.valorAnulado, "Valor da anulacao");
      if (valorSolicitado <= 0) {
        throw new HttpError(400, "O valor da anulacao deve ser maior que zero");
      }

      const { valorEmpenho, valorAnulado, saldoDisponivel } = getEmpenhoMetrics(empenho);
      if (valorSolicitado > saldoDisponivel) {
        throw new HttpError(400, "O valor da anulacao nao pode ultrapassar o saldo disponivel do empenho");
      }

      const novoValorAnulado = valorAnulado + valorSolicitado;
      const novoStatus = novoValorAnulado >= valorEmpenho - empenho.afs.reduce((acc, af) => acc + parseMoney(af.valorAf, "Valor da AF"), 0)
        ? "anulado"
        : "anulado_parcial";

      const updated = await storage.updateEmpenhoAnulacao(empenho.id, {
        status: novoStatus,
        valorAnulado: novoValorAnulado.toFixed(2),
        dataAnulacao: data.dataAnulacao,
        motivoAnulacao: data.motivoAnulacao,
      });

      if (!updated) {
        return res.status(404).json({ message: "Empenho nao encontrado" });
      }

      await audit(
        req,
        "annul",
        "empenho",
        updated.id,
        `Anulacao de ${valorSolicitado.toFixed(2)} em ${data.dataAnulacao}: ${data.motivoAnulacao}`,
      );
      res.json(updated);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao anular empenho") });
    }
  });

  app.delete(api.empenhos.delete.path, requireAuth, async (req, res) => {
    try {
      const empenho = await storage.getEmpenho(req.params.id);
      if (!empenho) {
        return res.status(404).json({ message: "Empenho nao encontrado" });
      }
      const contrato = await storage.getContrato(empenho.contratoId);
      ensureEnteAccess(req, contrato?.processoDigital.departamento?.enteId);

      if (empenho.contrato.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao permite exclusao de empenho");
      }
      if (empenho.afs.length > 0) {
        throw new HttpError(400, "Nao e possivel excluir empenho com AFs vinculadas");
      }
      if (parseMoney(empenho.valorAnulado ?? "0", "Valor anulado") > 0) {
        throw new HttpError(400, "Nao e possivel excluir empenho com anulacao registrada");
      }

      const deleted = await storage.deleteEmpenho(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Empenho nao encontrado" });
      }
      await audit(req, "delete", "empenho", deleted.id, `Contrato ${deleted.contratoId}`);
      res.json({ message: "Empenho excluido com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao excluir empenho") });
    }
  });

  app.get(api.afs.list.path, requireAuth, async (req, res) => {
    const afs = await storage.getAfs();
    if (!isAdmin(req)) {
      return res.json(afs.filter((item) => hasEnteAccess(req, item.empenho.contrato.processoDigital.departamento?.enteId)));
    }
    res.json(afs);
  });

  app.post(api.afs.create.path, requireAuth, async (req, res) => {
    try {
      const parsedBody = { ...req.body, valorAf: String(req.body.valorAf) };
      const data = api.afs.create.input.parse(parsedBody);
      parseDateOnly(data.dataPedidoAf, "Data do pedido");

      const empenho = await storage.getEmpenho(req.params.empenhoId);
      if (!empenho) {
        return res.status(404).json({ message: "Empenho nao encontrado" });
      }
      const contratoPai = await storage.getContrato(empenho.contratoId);
      ensureEnteAccess(req, contratoPai?.processoDigital.departamento?.enteId);
      if (empenho.contrato.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao aceita novas AFs");
      }

      const { saldoDisponivel } = getEmpenhoMetrics(empenho);
      const novaAf = parseMoney(data.valorAf, "Valor da AF");

      if (novaAf > saldoDisponivel) {
        throw new HttpError(400, "O valor da AF nao pode ultrapassar o saldo do empenho");
      }

      const a = await storage.createAf({
        ...data,
        empenhoId: req.params.empenhoId,
      });
      await audit(req, "create", "af", a.id, `Empenho ${req.params.empenhoId}`);
      res.status(201).json(a);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar AF") });
    }
  });

  app.patch(api.afs.notify.path, requireAuth, async (req, res) => {
    try {
      const current = await storage.getAf(req.params.id);
      if (!current) {
        return res.status(404).json({ message: "AF nao encontrada" });
      }
      const empenho = await storage.getEmpenho(current.empenhoId);
      const contrato = empenho ? await storage.getContrato(empenho.contratoId) : undefined;
      ensureEnteAccess(req, contrato?.processoDigital.departamento?.enteId);
      const a = await storage.notifyAf(req.params.id);
      await audit(req, "notify", "af", a.id, "Fornecedor notificado");
      res.json(a);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao atualizar AF") });
    }
  });

  app.patch(api.afs.updateEntrega.path, requireAuth, async (req, res) => {
    try {
      const data = api.afs.updateEntrega.input.parse(req.body);
      parseDateOnly(data.dataEntregaReal, "Data de entrega");
      const current = await storage.getAf(req.params.id);
      if (!current) {
        return res.status(404).json({ message: "AF nao encontrada" });
      }
      const empenho = await storage.getEmpenho(current.empenhoId);
      const contrato = empenho ? await storage.getContrato(empenho.contratoId) : undefined;
      ensureEnteAccess(req, contrato?.processoDigital.departamento?.enteId);
      if (current.dataEntregaReal) {
        throw new HttpError(400, "A entrega desta AF ja foi registrada");
      }
      const a = await storage.updateAfEntrega(req.params.id, data.dataEntregaReal);
      await audit(req, "update_entrega", "af", a.id, `Entrega registrada em ${data.dataEntregaReal}`);
      res.json(a);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao registrar entrega") });
    }
  });

  app.patch(api.afs.extend.path, requireAuth, async (req, res) => {
    try {
      const data = api.afs.extend.input.parse(req.body);
      parseDateOnly(data.dataExtensao, "Data de extensao");
      const current = await storage.getAf(req.params.id);
      if (!current) {
        return res.status(404).json({ message: "AF nao encontrada" });
      }
      const empenho = await storage.getEmpenho(current.empenhoId);
      const contrato = empenho ? await storage.getContrato(empenho.contratoId) : undefined;
      ensureEnteAccess(req, contrato?.processoDigital.departamento?.enteId);
      if (current.dataEntregaReal) {
        throw new HttpError(400, "Nao e possivel prorrogar uma AF ja entregue");
      }
      const dataBase = current.dataExtensao ?? current.dataEstimadaEntrega;
      ensureDateOrder(dataBase, data.dataExtensao, "data atual da AF", "data de extensao");
      const a = await storage.extendAf(req.params.id, data.dataExtensao);
      await audit(req, "extend", "af", a.id, `Prorrogada para ${data.dataExtensao}`);
      res.json(a);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao estender AF") });
    }
  });

  app.delete(api.afs.delete.path, requireAuth, async (req, res) => {
    try {
      const current = await storage.getAf(req.params.id);
      if (!current) {
        return res.status(404).json({ message: "AF nao encontrada" });
      }
      const empenho = await storage.getEmpenho(current.empenhoId);
      const contrato = empenho ? await storage.getContrato(empenho.contratoId) : undefined;
      ensureEnteAccess(req, contrato?.processoDigital.departamento?.enteId);
      if (empenho?.contrato.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao permite exclusao de AF");
      }
      const deleted = await storage.deleteAf(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "AF nao encontrada" });
      }
      await audit(req, "delete", "af", deleted.id, "AF excluida");
      res.json({ message: "AF excluida com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao excluir AF") });
    }
  });

  app.get(api.notasFiscais.list.path, requireAuth, async (req, res) => {
    const notas = await storage.getNotasFiscais();
    if (!isAdmin(req)) {
      return res.json(notas.filter((item) => hasEnteAccess(req, item.contrato.processoDigital.departamento?.enteId)));
    }
    res.json(notas);
  });

  app.post(api.notasFiscais.create.path, requireAuth, async (req, res) => {
    try {
      const parsedBody = { ...req.body, valorNota: String(req.body.valorNota) };
      const data = api.notasFiscais.create.input.parse(parsedBody);
      parseDateOnly(data.dataNota, "Data da nota");
      parseMoney(data.valorNota, "Valor da nota");
      const contrato = await storage.getContrato(data.contratoId);
      if (!contrato) {
        return res.status(404).json({ message: "Contrato nao encontrado" });
      }
      ensureEnteAccess(req, contrato.processoDigital.departamento?.enteId);
      if (contrato.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao aceita novas notas fiscais");
      }
      const n = await storage.createNotaFiscal(data);
      await audit(req, "create", "nota_fiscal", n.id, n.numeroNota);
      res.status(201).json(n);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao criar nota fiscal") });
    }
  });

  app.patch(api.notasFiscais.sendToPayment.path, requireAuth, async (req, res) => {
    try {
      const data = api.notasFiscais.sendToPayment.input.parse(req.body);
      const nota = await storage.getNotaFiscal(req.params.id);
      if (!nota) {
        return res.status(404).json({ message: "Nota fiscal nao encontrada" });
      }
      ensureEnteAccess(req, nota.contrato.processoDigital.departamento?.enteId);
      if (nota.contrato.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao permite alterar a nota fiscal");
      }
      if (nota.statusPagamento !== "nota_recebida") {
        throw new HttpError(400, "Somente notas recebidas podem ser enviadas para pagamento");
      }
      parseDateOnly(data.dataEnvioPagamento, "Data de envio para pagamento");
      const n = await storage.updateNotaFiscalPagamento(req.params.id, {
        statusPagamento: "aguardando_pagamento",
        numeroProcessoPagamento: data.numeroProcessoPagamento,
        dataEnvioPagamento: data.dataEnvioPagamento,
        dataPagamento: null,
      });
      await audit(req, "send_to_payment", "nota_fiscal", n.id, data.numeroProcessoPagamento);
      res.json(n);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao enviar nota para pagamento") });
    }
  });

  app.patch(api.notasFiscais.registerPayment.path, requireAuth, async (req, res) => {
    try {
      const data = api.notasFiscais.registerPayment.input.parse(req.body);
      const nota = await storage.getNotaFiscal(req.params.id);
      if (!nota) {
        return res.status(404).json({ message: "Nota fiscal nao encontrada" });
      }
      ensureEnteAccess(req, nota.contrato.processoDigital.departamento?.enteId);
      if (nota.statusPagamento !== "aguardando_pagamento") {
        throw new HttpError(400, "Somente notas aguardando pagamento podem ser marcadas como pagas");
      }
      parseDateOnly(data.dataPagamento, "Data de pagamento");
      const n = await storage.updateNotaFiscalPagamento(req.params.id, {
        statusPagamento: "pago",
        numeroProcessoPagamento: nota.numeroProcessoPagamento ?? null,
        dataEnvioPagamento: nota.dataEnvioPagamento ?? null,
        dataPagamento: data.dataPagamento,
      });
      await audit(req, "register_payment", "nota_fiscal", n.id, data.dataPagamento);
      res.json(n);
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao registrar pagamento") });
    }
  });

  app.delete(api.notasFiscais.delete.path, requireAuth, async (req, res) => {
    try {
      const nota = await storage.getNotaFiscal(req.params.id);
      if (!nota) {
        return res.status(404).json({ message: "Nota fiscal nao encontrada" });
      }
      ensureEnteAccess(req, nota.contrato.processoDigital.departamento?.enteId);
      if (nota.contrato.status === "encerrado") {
        throw new HttpError(400, "Contrato encerrado nao permite exclusao de nota fiscal");
      }
      if (nota.statusPagamento !== "nota_recebida") {
        throw new HttpError(400, "Nao e possivel excluir nota fiscal que ja entrou no fluxo de pagamento");
      }

      const deleted = await storage.deleteNotaFiscal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Nota fiscal nao encontrada" });
      }
      await audit(req, "delete", "nota_fiscal", deleted.id, deleted.numeroNota);
      res.json({ message: "Nota fiscal excluida com sucesso" });
    } catch (e) {
      res.status(getErrorStatus(e)).json({ message: getErrorMessage(e, "Erro ao excluir nota fiscal") });
    }
  });

  app.get(api.notificacoes.list.path, requireAuth, async (req, res) => {
    let afs = await storage.getAfs();
    if (!isAdmin(req)) {
      afs = afs.filter((item) => hasEnteAccess(req, item.empenho.contrato.processoDigital.departamento?.enteId));
    }
    const today = startOfTodayUtc();

    const notifications = afs
      .filter((af) => {
        if (af.dataEntregaReal) return false;
        const estimada = parseDateOnly(af.dataEstimadaEntrega, "Data estimada");
        const diffTime = estimada.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 10;
      })
      .map((af) => {
        const estimada = parseDateOnly(af.dataEstimadaEntrega, "Data estimada");
        const isLate = today > estimada;
        return {
          id: af.id,
          empenhoId: af.empenhoId,
          af,
          isLate,
          notified: af.flagEntregaNotificada,
          contrato: af.empenho.contrato.numeroContrato,
          fornecedor: af.empenho.contrato.fornecedor.nome,
          objeto: af.empenho.contrato.processoDigital.objetoResumido,
        };
      });

    res.json(notifications);
  });

  app.get(api.dashboard.stats.path, requireAuth, async (req, res) => {
    let [contratos, procs, forns] = await Promise.all([
      storage.getContratos(),
      storage.getProcessosDigitais(),
      storage.getFornecedores(),
    ]);

    if (!isAdmin(req)) {
      contratos = contratos.filter((item) => hasEnteAccess(req, item.processoDigital.departamento?.enteId));
      procs = procs.filter((item) => hasEnteAccess(req, item.departamento?.enteId));
    }

    const totalContratos = contratos.length;
    let valorTotal = 0;
    let saldoTotal = 0;

    for (const c of contratos) {
      const vc = parseMoney(c.valorContrato, "Valor do contrato");
      valorTotal += vc;

      const empenhado = c.empenhos.reduce(
        (acc, emp) => acc + getEmpenhoMetrics(emp).valorComprometido,
        0,
      );
      saldoTotal += vc - empenhado;
    }

    res.json({
      totalContratos,
      totalProcessos: procs.length,
      totalFornecedores: forns.length,
      valorTotal,
      saldoTotal,
    });
  });

  return httpServer;
}
