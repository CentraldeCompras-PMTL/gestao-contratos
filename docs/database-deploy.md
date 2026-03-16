# Banco no Supabase e deploy no Railway

## Arquivos que importam

- Schema de aplicacao: [shared/schema.ts](/C:/Users/Eric/Documents/SIGEC/shared/schema.ts)
- SQL inicial para banco vazio: [sql/supabase-init.sql](/C:/Users/Eric/Documents/SIGEC/sql/supabase-init.sql)
- Migracao incremental atual: [migrations/0000_dates_to_date.sql](/C:/Users/Eric/Documents/SIGEC/migrations/0000_dates_to_date.sql)
- Seed opcional: [server/seed.ts](/C:/Users/Eric/Documents/SIGEC/server/seed.ts)

## Opcao 1: subir manualmente no Supabase

### Criar estrutura

1. Abra o projeto no Supabase.
2. Entre em `SQL Editor`.
3. Cole o conteudo de [sql/supabase-init.sql](/C:/Users/Eric/Documents/SIGEC/sql/supabase-init.sql).
4. Execute o script.

### Validar

Rode estas consultas:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

```sql
select indexname, tablename
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
```

### Popular com dados de teste

Se quiser usar o seed do projeto:

1. Pegue a `DATABASE_URL` no Supabase.
2. No projeto local, carregue a variavel.
3. Rode:

```powershell
npm run db:push
npx tsx server/seed.ts
```

`db:push` aqui serve para alinhar o banco com o schema do Drizzle. Como o SQL inicial ja cria tudo, ele tende a nao gerar mudanca relevante em banco novo.

## Opcao 2: automatizar criacao via Railway

O fluxo recomendado e:

1. Banco no Supabase.
2. App no Railway.
3. Railway com a variavel `DATABASE_URL` apontando para o Supabase.
4. Antes do deploy da aplicacao, rodar `npm run db:push`.

### Variaveis necessarias no Railway

- `DATABASE_URL`
- `NODE_ENV=production`
- qualquer segredo adicional de sessao que o app use em producao

### Comando de build/deploy

No Railway, configure:

- Build Command:

```bash
npm install && npm run check
```

- Start Command:

```bash
npm start
```

- Pre-deploy Command:

```bash
npm run db:push
```

Esse `db:push` usa [drizzle.config.ts](/C:/Users/Eric/Documents/SIGEC/drizzle.config.ts) e o schema em [shared/schema.ts](/C:/Users/Eric/Documents/SIGEC/shared/schema.ts). Sempre que o deploy subir, o Railway vai tentar alinhar o banco antes de iniciar a aplicacao.

## Qual estrategia eu recomendo

Para o seu caso:

1. Rodar primeiro [sql/supabase-init.sql](/C:/Users/Eric/Documents/SIGEC/sql/supabase-init.sql) no Supabase para montar a base limpa.
2. Configurar `DATABASE_URL` do Supabase no Railway.
3. Deixar `npm run db:push` como pre-deploy.
4. Rodar seed apenas em ambiente de teste, nunca em producao.

Assim voce tem:

- um bootstrap inicial previsivel
- sincronizacao automatica do schema nos deploys
- separacao clara entre estrutura e dados de teste

## Observacoes importantes

- O projeto usa Drizzle, nao migrations nativas do Supabase.
- `db:push` e pratico, mas para producao madura o ideal e versionar migrations completas por alteracao.
- O SQL inicial inclui `create extension if not exists pgcrypto`, necessario para `gen_random_uuid()`.
- O SQL inicial adiciona `checks`, `indexes` e triggers para manter `atualizado_em`.

## Fluxo futuro mais seguro

Quando voce quiser profissionalizar mais o deploy:

1. gerar migration nova no repositorio
2. revisar o SQL
3. aplicar a migration no banco
4. so depois publicar a app

Se quiser, no proximo passo eu posso:

- transformar esse bootstrap em migration versionada do Drizzle
- adicionar um script `db:seed`
- e te deixar um passo a passo exato de configuracao dentro do painel do Railway
