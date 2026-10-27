
CREATE TABLE vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    plataforma VARCHAR(50) NOT NULL,
    id_venda VARCHAR(100) NOT NULL,

    valor_centavos BIGINT NOT NULL,
    moeda VARCHAR(3) NOT NULL,

    pago_em TIMESTAMPTZ NOT NULL,
    recebido_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Plataforma normalizada
    CONSTRAINT vendas_plataforma_valida
        CHECK (
            LENGTH(BTRIM(plataforma)) > 0
            AND plataforma = LOWER(BTRIM(plataforma))
        ),

    -- Impede identificadores vazios ou espaços nas extremidades
    CONSTRAINT vendas_id_venda_valido
        CHECK (
            LENGTH(BTRIM(id_venda)) > 0
            AND id_venda = BTRIM(id_venda)
        ),

    -- Garante valores positivos
    CONSTRAINT vendas_valor_valido
        CHECK (
            valor_centavos BETWEEN 1 AND 9007199254740991
        ),

    -- Aceita apenas moeda brasileira
    CONSTRAINT vendas_moeda_valida
        CHECK (moeda = 'BRL'),

    -- Impede vendas duplicadas por plataforma
    CONSTRAINT vendas_identificador_unico
        UNIQUE (plataforma, id_venda)
);

-- Otimiza consultas de relatórios por período
CREATE INDEX indice_vendas_pago_em
    ON vendas (pago_em);
