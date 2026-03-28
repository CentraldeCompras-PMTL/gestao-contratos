import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users, fornecedores, fontesRecurso, fichasOrcamentarias, projetosAtividade, processosDigitais, fasesContratacao, contratos, empenhos, afs } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  console.log("Seeding database...");

  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    const pw = await hashPassword("123456");
    await db.insert(users).values({
      email: "admin@admin.com",
      password: pw,
      name: "Administrador",
      role: "admin",
    });
    console.log("User admin@admin.com created.");
  }

  const existingForns = await db.select().from(fornecedores);
  let forns = existingForns;
  if (existingForns.length === 0) {
    const data = [
      { nome: "Tech Solutions Ltda", cnpj: "11.111.111/0001-11", email: "contato@tech.com", telefone: "11999999999" },
      { nome: "Medical Supply S.A.", cnpj: "22.222.222/0001-22", email: "vendas@medical.com", telefone: "11888888888" },
      { nome: "Limpeza Total", cnpj: "33.333.333/0001-33", email: "comercial@limpeza.com", telefone: "11777777777" },
      { nome: "Construtora Alfa", cnpj: "44.444.444/0001-44", email: "contato@alfa.com", telefone: "11666666666" },
      { nome: "Softwares SA", cnpj: "55.555.555/0001-55", email: "contato@softwares.com", telefone: "11555555555" },
    ];
    forns = await db.insert(fornecedores).values(data).returning();
    console.log("5 Fornecedores created.");
  }

  const existingProcs = await db.select().from(processosDigitais);
  let procs = existingProcs;
  if (existingProcs.length === 0) {
    const data = [
      {
        numeroProcessoDigital: "2024.0001",
        objetoCompleto: "Aquisicao de medicamentos para o hospital municipal",
        objetoResumido: "Medicamentos",
        descricao: "Pregao Eletronico 01/2024",
      },
      {
        numeroProcessoDigital: "2024.0002",
        objetoCompleto: "Contratacao de empresa para servicos de limpeza nas secretarias",
        objetoResumido: "Servicos de Limpeza",
        descricao: "Concorrencia 02/2024",
      },
    ];
    procs = await db.insert(processosDigitais).values(data).returning();
    console.log("2 Processos Digitais created.");
  }

  const existingFontes = await db.select().from(fontesRecurso);
  let fontes = existingFontes;
  if (existingFontes.length === 0) {
    fontes = await db.insert(fontesRecurso).values([
      { nome: "Recursos Ordinarios", codigo: "1.500.0000" },
      { nome: "Transferencias da Saude", codigo: "1.600.0000" },
    ]).returning();
  }

  const existingFichas = await db.select().from(fichasOrcamentarias);
  let fichas = existingFichas;
  const existingProjetosAtividade = await db.select().from(projetosAtividade);
  let projetos = existingProjetosAtividade;
  if (existingProjetosAtividade.length === 0) {
    projetos = await db.insert(projetosAtividade).values([
      { fonteRecursoId: fontes[0].id, codigo: "2001", descricao: "Manutencao administrativa" },
      { fonteRecursoId: fontes[0].id, codigo: "2002", descricao: "Prestacao de servicos continuados" },
      { fonteRecursoId: fontes[1].id, codigo: "3001", descricao: "Atencao basica em saude" },
    ]).returning();
  }
  if (existingFichas.length === 0) {
    fichas = await db.insert(fichasOrcamentarias).values([
      { fonteRecursoId: fontes[0].id, projetoAtividadeId: projetos[0].id, codigo: "001", classificacao: "consumo" },
      { fonteRecursoId: fontes[0].id, projetoAtividadeId: projetos[1].id, codigo: "002", classificacao: "servico" },
      { fonteRecursoId: fontes[1].id, projetoAtividadeId: projetos[2].id, codigo: "003", classificacao: "permanente" },
    ]).returning();
  }

  const existingFases = await db.select().from(fasesContratacao);
  let fases = existingFases;
  if (existingFases.length === 0) {
    const data = [
      { processoDigitalId: procs[0].id, nomeFase: "Fase Interna", fornecedorId: forns[0].id, modalidade: "Planejamento", numeroModalidade: "INT-001/2024", dataInicio: "2024-01-10" },
      { processoDigitalId: procs[0].id, nomeFase: "Licitacao", fornecedorId: forns[1].id, modalidade: "Pregao Eletronico", numeroModalidade: "PE-001/2024", dataInicio: "2024-02-01" },
      { processoDigitalId: procs[0].id, nomeFase: "Homologacao", fornecedorId: forns[1].id, modalidade: "Pregao Eletronico", numeroModalidade: "PE-001/2024", dataInicio: "2024-03-01" },
      { processoDigitalId: procs[1].id, nomeFase: "Fase Interna", fornecedorId: forns[2].id, modalidade: "Planejamento", numeroModalidade: "INT-002/2024", dataInicio: "2024-01-15" },
      { processoDigitalId: procs[1].id, nomeFase: "Licitacao", fornecedorId: forns[2].id, modalidade: "Concorrencia", numeroModalidade: "CC-002/2024", dataInicio: "2024-02-15" },
      { processoDigitalId: procs[1].id, nomeFase: "Empenho", fornecedorId: forns[3].id, modalidade: "Concorrencia", numeroModalidade: "CC-002/2024", dataInicio: "2024-03-15" },
    ];
    fases = await db.insert(fasesContratacao).values(data).returning();
    console.log("6 Fases de Contratacao created.");
  }

  const existingContratos = await db.select().from(contratos);
  let contrs = existingContratos;
  if (existingContratos.length === 0) {
    const data = [
      { processoDigitalId: procs[0].id, faseContratacaoId: fases[2].id, numeroContrato: "001/2024", fornecedorId: forns[1].id, valorContrato: "150000.00", vigenciaInicial: "2024-03-05", vigenciaFinal: "2025-03-05" },
      { processoDigitalId: procs[1].id, faseContratacaoId: fases[5].id, numeroContrato: "003/2024", fornecedorId: forns[3].id, valorContrato: "200000.00", vigenciaInicial: "2024-04-01", vigenciaFinal: "2025-04-01" },
    ];
    contrs = await db.insert(contratos).values(data).returning();
    console.log("2 Contratos created.");
  }

  const existingEmpenhos = await db.select().from(empenhos);
  let emps = existingEmpenhos;
  if (existingEmpenhos.length === 0) {
    const data = [
      { contratoId: contrs[0].id, fonteRecursoId: fontes[1].id, fichaId: fichas[2].id, dataEmpenho: "2024-03-06", valorEmpenho: "50000.00" },
      { contratoId: contrs[1].id, fonteRecursoId: fontes[0].id, fichaId: fichas[1].id, dataEmpenho: "2024-04-02", valorEmpenho: "25000.00" },
    ];
    emps = await db.insert(empenhos).values(data).returning();
    console.log("2 Empenhos created.");
  }

  const existingAfs = await db.select().from(afs);
  if (existingAfs.length === 0) {
    const today = new Date();
    const dtPedido1 = new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000);
    const dtEst1 = new Date(dtPedido1.getTime() + 30 * 24 * 60 * 60 * 1000);

    const dtPedido2 = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
    const dtEst2 = new Date(dtPedido2.getTime() + 30 * 24 * 60 * 60 * 1000);

    const dtPedido3 = new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000);
    const dtEst3 = new Date(dtPedido3.getTime() + 30 * 24 * 60 * 60 * 1000);

    const dtPedido4 = new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000);
    const dtEst4 = new Date(dtPedido4.getTime() + 30 * 24 * 60 * 60 * 1000);

    const data = [
      { empenhoId: emps[0].id, dataPedidoAf: dtPedido1.toISOString().split("T")[0], valorAf: "10000.00", dataEstimadaEntrega: dtEst1.toISOString().split("T")[0], dataEntregaReal: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
      { empenhoId: emps[0].id, dataPedidoAf: dtPedido2.toISOString().split("T")[0], valorAf: "15000.00", dataEstimadaEntrega: dtEst2.toISOString().split("T")[0], dataEntregaReal: null },
      { empenhoId: emps[1].id, dataPedidoAf: dtPedido3.toISOString().split("T")[0], valorAf: "10000.00", dataEstimadaEntrega: dtEst3.toISOString().split("T")[0], dataEntregaReal: null },
      { empenhoId: emps[1].id, dataPedidoAf: dtPedido4.toISOString().split("T")[0], valorAf: "5000.00", dataEstimadaEntrega: dtEst4.toISOString().split("T")[0], dataEntregaReal: null },
    ];
    await db.insert(afs).values(data);
    console.log("4 AFs created.");
  }

  console.log("Seed complete.");
}

seed().catch(console.error).finally(() => process.exit(0));
