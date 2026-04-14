import type { Express } from "express";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "./db";
import { api } from "@shared/routes";
import {
  ataItens,
  ataItemCotacoes,
  ataItemQuantidades,
  ataItemResultados,
  ataContratos,
  ataEmpenhos,
  ataAfs,
  ataNotasFiscais,
  ataFornecedores,
  ataPrePedidos,
  ataParticipantes,
  atasRegistroPreco,
  entes,
  fichasOrcamentarias,
  type AtaRegistroPrecoWithRelations,
  type AtaContratoWithRelations,
  type AtaEmpenhoWithRelations,
  type AtaPrePedidoDisponivel,
  type AtaPrePedidoWithRelations,
} from "@shared/schema";
import { HttpError, ensureDateOrder, parseMoney } from "./validation";

type RouteHelpers = {
  requireAuth: (req: any, res: any, next: any) => void;
  isAdmin: (req: any) => boolean;
  getUserEnteIds: (req: any) => string[];
  ensureEnteAccess: (req: any, enteId: string | null | undefined) => void;
  audit: (req: any, action: string, entity: string, entityId?: string | null, details?: string | null) => Promise<void>;
  getErrorStatus: (error: unknown) => number;
  getErrorMessage: (error: unknown, fallback?: string) => string;
};

async function getAtaWithRelations(id: string): Promise<AtaRegistroPrecoWithRelations | undefined> {
  return db.query.atasRegistroPreco.findFirst({
    where: eq(atasRegistroPreco.id, id),
    with: {
      processoDigital: {
        with: {
          departamento: {
            with: { ente: true },
          },
        },
      },
      participantes: {
        with: { ente: true },
      },
      fornecedores: {
        with: { fornecedor: true },
      },
      itens: {
        with: {
          quantidades: {
            with: { ente: true },
          },
          cotacao: true,
          resultado: { with: { fornecedor: true } },
        },
      },
    },
  }) as unknown as Promise<AtaRegistroPrecoWithRelations | undefined>;
}

async function getPrePedidoWithRelations(id: string): Promise<AtaPrePedidoWithRelations | undefined> {
  return db.query.ataPrePedidos.findFirst({
    where: eq(ataPrePedidos.id, id),
    with: {
      ata: {
        with: {
          processoDigital: {
            with: {
              departamento: {
                with: { ente: true },
              },
            },
          },
          participantes: { with: { ente: true } },
          fornecedores: { with: { fornecedor: true } },
          itens: {
            with: {
              quantidades: { with: { ente: true } },
              cotacao: true,
              resultado: { with: { fornecedor: true } },
            },
          },
        },
      },
      ataContrato: true,
      item: {
        with: {
          quantidades: { with: { ente: true } },
          cotacao: true,
          resultado: { with: { fornecedor: true } },
        },
      },
      ente: true,
      fonteRecurso: true,
      ficha: true,
      empenhos: {
        with: {
          notasFiscais: true,
          afs: {
            with: {
              notasFiscais: true,
            },
          },
        },
      },
    },
  }) as unknown as Promise<AtaPrePedidoWithRelations | undefined>;
}

async function getAtaContratoWithRelations(id: string): Promise<AtaContratoWithRelations | undefined> {
  return db.query.ataContratos.findFirst({
    where: eq(ataContratos.id, id),
    with: {
      ata: {
        with: {
          processoDigital: {
            with: {
              departamento: {
                with: { ente: true },
              },
            },
          },
          participantes: { with: { ente: true } },
          fornecedores: { with: { fornecedor: true } },
          itens: {
            with: {
              quantidades: { with: { ente: true } },
              cotacao: true,
              resultado: { with: { fornecedor: true } },
            },
          },
        },
      },
      fornecedor: true,
      prePedidos: {
        with: {
          ata: {
            with: {
              processoDigital: {
                with: {
                  departamento: {
                    with: { ente: true },
                  },
                },
              },
              participantes: { with: { ente: true } },
              fornecedores: { with: { fornecedor: true } },
              itens: {
                with: {
                  quantidades: { with: { ente: true } },
                  cotacao: true,
                  resultado: { with: { fornecedor: true } },
                },
              },
            },
          },
          item: {
            with: {
              quantidades: { with: { ente: true } },
              cotacao: true,
              resultado: { with: { fornecedor: true } },
            },
          },
          ente: true,
          fonteRecurso: true,
          ficha: true,
          ataContrato: true,
        },
      },
      empenhos: {
        with: {
          notasFiscais: true,
          prePedido: {
            with: {
              ata: {
                with: {
                  processoDigital: {
                    with: {
                      departamento: {
                        with: { ente: true },
                      },
                    },
                  },
                  participantes: { with: { ente: true } },
                  fornecedores: { with: { fornecedor: true } },
                  itens: {
                    with: {
                      quantidades: { with: { ente: true } },
                      cotacao: true,
                      resultado: { with: { fornecedor: true } },
                    },
                  },
                },
              },
              item: {
                with: {
                  quantidades: { with: { ente: true } },
                  cotacao: true,
                  resultado: { with: { fornecedor: true } },
                },
              },
              ente: true,
              fonteRecurso: true,
              ficha: true,
              ataContrato: true,
            },
          },
          afs: {
            with: {
              notasFiscais: true,
            },
          },
        },
      },
    },
  }) as any;
}

async function getAtaEmpenhoWithRelations(id: string): Promise<AtaEmpenhoWithRelations | undefined> {
  return db.query.ataEmpenhos.findFirst({
    where: eq(ataEmpenhos.id, id),
    with: {
      prePedido: {
        with: {
          ata: {
            with: {
              processoDigital: {
                with: {
                  departamento: {
                    with: { ente: true },
                  },
                },
              },
              participantes: { with: { ente: true } },
              fornecedores: { with: { fornecedor: true } },
              itens: {
                with: {
                  quantidades: { with: { ente: true } },
                  cotacao: true,
                  resultado: { with: { fornecedor: true } },
                },
              },
            },
          },
          item: {
            with: {
              quantidades: { with: { ente: true } },
              cotacao: true,
              resultado: { with: { fornecedor: true } },
            },
          },
          ente: true,
          fonteRecurso: true,
          ficha: true,
          ataContrato: true,
        },
      },
      afs: {
        with: {
          notasFiscais: true,
        },
      },
      notasFiscais: true,
    },
  }) as unknown as Promise<AtaEmpenhoWithRelations | undefined>;
}

async function getPrePedidoEmpenhado(prePedidoId: string) {
  const empenhos = await db.query.ataEmpenhos.findMany({
    where: eq(ataEmpenhos.ataPrePedidoId, prePedidoId),
  }) as unknown as any[];
  return empenhos.reduce((sum: number, empenho: any) => sum + parseMoney(empenho.quantidadeEmpenhada, "Quantidade empenhada"), 0);
}

async function getEmpenhoAfQuantidade(ataEmpenhoId: string) {
  const afs = await db.query.ataAfs.findMany({
    where: eq(ataAfs.ataEmpenhoId, ataEmpenhoId),
  }) as unknown as any[];
  return afs.reduce((sum: number, af: any) => sum + parseMoney(af.quantidadeAf, "Quantidade da AF"), 0);
}

