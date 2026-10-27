import { conexao } from '../../banco/conexao.js';
import type { DadosVenda, FiltrosRelatorio } from './esquemas-vendas.js';

export type ResultadoRegistro = 'criada' | 'duplicada' | 'conflito';

type VendaExistente = {
  valor_centavos: string; 
  moeda: string;
  pago_em: Date;
};

export async function salvarVenda(dados: DadosVenda): Promise<ResultadoRegistro> {
  const insercao = await conexao.query(
    `INSERT INTO vendas (plataforma, id_venda, valor_centavos, moeda, pago_em)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (plataforma, id_venda) DO NOTHING
     RETURNING id`,
    [dados.platform, dados.saleId, dados.amountCents.toString(), dados.currency, dados.paidAt],
  );

  if (insercao.rowCount === 1) return 'criada';

  const consulta = await conexao.query<VendaExistente>(
    `SELECT valor_centavos, moeda, pago_em
     FROM vendas WHERE plataforma = $1 AND id_venda = $2`,
    [dados.platform, dados.saleId],
  );

  const existente = consulta.rows[0];
  if (!existente) throw new Error('Venda não encontrada após conflito de unicidade');

  const igual = BigInt(existente.valor_centavos) === BigInt(dados.amountCents) &&
    existente.moeda === dados.currency &&
    existente.pago_em.getTime() === new Date(dados.paidAt).getTime();

  return igual ? 'duplicada' : 'conflito';
}

function inteiroJsonSeguro(valor: string): number {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero)) {
    throw new Error('Total do relatório excede a precisão segura do JSON');
  }
  return numero;
}

export async function buscarRelatorio(filtros: FiltrosRelatorio) {
  const inicio = filtros.from ? `${filtros.from}T00:00:00Z` : null;
  const fim = filtros.to ? `${filtros.to}T00:00:00Z` : null;

  const resultado = await conexao.query<{
    quantidade: string;
    total_centavos: string;
  }>(
    `SELECT COUNT(*)::text AS quantidade,
            COALESCE(SUM(valor_centavos), 0)::text AS total_centavos
     FROM vendas
     WHERE ($1::timestamptz IS NULL OR pago_em >= $1::timestamptz)
       AND ($2::timestamptz IS NULL OR pago_em < $2::timestamptz)`,
    [inicio, fim],
  );
  const linha = resultado.rows[0];
  if (!linha) throw new Error('Consulta de relatório sem resultado agregado');

  return {
    currency: 'BRL',
    salesCount: inteiroJsonSeguro(linha.quantidade),
    grossAmountCents: inteiroJsonSeguro(linha.total_centavos),
  };
}
