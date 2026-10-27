import type { FastifyInstance } from 'fastify';
import { esquemaFiltros, esquemaWebhook } from './esquemas-vendas.js';
import { gerarRelatorio, registrarVenda } from './servico-vendas.js';

export async function rotasVendas(aplicacao: FastifyInstance) {
  aplicacao.post('/webhooks/sales', async (requisicao, resposta) => {
    const validacao = esquemaWebhook.safeParse(requisicao.body);
    if (!validacao.success) {
      return resposta.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Invalid webhook payload',
      });
    }

    const resultado = await registrarVenda(validacao.data);
    const saleId = validacao.data.saleId;

    if (resultado === 'criada') {
      return resposta.code(201).send({ status: 'created', saleId });
    }
    if (resultado === 'duplicada') {
      return resposta.code(200).send({ status: 'already_processed', saleId });
    }
    return resposta.code(409).send({
      error: 'SALE_CONFLICT',
      message: 'Sale already exists with different data',
    });
  });

  aplicacao.get('/reports/sales', async (requisicao, resposta) => {
    const validacao = esquemaFiltros.safeParse(requisicao.query);
    if (!validacao.success) {
      return resposta.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Invalid report filters',
      });
    }
    return resposta.code(200).send(await gerarRelatorio(validacao.data));
  });
}
