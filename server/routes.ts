import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";
import { parse } from "date-fns";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  app.get(api.fornecedores.list.path, requireAuth, async (req, res) => {
    const fornecedores = await storage.getFornecedores();
    res.json(fornecedores);
  });

  app.post(api.fornecedores.create.path, requireAuth, async (req, res) => {
    try {
      const data = api.fornecedores.create.input.parse(req.body);
      const f = await storage.createFornecedor(data);
      res.status(201).json(f);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/fornecedores/:id", requireAuth, async (req, res) => {
    try {
      const data = api.fornecedores.update.input.parse(req.body);
      const f = await storage.updateFornecedor(req.params.id, data);
      if (!f) return res.status(404).json({ message: "Not found" });
      res.json(f);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.get(api.processos.list.path, requireAuth, async (req, res) => {
    const p = await storage.getProcessosDigitais();
    res.json(p);
  });

  app.get(api.processos.get.path, requireAuth, async (req, res) => {
    const p = await storage.getProcessoDigital(req.params.id);
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json(p);
  });

  app.post(api.processos.create.path, requireAuth, async (req, res) => {
    try {
      const data = api.processos.create.input.parse(req.body);
      const p = await storage.createProcessoDigital(data);
      res.status(201).json(p);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.get(api.fases.list.path, requireAuth, async (req, res) => {
    const f = await storage.getFases();
    res.json(f);
  });

  app.get(api.fases.get.path, requireAuth, async (req, res) => {
    const f = await storage.getFase(req.params.id);
    if (!f) return res.status(404).json({ message: "Not found" });
    res.json(f);
  });

  app.post(api.fases.create.path, requireAuth, async (req, res) => {
    try {
      const data = api.fases.create.input.parse(req.body);
      const f = await storage.createFaseContratacao(data);
      res.status(201).json(f);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.put(api.fases.update.path, requireAuth, async (req, res) => {
    try {
      const data = api.fases.update.input.parse(req.body);
      const f = await storage.updateFaseContratacao(req.params.id, data);
      res.json(f);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.get(api.contratos.list.path, requireAuth, async (req, res) => {
    const c = await storage.getContratos();
    res.json(c);
  });

  app.get(api.contratos.get.path, requireAuth, async (req, res) => {
    const c = await storage.getContrato(req.params.id);
    if (!c) return res.status(404).json({ message: "Not found" });
    res.json(c);
  });

  app.post(api.contratos.create.path, requireAuth, async (req, res) => {
    try {
      // Coerce valorContrato to string because decimal needs string for insertion but it might come as number
      const parsedBody = { ...req.body, valorContrato: String(req.body.valorContrato) };
      const data = api.contratos.create.input.parse(parsedBody);
      const c = await storage.createContrato(data);
      res.status(201).json(c);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.post("/api/contratos/:contratoId/empenhos", requireAuth, async (req, res) => {
    try {
      const parsedBody = { ...req.body, valorEmpenho: String(req.body.valorEmpenho) };
      const data = api.empenhos.create.input.parse(parsedBody);
      const e = await storage.createEmpenho({
        ...data,
        contratoId: req.params.contratoId
      });
      res.status(201).json(e);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.post("/api/empenhos/:empenhoId/afs", requireAuth, async (req, res) => {
    try {
      const parsedBody = { ...req.body, valorAf: String(req.body.valorAf) };
      const data = api.afs.create.input.parse(parsedBody);
      const a = await storage.createAf({
        ...data,
        empenhoId: req.params.empenhoId
      });
      res.status(201).json(a);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.patch("/api/afs/:id/notify", requireAuth, async (req, res) => {
    try {
      const a = await storage.notifyAf(req.params.id);
      res.json(a);
    } catch (e) {
      res.status(400).json({ message: "Error updating AF" });
    }
  });

  app.patch("/api/afs/:id/entrega", requireAuth, async (req, res) => {
    try {
      const data = api.afs.updateEntrega.input.parse(req.body);
      const a = await storage.updateAfEntrega(req.params.id, data.dataEntregaReal);
      res.json(a);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.get(api.notificacoes.list.path, requireAuth, async (req, res) => {
    const afs = await storage.getAfs();
    const today = new Date();
    
    const notifications = afs.filter(af => {
      if (af.dataEntregaReal) return false;
      const estimada = new Date(af.dataEstimadaEntrega);
      const diffTime = estimada.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // se passou da data OU falta <= 10 dias
      return diffDays <= 10;
    }).map(af => {
      const estimada = new Date(af.dataEstimadaEntrega);
      const isLate = today > estimada;
      return {
        id: af.id,
        empenhoId: af.empenhoId,
        af: af,
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
    const [contratos, procs, forns] = await Promise.all([
      storage.getContratos(),
      storage.getProcessosDigitais(),
      storage.getFornecedores()
    ]);

    const totalContratos = contratos.length;
    let valorTotal = 0;
    let saldoTotal = 0;

    for (const c of contratos) {
      const vc = parseFloat(c.valorContrato.toString());
      valorTotal += vc;
      
      const empenhado = c.empenhos.reduce((acc, emp) => acc + parseFloat(emp.valorEmpenho.toString()), 0);
      saldoTotal += (vc - empenhado);
    }

    res.json({
      totalContratos,
      totalProcessos: procs.length,
      totalFornecedores: forns.length,
      valorTotal,
      saldoTotal
    });
  });

  return httpServer;
}