async function getEmpenhoQuantidadeFaturadaDireta(ataEmpenhoId: string) {
  const notas = await db.query.ataNotasFiscais.findMany({
    where: and(eq(ataNotasFiscais.ataEmpenhoId, ataEmpenhoId), isNull(ataNotasFiscais.ataAfId)),
  }) as unknown as any[];
  return notas.reduce((sum: number, nota: any) => sum + parseMoney(nota.quantidadeNota, "Quantidade da nota"), 0);
}

async function getAfQuantidadeFaturada(ataAfId: string) {
  const notas = await db.query.ataNotasFiscais.findMany({
    where: eq(ataNotasFiscais.ataAfId, ataAfId),
  }) as unknown as any[];
  return notas.reduce((sum: number, nota: any) => sum + parseMoney(nota.quantidadeNota, "Quantidade da nota"), 0);
}

function normalizeEnteName(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isFazendaEnte(ente: { nome: string; sigla: string }) {
  const nome = normalizeEnteName(ente.nome);
  const sigla = normalizeEnteName(ente.sigla);
  return nome.includes("fazenda") || sigla.includes("fazenda") || sigla === "sefaz";
}

async function userCanManageAtas(req: any, helpers: RouteHelpers) {
  if (helpers.isAdmin(req)) return true;
  if (!req.user?.canAccessAtaModule) return false;
  const accessibleEnteIds = helpers.getUserEnteIds(req);
  if (accessibleEnteIds.length === 0) return false;
  const allowedEntes = await db.select().from(entes).where(inArray(entes.id, accessibleEnteIds));
  return allowedEntes.some(isFazendaEnte);
}

async function userCanViewAllPrePedidos(req: any, helpers: RouteHelpers) {
  return userCanManageAtas(req, helpers);
}

function hasAtaAccess(req: any, ata: AtaRegistroPrecoWithRelations, helpers: RouteHelpers) {
  if (helpers.isAdmin(req)) return true;
  const accessibleEnteIds = helpers.getUserEnteIds(req);
  return ata.participantes.some((participante) => accessibleEnteIds.includes(participante.enteId));
}

function hasParticipantAccess(req: any, enteId: string, helpers: RouteHelpers) {
  if (helpers.isAdmin(req)) return true;
  return helpers.getUserEnteIds(req).includes(enteId);
}

async function listAtasDisponiveisParaPrePedido(req: any, helpers: RouteHelpers): Promise<AtaPrePedidoDisponivel[]> {
  const atas = await db.query.atasRegistroPreco.findMany({
    with: {
      processoDigital: {
        with: {
          departamento: {
            with: { ente: true },
          },
        },
      },
      participantes: { with: { ente: true } },
      itens: {
        with: {
          quantidades: { with: { ente: true } },
          cotacao: true,
          resultado: { with: { fornecedor: true } },
        },
      },
      prePedidos: true,
    },
  }) as unknown as AtaRegistroPrecoWithRelations[];

  const accessibleEnteIds = helpers.isAdmin(req) ? null : helpers.getUserEnteIds(req);
  const filteredAtas = atas.filter((ata) =>
    ["licitada", "vigente"].includes(ata.status) &&
    ata.participantes.some((participante) => accessibleEnteIds === null || accessibleEnteIds.includes(participante.enteId)),
  );

  return filteredAtas.flatMap((ata) =>
    ata.participantes
      .filter((participante) => accessibleEnteIds === null || accessibleEnteIds.includes(participante.enteId))
      .map((participante) => ({
        id: ata.id,
        processoDigitalId: ata.processoDigitalId,
        numeroAta: ata.numeroAta,
        objeto: ata.objeto,
        vigenciaInicial: ata.vigenciaInicial,
        vigenciaFinal: ata.vigenciaFinal,
        status: ata.status,
        criadoEm: ata.criadoEm,
        atualizadoEm: ata.atualizadoEm,
        processoDigital: ata.processoDigital,
        ente: participante.ente,
        itens: ata.itens
          .map((item) => {
            const quantidadeParticipante = item.quantidades
              .filter((quantidade) => quantidade.enteId === participante.enteId)
              .reduce((sum, quantidade) => sum + parseMoney(quantidade.quantidade, "Quantidade participante"), 0);
            const quantidadePrePedida = (ata.prePedidos || [])
              .filter((prePedido: any) => prePedido.itemId === item.id && prePedido.enteId === participante.enteId)
              .reduce((sum: number, prePedido: any) => sum + parseMoney(prePedido.quantidadeSolicitada, "Quantidade pre-pedida"), 0);
            return {
              ...item,
              quantidadeParticipante,
              quantidadePrePedida,
              quantidadeDisponivel: Math.max(quantidadeParticipante - quantidadePrePedida, 0),
            };
          })
          .filter((item) => !item.resultado?.itemFracassado && item.quantidadeParticipante > 0),
      })),
  );
}

async function setAtaParticipantes(ataId: string, enteIds: string[]) {
  await db.delete(ataParticipantes).where(eq(ataParticipantes.ataId, ataId));
  if (enteIds.length > 0) {
    await db.insert(ataParticipantes).values(enteIds.map((enteId) => ({ ataId, enteId })));
  }
}

async function setAtaFornecedores(ataId: string, fornecedorIds: string[]) {
  await db.delete(ataFornecedores).where(eq(ataFornecedores.ataId, ataId));
  if (fornecedorIds.length > 0) {
    await db.insert(ataFornecedores).values(fornecedorIds.map((fornecedorId) => ({ ataId, fornecedorId })));
  }
}

async function deleteAtaItemChildren(itemIds: string[]) {
  if (itemIds.length === 0) return;
  await db.delete(ataItemQuantidades).where(inArray(ataItemQuantidades.itemId, itemIds));
  await db.delete(ataItemCotacoes).where(inArray(ataItemCotacoes.itemId, itemIds));
  await db.delete(ataItemResultados).where(inArray(ataItemResultados.itemId, itemIds));
}

export function registerAtaRegistroPrecoRoutes(app: Express, helpers: RouteHelpers) {
  const requireAtaModuleAccess = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated?.()) {
      return res.status(401).json({ message: "Nao autorizado" });
    }
    if (!await userCanManageAtas(req, helpers)) {
      return res.status(403).json({ message: "Modulo restrito a Secretaria de Fazenda" });
    }
    next();
  };

  app.get(api.atasRegistroPreco.list.path, helpers.requireAuth, requireAtaModuleAccess, async (req, res) => {
    const atas = await db.query.atasRegistroPreco.findMany({
      with: {
        processoDigital: {
          with: {
            departamento: {
              with: { ente: true },
            },
          },
        },
        participantes: { with: { ente: true } },
        fornecedores: { with: { fornecedor: true } },
        itens: {
          with: {
            quantidades: { with: { ente: true } },
            cotacao: true,
            resultado: { with: { fornecedor: true } },
          },
        },
      },
    }) as unknown as AtaRegistroPrecoWithRelations[];

    if (helpers.isAdmin(req)) {
      return res.json(atas);
    }

    const accessibleEnteIds = helpers.getUserEnteIds(req);
    res.json(atas.filter((ata) => ata.participantes.some((participante) => accessibleEnteIds.includes(participante.enteId))));
  });

  app.get(api.atasRegistroPreco.get.path, helpers.requireAuth, requireAtaModuleAccess, async (req, res) => {
    const ata = await getAtaWithRelations(req.params.id);
    if (!ata) {
      return res.status(404).json({ message: "Ata nao encontrada" });
    }
    if (!hasAtaAccess(req, ata, helpers)) {
      return res.status(403).json({ message: "Acesso restrito aos participantes da ata" });
    }
    res.json(ata);
  });

  app.post(api.atasRegistroPreco.create.path, helpers.requireAuth, requireAtaModuleAccess, async (req, res) => {
    try {
      const data = api.atasRegistroPreco.create.input.parse(req.body);
      ensureDateOrder(data.vigenciaInicial, data.vigenciaFinal, "Vigencia inicial", "Vigencia final");
      data.participanteEnteIds.forEach((enteId) => helpers.ensureEnteAccess(req, enteId));

      const [ata] = await db.insert(atasRegistroPreco).values({
        numeroAta: data.numeroAta,
        processoDigitalId: data.processoDigitalId,
        objeto: data.objeto,
        vigenciaInicial: data.vigenciaInicial,
        vigenciaFinal: data.vigenciaFinal,
        status: data.status,
      }).returning();

      await setAtaParticipantes(ata.id, data.participanteEnteIds);
      await setAtaFornecedores(ata.id, Array.from(new Set(data.fornecedorIds)));
      await helpers.audit(req, "create", "ata_registro_preco", ata.id, `Ata ${ata.numeroAta} criada`);
      res.status(201).json(ata);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao criar ata") });
    }
  });

  app.put(api.atasRegistroPreco.update.path, helpers.requireAuth, requireAtaModuleAccess, async (req, res) => {
    try {
      const data = api.atasRegistroPreco.update.input.parse(req.body);
      ensureDateOrder(data.vigenciaInicial, data.vigenciaFinal, "Vigencia inicial", "Vigencia final");
      data.participanteEnteIds.forEach((enteId) => helpers.ensureEnteAccess(req, enteId));

      const currentAta = await getAtaWithRelations(req.params.id);
      if (!currentAta) {
        return res.status(404).json({ message: "Ata nao encontrada" });
      }
      if (!hasAtaAccess(req, currentAta, helpers)) {
        throw new HttpError(403, "Acesso restrito aos participantes da ata");
      }

      const [ata] = await db.update(atasRegistroPreco).set({
        numeroAta: data.numeroAta,
        processoDigitalId: data.processoDigitalId,
        objeto: data.objeto,
        vigenciaInicial: data.vigenciaInicial,
        vigenciaFinal: data.vigenciaFinal,
        status: data.status,
        atualizadoEm: new Date(),
      }).where(eq(atasRegistroPreco.id, currentAta.id)).returning();

      await setAtaParticipantes(ata.id, data.participanteEnteIds);
      await setAtaFornecedores(ata.id, Array.from(new Set(data.fornecedorIds)));
      await helpers.audit(req, "update", "ata_registro_preco", ata.id, `Ata ${ata.numeroAta} atualizada`);
      res.json(ata);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao atualizar ata") });
    }
  });

  app.delete(api.atasRegistroPreco.delete.path, helpers.requireAuth, requireAtaModuleAccess, async (req, res) => {
    try {
      const ata = await getAtaWithRelations(req.params.id);
      if (!ata) {
        return res.status(404).json({ message: "Ata nao encontrada" });
      }
      if (!hasAtaAccess(req, ata, helpers)) {
        throw new HttpError(403, "Acesso restrito aos participantes da ata");
      }

      const itemIds = ata.itens.map((item) => item.id);
      await deleteAtaItemChildren(itemIds);
      if (itemIds.length > 0) {
        await db.delete(ataItens).where(inArray(ataItens.id, itemIds));
      }
      await db.delete(ataFornecedores).where(eq(ataFornecedores.ataId, ata.id));
      await db.delete(ataParticipantes).where(eq(ataParticipantes.ataId, ata.id));
      await db.delete(atasRegistroPreco).where(eq(atasRegistroPreco.id, ata.id));

      await helpers.audit(req, "delete", "ata_registro_preco", ata.id, `Ata ${ata.numeroAta} excluida`);
      res.json({ message: "Ata excluida com sucesso" });
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao excluir ata") });
    }
  });

  app.post(api.atasRegistroPreco.createItem.path, helpers.requireAuth, requireAtaModuleAccess, async (req, res) => {
    try {
      const data = api.atasRegistroPreco.createItem.input.parse(req.body);
      const ata = await getAtaWithRelations(req.params.id);
      if (!ata) {
        return res.status(404).json({ message: "Ata nao encontrada" });
      }
      if (!hasAtaAccess(req, ata, helpers)) {
        throw new HttpError(403, "Acesso restrito aos participantes da ata");
      }

      const [item] = await db.insert(ataItens).values({ ...data, ataId: ata.id }).returning();
      const enriched = await db.query.ataItens.findFirst({
        where: eq(ataItens.id, item.id),
        with: { quantidades: { with: { ente: true } }, cotacao: true, resultado: { with: { fornecedor: true } } },
      });
      await helpers.audit(req, "create", "ata_item", item.id, `Item ${item.codigoInterno} criado na ata ${ata.numeroAta}`);
      res.status(201).json(enriched);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao criar item da ata") });
    }
  });

  app.post(api.atasRegistroPreco.importItems.path, helpers.requireAuth, requireAtaModuleAccess, async (req, res) => {
    try {
      const { items } = api.atasRegistroPreco.importItems.input.parse(req.body);
      const ata = await getAtaWithRelations(req.params.id);
      if (!ata) {
        return res.status(404).json({ message: "Ata nao encontrada" });
      }
      if (!hasAtaAccess(req, ata, helpers)) {
        throw new HttpError(403, "Acesso restrito aos participantes da ata");
      }

      const existingItems = await db.query.ataItens.findMany({ where: eq(ataItens.ataId, ata.id) });
      const existingByCode = new Map(existingItems.map((item) => [item.codigoInterno.trim().toLowerCase(), item]));

      for (const item of items) {
        const key = item.codigoInterno.trim().toLowerCase();
        const current = existingByCode.get(key);
        if (current) {
          await db.update(ataItens).set({
            descricao: item.descricao,
            unidadeMedida: item.unidadeMedida,
            atualizadoEm: new Date(),
          }).where(eq(ataItens.id, current.id));
        } else {
          await db.insert(ataItens).values({ ...item, ataId: ata.id });
        }
      }

      const refreshedAta = await getAtaWithRelations(ata.id);
      await helpers.audit(req, "import", "ata_item", ata.id, `${items.length} item(ns) importados na ata ${ata.numeroAta}`);
      res.json(refreshedAta?.itens ?? []);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao importar itens da ata") });
    }
  });

  app.put(api.atasRegistroPreco.updateItem.path, helpers.requireAuth, requireAtaModuleAccess, async (req, res) => {
    try {
      const data = api.atasRegistroPreco.updateItem.input.parse(req.body);
      const item = await db.query.ataItens.findFirst({
        where: eq(ataItens.id, req.params.itemId),
        with: { ata: { with: { participantes: { with: { ente: true } } } } },
      });
      if (!item) {
        return res.status(404).json({ message: "Item nao encontrado" });
      }
      if (!helpers.isAdmin(req)) {
        const accessible = helpers.getUserEnteIds(req);
        if (!item.ata.participantes.some((participante) => accessible.includes(participante.enteId))) {
          throw new HttpError(403, "Acesso restrito aos participantes da ata");
        }
      }

      const [updated] = await db.update(ataItens).set({ ...data, atualizadoEm: new Date() }).where(eq(ataItens.id, item.id)).returning();
      const enriched = await db.query.ataItens.findFirst({
        where: eq(ataItens.id, updated.id),
        with: { quantidades: { with: { ente: true } }, cotacao: true, resultado: { with: { fornecedor: true } } },
      });
      await helpers.audit(req, "update", "ata_item", updated.id, `Item ${updated.codigoInterno} atualizado`);
      res.json(enriched);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao atualizar item da ata") });
    }
  });

  app.delete(api.atasRegistroPreco.deleteItem.path, helpers.requireAuth, requireAtaModuleAccess, async (req, res) => {
    try {
      const item = await db.query.ataItens.findFirst({
        where: eq(ataItens.id, req.params.itemId),
        with: { ata: { with: { participantes: { with: { ente: true } } } } },
      });
      if (!item) {
        return res.status(404).json({ message: "Item nao encontrado" });
      }
      if (!helpers.isAdmin(req)) {
        const accessible = helpers.getUserEnteIds(req);
        if (!item.ata.participantes.some((participante) => accessible.includes(participante.enteId))) {
          throw new HttpError(403, "Acesso restrito aos participantes da ata");
        }
      }

      await deleteAtaItemChildren([item.id]);
      await db.delete(ataItens).where(eq(ataItens.id, item.id));
      await helpers.audit(req, "delete", "ata_item", item.id, `Item ${item.codigoInterno} excluido`);
      res.json({ message: "Item excluido com sucesso" });
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao excluir item da ata") });
    }
  });

  app.put(api.atasRegistroPreco.saveQuantidades.path, helpers.requireAuth, requireAtaModuleAccess, async (req, res) => {
    try {
      const { quantidades } = api.atasRegistroPreco.saveQuantidades.input.parse(req.body);
      const ata = await getAtaWithRelations(req.params.id);
      if (!ata) {
        return res.status(404).json({ message: "Ata nao encontrada" });
      }
      if (!hasAtaAccess(req, ata, helpers)) {
        throw new HttpError(403, "Acesso restrito aos participantes da ata");
      }

      const itemIds = new Set(ata.itens.map((item) => item.id));
      const participantIds = new Set(ata.participantes.map((participante) => participante.enteId));
      for (const entry of quantidades) {
        if (!itemIds.has(entry.itemId)) {
          throw new HttpError(400, "Quantidade vinculada a item invalido");
        }
        if (!participantIds.has(entry.enteId)) {
          throw new HttpError(400, "Quantidade vinculada a participante invalido");
        }
        parseMoney(entry.quantidade ?? "0", "Quantidade");
      }

      await db.transaction(async (tx) => {
        if (ata.itens.length > 0) {
          await tx.delete(ataItemQuantidades).where(inArray(ataItemQuantidades.itemId, ata.itens.map((item) => item.id)));
        }
        const rows = quantidades
          .map((entry) => ({ ...entry, quantidade: parseMoney(entry.quantidade ?? "0", "Quantidade").toFixed(2) }))
          .filter((entry) => Number(entry.quantidade) > 0);
        if (rows.length > 0) {
          await tx.insert(ataItemQuantidades).values(rows);
        }
      });

      const refreshedAta = await getAtaWithRelations(ata.id);
      await helpers.audit(req, "update", "ata_quantidades", ata.id, `Quantidades atualizadas na ata ${ata.numeroAta}`);
      res.json(refreshedAta);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao salvar quantidades") });
    }
  });

  app.put(api.atasRegistroPreco.saveCotacoes.path, helpers.requireAuth, requireAtaModuleAccess, async (req, res) => {
    try {
      const { cotacoes } = api.atasRegistroPreco.saveCotacoes.input.parse(req.body);
      const ata = await getAtaWithRelations(req.params.id);
      if (!ata) {
        return res.status(404).json({ message: "Ata nao encontrada" });
      }
      if (!hasAtaAccess(req, ata, helpers)) {
        throw new HttpError(403, "Acesso restrito aos participantes da ata");
      }

      const itemIds = new Set(ata.itens.map((item) => item.id));
      for (const entry of cotacoes) {
        if (!itemIds.has(entry.itemId)) {
          throw new HttpError(400, "Cotacao vinculada a item invalido");
        }
        parseMoney(entry.valorUnitarioCotado, "Valor unitario cotado");
      }

      await db.transaction(async (tx) => {
        if (ata.itens.length > 0) {
          await tx.delete(ataItemCotacoes).where(inArray(ataItemCotacoes.itemId, ata.itens.map((item) => item.id)));
        }
        const rows = cotacoes
          .filter((entry) => parseMoney(entry.valorUnitarioCotado ?? "0", "Valor unitario cotado") > 0)
          .map((entry) => ({
            itemId: entry.itemId,
            valorUnitarioCotado: parseMoney(entry.valorUnitarioCotado ?? "0", "Valor unitario cotado").toFixed(2),
          }));
        if (rows.length > 0) {
          await tx.insert(ataItemCotacoes).values(rows);
        }
      });

      const refreshedAta = await getAtaWithRelations(ata.id);
      await helpers.audit(req, "update", "ata_cotacoes", ata.id, `Cotacoes atualizadas na ata ${ata.numeroAta}`);
      res.json(refreshedAta);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao salvar cotacoes") });
    }
  });

  app.put(api.atasRegistroPreco.saveResultados.path, helpers.requireAuth, requireAtaModuleAccess, async (req, res) => {
    try {
      const { resultados } = api.atasRegistroPreco.saveResultados.input.parse(req.body);
      const ata = await getAtaWithRelations(req.params.id);
      if (!ata) {
        return res.status(404).json({ message: "Ata nao encontrada" });
      }
      if (!hasAtaAccess(req, ata, helpers)) {
        throw new HttpError(403, "Acesso restrito aos participantes da ata");
      }

      const itemIds = new Set(ata.itens.map((item) => item.id));
      for (const entry of resultados) {
        if (!itemIds.has(entry.itemId)) {
          throw new HttpError(400, "Resultado vinculado a item invalido");
        }
        if (!entry.itemFracassado && !entry.fornecedorId) {
          throw new HttpError(400, "Informe o fornecedor vencedor do item");
        }
        if (!entry.itemFracassado && entry.valorUnitarioLicitado != null) {
          parseMoney(entry.valorUnitarioLicitado, "Valor unitario licitado");
        }
      }

      await db.transaction(async (tx) => {
        if (ata.itens.length > 0) {
          await tx.delete(ataItemResultados).where(inArray(ataItemResultados.itemId, ata.itens.map((item) => item.id)));
        }
        const rows = resultados.map((entry) => ({
          itemId: entry.itemId,
          fornecedorId: entry.itemFracassado ? null : entry.fornecedorId ?? null,
          itemFracassado: entry.itemFracassado,
          valorUnitarioLicitado: entry.itemFracassado || entry.valorUnitarioLicitado == null || parseMoney(entry.valorUnitarioLicitado ?? "0", "Valor unitario licitado") === 0
            ? null
            : parseMoney(entry.valorUnitarioLicitado ?? "0", "Valor unitario licitado").toFixed(2),
        }));
        if (rows.length > 0) {
          await tx.insert(ataItemResultados).values(rows);
        }
      });

      const refreshedAta = await getAtaWithRelations(ata.id);
      await helpers.audit(req, "update", "ata_resultados", ata.id, `Resultados atualizados na ata ${ata.numeroAta}`);
      res.json(refreshedAta);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao salvar resultados") });
    }
  });

  app.get(api.ataPrePedidos.disponiveis.path, helpers.requireAuth, async (req, res) => {
    try {
      res.json(await listAtasDisponiveisParaPrePedido(req, helpers));
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao carregar saldos disponiveis") });
    }
  });

  app.get(api.ataPrePedidos.list.path, helpers.requireAuth, async (req, res) => {
    try {
      const prePedidos = await db.query.ataPrePedidos.findMany({
        with: {
          ata: {
            with: {
              processoDigital: {
                with: {
                  departamento: {
                    with: { ente: true },
                  },
                },
              },
              participantes: { with: { ente: true } },
              fornecedores: { with: { fornecedor: true } },
              itens: {
                with: {
                  quantidades: { with: { ente: true } },
                  cotacao: true,
                  resultado: { with: { fornecedor: true } },
                },
              },
            },
          },
          ataContrato: true,
          item: {
            with: {
              quantidades: { with: { ente: true } },
              cotacao: true,
              resultado: { with: { fornecedor: true } },
            },
          },
          ente: true,
          fonteRecurso: true,
          ficha: true,
          empenhos: {
            with: {
              notasFiscais: true,
              afs: {
                with: {
                  notasFiscais: true,
                },
              },
            },
          },
        },
      });

      if (await userCanViewAllPrePedidos(req, helpers)) {
        return res.json(prePedidos);
      }

      const accessibleEnteIds = helpers.getUserEnteIds(req);
      res.json(prePedidos.filter((prePedido) => accessibleEnteIds.includes(prePedido.enteId)));
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao carregar pre-pedidos") });
    }
  });

  app.get(api.ataContratos.list.path, helpers.requireAuth, async (req, res) => {
    try {
      const contratosArp = await db.query.ataContratos.findMany({
        with: {
          ata: true,
          fornecedor: true,
          prePedidos: {
            with: {
              ata: {
                with: {
                  processoDigital: {
                    with: {
                      departamento: {
                        with: { ente: true },
                      },
                    },
                  },
                  participantes: { with: { ente: true } },
                  fornecedores: { with: { fornecedor: true } },
                  itens: {
                    with: {
                      quantidades: { with: { ente: true } },
                      cotacao: true,
                      resultado: { with: { fornecedor: true } },
                    },
                  },
                },
              },
              item: {
                with: {
                  quantidades: { with: { ente: true } },
                  cotacao: true,
                  resultado: { with: { fornecedor: true } },
                },
              },
              ente: true,
              fonteRecurso: true,
              ficha: true,
              ataContrato: true,
            },
          },
          empenhos: {
            with: {
              prePedido: {
                with: {
                  ata: {
                    with: {
                      processoDigital: {
                        with: {
                          departamento: {
                            with: { ente: true },
                          },
                        },
                      },
                      participantes: { with: { ente: true } },
                      fornecedores: { with: { fornecedor: true } },
                      itens: {
                        with: {
                          quantidades: { with: { ente: true } },
                          cotacao: true,
                          resultado: { with: { fornecedor: true } },
                        },
                      },
                    },
                  },
                  item: {
                    with: {
                      quantidades: { with: { ente: true } },
                      cotacao: true,
                      resultado: { with: { fornecedor: true } },
                    },
                  },
                  ente: true,
                  fonteRecurso: true,
                  ficha: true,
                  ataContrato: true,
                },
              },
              afs: {
                with: {
                  notasFiscais: true,
                },
              },
              notasFiscais: true,
            },
          },
        },
      });

      if (await userCanViewAllPrePedidos(req, helpers)) {
        return res.json(contratosArp);
      }

      const accessibleEnteIds = helpers.getUserEnteIds(req);
      res.json(contratosArp.filter((contrato) => contrato.prePedidos.some((prePedido) => accessibleEnteIds.includes(prePedido.enteId))));
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao carregar contratos da ARP") });
    }
  });

  app.post(api.ataPrePedidos.createBatch.path, helpers.requireAuth, async (req, res) => {
    try {
      const data = api.ataPrePedidos.createBatch.input.parse(req.body);
      if (!hasParticipantAccess(req, data.enteId, helpers) && !await userCanViewAllPrePedidos(req, helpers)) {
        throw new HttpError(403, "Acesso restrito ao ente do usuario");
      }

      const ata = await getAtaWithRelations(data.ataId);
      if (!ata) {
        return res.status(404).json({ message: "Ata nao encontrada" });
      }
      if (!ata.participantes.some((participante) => participante.enteId === data.enteId)) {
        throw new HttpError(400, "O ente informado nao participa desta ata");
      }

      const itemIds = new Set(ata.itens.map((item) => item.id));
      const fichas = await db.query.fichasOrcamentarias.findMany();
      const fichaById = new Map(fichas.map((ficha) => [ficha.id, ficha]));
      const groupedByItem = new Map<string, number>();

      for (const pedido of data.pedidos) {
        if (!itemIds.has(pedido.itemId)) {
          throw new HttpError(400, "Pre-pedido vinculado a item invalido");
        }
        const ficha = fichaById.get(pedido.fichaId);
        if (!ficha) {
          throw new HttpError(400, "Ficha nao encontrada");
        }
        if (ficha.fonteRecursoId !== pedido.fonteRecursoId) {
          throw new HttpError(400, "A ficha informada nao pertence a fonte selecionada");
        }
        const quantidade = parseMoney(pedido.quantidadeSolicitada ?? "0", "Quantidade solicitada");
        if (quantidade <= 0) {
          throw new HttpError(400, "A quantidade solicitada deve ser maior que zero");
        }
        groupedByItem.set(pedido.itemId, (groupedByItem.get(pedido.itemId) ?? 0) + quantidade);
      }

      for (const [itemId, quantidadeNova] of Array.from(groupedByItem.entries())) {
        const item = ata.itens.find((entry) => entry.id === itemId);
        if (!item) continue;
        const quantidadeParticipante = item.quantidades
          .filter((quantidade) => quantidade.enteId === data.enteId)
          .reduce((sum, quantidade) => sum + parseMoney(quantidade.quantidade, "Quantidade participante"), 0);
        const quantidadePrePedida = await db.query.ataPrePedidos.findMany({
          where: and(eq(ataPrePedidos.ataId, ata.id), eq(ataPrePedidos.itemId, itemId), eq(ataPrePedidos.enteId, data.enteId)),
        });
        const jaConsumido = quantidadePrePedida.reduce((sum, prePedido) => sum + parseMoney(prePedido.quantidadeSolicitada, "Quantidade pre-pedida"), 0);
        if (quantidadeNova > quantidadeParticipante - jaConsumido) {
          throw new HttpError(400, `O item ${item.codigoInterno} excede o saldo disponivel do participante`);
        }
      }

      const rows = await db.insert(ataPrePedidos).values(
        data.pedidos.map((pedido) => ({
          ataId: data.ataId,
          itemId: pedido.itemId,
          enteId: data.enteId,
          fonteRecursoId: pedido.fonteRecursoId,
          fichaId: pedido.fichaId,
          quantidadeSolicitada: parseMoney(pedido.quantidadeSolicitada ?? "0", "Quantidade solicitada").toFixed(2),
          observacao: pedido.observacao ?? null,
          status: "aberto",
        })),
      ).returning();

      const enriched = await Promise.all(rows.map((row) => getPrePedidoWithRelations(row.id)));
      await helpers.audit(req, "create", "ata_pre_pedido", data.ataId, `${rows.length} pre-pedido(s) criados`);
      res.status(201).json(enriched.filter(Boolean));
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao criar pre-pedidos") });
    }
  });

  app.put(api.ataPrePedidos.update.path, helpers.requireAuth, async (req, res) => {
    try {
      const data = api.ataPrePedidos.update.input.parse(req.body);
      const prePedido = await getPrePedidoWithRelations(req.params.id);
      if (!prePedido) {
        return res.status(404).json({ message: "Pre-pedido nao encontrado" });
      }
      if (!hasParticipantAccess(req, prePedido.enteId, helpers) && !await userCanViewAllPrePedidos(req, helpers)) {
        throw new HttpError(403, "Acesso restrito ao ente do usuario");
      }

      const ficha = await db.query.fichasOrcamentarias.findFirst({ where: eq(fichasOrcamentarias.id, data.fichaId) });
      if (!ficha || ficha.fonteRecursoId !== data.fonteRecursoId) {
        throw new HttpError(400, "A ficha informada nao pertence a fonte selecionada");
      }

      const ata = await getAtaWithRelations(prePedido.ataId);
      if (!ata) {
        throw new HttpError(404, "Ata nao encontrada");
      }
      const item = ata.itens.find((entry) => entry.id === prePedido.itemId);
      if (!item) {
        throw new HttpError(404, "Item nao encontrado");
      }
      const quantidadeParticipante = item.quantidades
        .filter((quantidade) => quantidade.enteId === prePedido.enteId)
        .reduce((sum, quantidade) => sum + parseMoney(quantidade.quantidade, "Quantidade participante"), 0);
      const related = await db.query.ataPrePedidos.findMany({
        where: and(eq(ataPrePedidos.ataId, prePedido.ataId), eq(ataPrePedidos.itemId, prePedido.itemId), eq(ataPrePedidos.enteId, prePedido.enteId)),
      });
      const quantidadeOutros = related
        .filter((entry) => entry.id !== prePedido.id)
        .reduce((sum, entry) => sum + parseMoney(entry.quantidadeSolicitada, "Quantidade pre-pedida"), 0);
      const novaQuantidade = parseMoney(data.quantidadeSolicitada ?? "0", "Quantidade solicitada");
      if (novaQuantidade <= 0) {
        throw new HttpError(400, "A quantidade solicitada deve ser maior que zero");
      }
      if (novaQuantidade > quantidadeParticipante - quantidadeOutros) {
        throw new HttpError(400, "A quantidade solicitada excede o saldo disponivel do participante");
      }

      const [updated] = await db.update(ataPrePedidos).set({
        fonteRecursoId: data.fonteRecursoId,
        fichaId: data.fichaId,
        quantidadeSolicitada: novaQuantidade.toFixed(2),
        observacao: data.observacao ?? null,
        status: data.status,
        atualizadoEm: new Date(),
      }).where(eq(ataPrePedidos.id, prePedido.id)).returning();
      const enriched = await getPrePedidoWithRelations(updated.id);
      await helpers.audit(req, "update", "ata_pre_pedido", updated.id, `Pre-pedido ${updated.id} atualizado`);
      res.json(enriched);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao atualizar pre-pedido") });
    }
  });

  app.delete(api.ataPrePedidos.delete.path, helpers.requireAuth, async (req, res) => {
    try {
      const prePedido = await getPrePedidoWithRelations(req.params.id);
      if (!prePedido) {
        return res.status(404).json({ message: "Pre-pedido nao encontrado" });
      }
      if (!hasParticipantAccess(req, prePedido.enteId, helpers) && !await userCanViewAllPrePedidos(req, helpers)) {
        throw new HttpError(403, "Acesso restrito ao ente do usuario");
      }
      await db.delete(ataPrePedidos).where(eq(ataPrePedidos.id, prePedido.id));
      await helpers.audit(req, "delete", "ata_pre_pedido", prePedido.id, `Pre-pedido ${prePedido.id} excluido`);
      res.json({ message: "Pre-pedido excluido com sucesso" });
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao excluir pre-pedido") });
    }
  });

  app.post(api.ataPrePedidos.createEmpenho.path, helpers.requireAuth, async (req, res) => {
    try {
      if (!await userCanManageAtas(req, helpers)) {
        throw new HttpError(403, "Acesso restrito ao modulo de atas");
      }

      const data = api.ataPrePedidos.createEmpenho.input.parse(req.body);
      const prePedido = await getPrePedidoWithRelations(req.params.id);
      if (!prePedido) {
        return res.status(404).json({ message: "Pre-pedido nao encontrado" });
      }
      if (prePedido.ataContratoId) {
        throw new HttpError(400, "Este pre-pedido ja esta vinculado a um contrato ARP. Gere o empenho pela tela do contrato.");
      }

      const quantidadeEmpenhada = parseMoney(data.quantidadeEmpenhada, "Quantidade empenhada");
      if (quantidadeEmpenhada <= 0) {
        throw new HttpError(400, "A quantidade empenhada deve ser maior que zero");
      }

      const jaEmpenhado = await getPrePedidoEmpenhado(prePedido.id);
      const saldoDisponivel = parseMoney(prePedido.quantidadeSolicitada, "Quantidade solicitada") - jaEmpenhado;
      if (quantidadeEmpenhada > saldoDisponivel) {
        throw new HttpError(400, "A quantidade empenhada excede o saldo disponivel do pre-pedido");
      }

      const [empenho] = await db.insert(ataEmpenhos).values({
        ataContratoId: null,
        ataPrePedidoId: prePedido.id,
        dataEmpenho: data.dataEmpenho,
        numeroEmpenho: data.numeroEmpenho,
        quantidadeEmpenhada: quantidadeEmpenhada.toFixed(2),
        valorEmpenho: parseMoney(data.valorEmpenho, "Valor do empenho").toFixed(2),
        status: "ativo",
      }).returning();

      const saldoRemanescente = saldoDisponivel - quantidadeEmpenhada;
      await db.update(ataPrePedidos)
        .set({
          status: saldoRemanescente <= 0 ? "concluido" : "aberto",
          atualizadoEm: new Date(),
        })
        .where(eq(ataPrePedidos.id, prePedido.id));

      const enriched = await getAtaEmpenhoWithRelations(empenho.id);
      await helpers.audit(req, "create", "ata_empenho", empenho.id, `Empenho direto ${empenho.numeroEmpenho} criado a partir do pre-pedido ${prePedido.id}`);
      res.status(201).json(enriched);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao criar empenho direto da ARP") });
    }
  });

  app.post(api.ataContratos.create.path, helpers.requireAuth, async (req, res) => {
    try {
      if (!await userCanManageAtas(req, helpers)) {
        throw new HttpError(403, "Acesso restrito ao modulo de atas");
      }

      const data = api.ataContratos.create.input.parse(req.body);
      ensureDateOrder(data.vigenciaInicial, data.vigenciaFinal, "Vigencia inicial", "Vigencia final");
      const ata = await getAtaWithRelations(data.ataId);
      if (!ata) {
        return res.status(404).json({ message: "Ata nao encontrada" });
      }
      const prePedidos = await db.query.ataPrePedidos.findMany({
        where: inArray(ataPrePedidos.id, data.prePedidoIds),
        with: {
          ata: true,
          item: {
            with: {
              quantidades: { with: { ente: true } },
              cotacao: true,
              resultado: { with: { fornecedor: true } },
            },
          },
          ente: true,
          fonteRecurso: true,
          ficha: true,
          ataContrato: true,
          empenhos: true,
        },
      });
      if (prePedidos.length !== data.prePedidoIds.length) {
        throw new HttpError(400, "Selecione apenas pre-pedidos validos");
      }
      if (!prePedidos.every((prePedido) => prePedido.ataId === data.ataId && prePedido.status === "aberto" && !prePedido.ataContratoId)) {
        throw new HttpError(400, "Selecione apenas pre-pedidos em aberto da mesma ata");
      }
      if (prePedidos.some((prePedido) => (prePedido.empenhos?.length ?? 0) > 0)) {
        throw new HttpError(400, "Nao e possivel gerar contrato para pre-pedidos que ja possuem empenho direto");
      }

      const enteNames = prePedidos.map((prePedido) => prePedido.ente);
      const specialEntes = enteNames.filter((ente) => {
        const nome = normalizeEnteName(ente.nome);
        return nome.includes("saude") || nome.includes("assistencia social");
      });
      const uniqueEntes = Array.from(new Set(prePedidos.map((prePedido) => prePedido.enteId)));
      if (specialEntes.length > 0 && uniqueEntes.length > 1) {
        throw new HttpError(400, "Saude e Assistencia Social devem gerar contratos separados");
      }

      const fornecedorIds = Array.from(new Set(prePedidos.map((prePedido) => {
        const itemAta = ata.itens.find((item) => item.id === prePedido.itemId);
        if (!itemAta?.resultado?.fornecedorId || itemAta.resultado.itemFracassado) {
          return null;
        }
        return itemAta.resultado.fornecedorId;
      }).filter(Boolean)));

      if (fornecedorIds.length === 0) {
        throw new HttpError(400, "Os itens selecionados ainda nao possuem fornecedor vencedor vinculado");
      }
      if (fornecedorIds.length > 1) {
        throw new HttpError(400, "Selecione apenas pre-pedidos de itens com o mesmo fornecedor vencedor");
      }

      const [contrato] = await db.insert(ataContratos).values({
        ataId: data.ataId,
        fornecedorId: fornecedorIds[0] as string,
        numeroContrato: data.numeroContrato,
        objeto: data.objeto,
        vigenciaInicial: data.vigenciaInicial,
        vigenciaFinal: data.vigenciaFinal,
        status: "vigente",
      }).returning();

      await db.update(ataPrePedidos)
        .set({
          ataContratoId: contrato.id,
          status: "concluido",
          atualizadoEm: new Date(),
        })
        .where(inArray(ataPrePedidos.id, data.prePedidoIds));

      const enriched = await getAtaContratoWithRelations(contrato.id);
      await helpers.audit(req, "create", "ata_contrato", contrato.id, `Contrato ${contrato.numeroContrato} criado a partir de ${data.prePedidoIds.length} pre-pedido(s)`);
      res.status(201).json(enriched);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao criar contrato da ARP") });
    }
  });

  app.post(api.ataContratos.createEmpenho.path, helpers.requireAuth, async (req, res) => {
    try {
      if (!await userCanManageAtas(req, helpers)) {
        throw new HttpError(403, "Acesso restrito ao modulo de atas");
      }
      const data = api.ataContratos.createEmpenho.input.parse(req.body);
      const contrato = await getAtaContratoWithRelations(req.params.id);
      if (!contrato) {
        return res.status(404).json({ message: "Contrato da ARP nao encontrado" });
      }
      const prePedido = contrato.prePedidos.find((entry) => entry.id === data.ataPrePedidoId);
      if (!prePedido) {
        throw new HttpError(400, "Selecione um pre-pedido vinculado ao contrato");
      }
      const quantidadeEmpenhada = parseMoney(data.quantidadeEmpenhada, "Quantidade empenhada");
      if (quantidadeEmpenhada <= 0) {
        throw new HttpError(400, "A quantidade empenhada deve ser maior que zero");
      }
      const jaEmpenhado = await getPrePedidoEmpenhado(prePedido.id);
      const saldoDisponivel = parseMoney(prePedido.quantidadeSolicitada, "Quantidade solicitada") - jaEmpenhado;
      if (quantidadeEmpenhada > saldoDisponivel) {
        throw new HttpError(400, "A quantidade empenhada excede o saldo disponivel do pre-pedido");
      }
      const [empenho] = await db.insert(ataEmpenhos).values({
        ataContratoId: contrato.id,
        ataPrePedidoId: prePedido.id,
        dataEmpenho: data.dataEmpenho,
        numeroEmpenho: data.numeroEmpenho,
        quantidadeEmpenhada: quantidadeEmpenhada.toFixed(2),
        valorEmpenho: parseMoney(data.valorEmpenho, "Valor do empenho").toFixed(2),
        status: "ativo",
      }).returning();
      const enriched = await getAtaEmpenhoWithRelations(empenho.id);
      await helpers.audit(req, "create", "ata_empenho", empenho.id, `Empenho ${empenho.numeroEmpenho} criado`);
      res.status(201).json(enriched);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao criar empenho da ARP") });
    }
  });

  app.post(api.ataContratos.createAf.path, helpers.requireAuth, async (req, res) => {
    try {
      if (!await userCanManageAtas(req, helpers)) {
        throw new HttpError(403, "Acesso restrito ao modulo de atas");
      }
      const data = api.ataContratos.createAf.input.parse(req.body);
      const empenho = await getAtaEmpenhoWithRelations(req.params.id);
      if (!empenho) {
        return res.status(404).json({ message: "Empenho da ARP nao encontrado" });
      }
      const quantidadeAf = parseMoney(data.quantidadeAf, "Quantidade da AF");
      if (quantidadeAf <= 0) {
        throw new HttpError(400, "A quantidade da AF deve ser maior que zero");
      }
      const afJaCriadas = await getEmpenhoAfQuantidade(empenho.id);
      const notasDiretas = await getEmpenhoQuantidadeFaturadaDireta(empenho.id);
      const saldoQuantidade = parseMoney(empenho.quantidadeEmpenhada, "Quantidade empenhada") - afJaCriadas - notasDiretas;
      if (quantidadeAf > saldoQuantidade) {
        throw new HttpError(400, "A quantidade da AF excede o saldo do empenho");
      }
      const [year, month, day] = data.dataPedidoAf.split("-").map(Number);
      const defaultEntrega = new Date(Date.UTC(year, month - 1, day + 30)).toISOString().slice(0, 10);
      await db.insert(ataAfs).values({
        ataEmpenhoId: empenho.id,
        dataPedidoAf: data.dataPedidoAf,
        quantidadeAf: quantidadeAf.toFixed(2),
        valorAf: parseMoney(data.valorAf, "Valor da AF").toFixed(2),
        dataEstimadaEntrega: data.dataEstimadaEntrega || defaultEntrega,
      });
      await helpers.audit(req, "create", "ata_af", empenho.id, `AF criada para o empenho ${empenho.numeroEmpenho}`);
      res.status(201).json({ message: "AF criada com sucesso" });
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao criar AF da ARP") });
    }
  });

  app.post(api.ataNotasFiscais.create.path, helpers.requireAuth, async (req, res) => {
    try {
      if (!await userCanManageAtas(req, helpers)) {
        throw new HttpError(403, "Acesso restrito ao modulo de atas");
      }
      const data = api.ataNotasFiscais.create.input.parse(req.body);
      const af = await db.query.ataAfs.findFirst({
        where: eq(ataAfs.id, req.params.id),
        with: {
          empenho: true,
        },
      });
      if (!af) {
        return res.status(404).json({ message: "AF da ARP nao encontrada" });
      }
      const quantidadeNota = parseMoney(data.quantidadeNota, "Quantidade da nota");
      if (quantidadeNota <= 0) {
        throw new HttpError(400, "A quantidade da nota deve ser maior que zero");
      }
      const jaFaturado = await getAfQuantidadeFaturada(af.id);
      const saldoQuantidade = parseMoney(af.quantidadeAf, "Quantidade da AF") - jaFaturado;
      if (quantidadeNota > saldoQuantidade) {
        throw new HttpError(400, "A quantidade da nota excede o saldo da AF");
      }
      const [nota] = await db.insert(ataNotasFiscais).values({
        ataContratoId: af.empenho.ataContratoId,
        ataEmpenhoId: af.ataEmpenhoId,
        ataAfId: af.id,
        numeroNota: data.numeroNota,
        quantidadeNota: quantidadeNota.toFixed(2),
        valorNota: parseMoney(data.valorNota, "Valor da nota").toFixed(2),
        dataNota: data.dataNota,
        statusPagamento: "nota_recebida",
      }).returning();
      await helpers.audit(req, "create", "ata_nota_fiscal", nota.id, `Nota ${nota.numeroNota} criada para AF da ARP`);
      res.status(201).json(nota);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao criar nota fiscal da ARP") });
    }
  });

  app.post(api.ataNotasFiscais.createFromEmpenho.path, helpers.requireAuth, async (req, res) => {
    try {
      if (!await userCanManageAtas(req, helpers)) {
        throw new HttpError(403, "Acesso restrito ao modulo de atas");
      }
      const data = api.ataNotasFiscais.createFromEmpenho.input.parse(req.body);
      const empenho = await getAtaEmpenhoWithRelations(req.params.id);
      if (!empenho) {
        return res.status(404).json({ message: "Empenho da ARP nao encontrado" });
      }
      const quantidadeNota = parseMoney(data.quantidadeNota, "Quantidade da nota");
      if (quantidadeNota <= 0) {
        throw new HttpError(400, "A quantidade da nota deve ser maior que zero");
      }
      const quantidadeAf = await getEmpenhoAfQuantidade(empenho.id);
      const quantidadeJaFaturadaDireta = await getEmpenhoQuantidadeFaturadaDireta(empenho.id);
      const saldoQuantidade = parseMoney(empenho.quantidadeEmpenhada, "Quantidade empenhada") - quantidadeAf - quantidadeJaFaturadaDireta;
      if (quantidadeNota > saldoQuantidade) {
        throw new HttpError(400, "A quantidade da nota excede o saldo disponivel do empenho");
      }
      const [nota] = await db.insert(ataNotasFiscais).values({
        ataContratoId: empenho.ataContratoId,
        ataEmpenhoId: empenho.id,
        ataAfId: null,
        numeroNota: data.numeroNota,
        quantidadeNota: quantidadeNota.toFixed(2),
        valorNota: parseMoney(data.valorNota, "Valor da nota").toFixed(2),
        dataNota: data.dataNota,
        statusPagamento: "nota_recebida",
      }).returning();
      await helpers.audit(req, "create", "ata_nota_fiscal", nota.id, `Nota ${nota.numeroNota} criada para empenho da ARP`);
      res.status(201).json(nota);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao criar nota fiscal da ARP") });
    }
  });

  app.patch(api.ataNotasFiscais.sendToPayment.path, helpers.requireAuth, async (req, res) => {
    try {
      if (!await userCanManageAtas(req, helpers)) {
        throw new HttpError(403, "Acesso restrito ao modulo de atas");
      }
      const data = api.ataNotasFiscais.sendToPayment.input.parse(req.body);
      const [nota] = await db.update(ataNotasFiscais).set({
        statusPagamento: "aguardando_pagamento",
        numeroProcessoPagamento: data.numeroProcessoPagamento,
        dataEnvioPagamento: data.dataEnvioPagamento,
        atualizadoEm: new Date(),
      }).where(eq(ataNotasFiscais.id, req.params.id)).returning();
      if (!nota) {
        return res.status(404).json({ message: "Nota fiscal da ARP nao encontrada" });
      }
      await helpers.audit(req, "update", "ata_nota_fiscal", nota.id, `Nota ${nota.numeroNota} enviada para pagamento`);
      res.json(nota);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao enviar nota da ARP para pagamento") });
    }
  });

  app.patch(api.ataNotasFiscais.registerPayment.path, helpers.requireAuth, async (req, res) => {
    try {
      if (!await userCanManageAtas(req, helpers)) {
        throw new HttpError(403, "Acesso restrito ao modulo de atas");
      }
      const data = api.ataNotasFiscais.registerPayment.input.parse(req.body);
      const [nota] = await db.update(ataNotasFiscais).set({
        statusPagamento: "pago",
        dataPagamento: data.dataPagamento,
        atualizadoEm: new Date(),
      }).where(eq(ataNotasFiscais.id, req.params.id)).returning();
      if (!nota) {
        return res.status(404).json({ message: "Nota fiscal da ARP nao encontrada" });
      }
      await helpers.audit(req, "update", "ata_nota_fiscal", nota.id, `Pagamento registrado para nota ${nota.numeroNota}`);
      res.json(nota);
    } catch (error) {
      res.status(helpers.getErrorStatus(error)).json({ message: helpers.getErrorMessage(error, "Erro ao registrar pagamento da ARP") });
    }
  });
}
