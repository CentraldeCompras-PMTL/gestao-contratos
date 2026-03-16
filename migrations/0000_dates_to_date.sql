ALTER TABLE "fases_contratacao"
  ALTER COLUMN "data_inicio" TYPE date USING "data_inicio"::date,
  ALTER COLUMN "data_fim" TYPE date USING NULLIF("data_fim", '')::date;

ALTER TABLE "contratos"
  ALTER COLUMN "vigencia_inicial" TYPE date USING "vigencia_inicial"::date,
  ALTER COLUMN "vigencia_final" TYPE date USING "vigencia_final"::date;

ALTER TABLE "empenhos"
  ALTER COLUMN "data_empenho" TYPE date USING "data_empenho"::date;

ALTER TABLE "afs"
  ALTER COLUMN "data_pedido_af" TYPE date USING "data_pedido_af"::date,
  ALTER COLUMN "data_estimada_entrega" TYPE date USING "data_estimada_entrega"::date,
  ALTER COLUMN "data_entrega_real" TYPE date USING NULLIF("data_entrega_real", '')::date,
  ALTER COLUMN "data_extensao" TYPE date USING NULLIF("data_extensao", '')::date;

ALTER TABLE "notas_fiscais"
  ALTER COLUMN "data_nota" TYPE date USING "data_nota"::date,
  ALTER COLUMN "data_pagamento" TYPE date USING NULLIF("data_pagamento", '')::date;
