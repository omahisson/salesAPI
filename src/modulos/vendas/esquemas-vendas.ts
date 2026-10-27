import { z } from 'zod';

const formatoDataHoraUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

function dataHoraUtcValida(valor: string): boolean {
  if (!formatoDataHoraUtc.test(valor)) return false;
  const data = new Date(valor);
  return !Number.isNaN(data.valueOf()) &&
    data.toISOString().slice(0, 19) === valor.slice(0, 19);
}

function diaValido(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(data.valueOf()) && data.toISOString().slice(0, 10) === valor;
}

export const esquemaWebhook = z.object({
  platform: z.string().trim().min(1).max(50).transform((valor) => valor.toLowerCase()),
  saleId: z.string().trim().min(1).max(100),
  amountCents: z.number().int().positive().refine(Number.isSafeInteger),
  currency: z.literal('BRL'),
  paidAt: z.string().refine(dataHoraUtcValida, 'Data UTC inválida'),
}).strict();

const esquemaDia = z.string().refine(diaValido, 'Data inválida');

export const esquemaFiltros = z.object({
  from: esquemaDia.optional(),
  to: esquemaDia.optional(),
}).strict().refine(
  ({ from, to }) => !from || !to || from < to,
  { message: 'A data inicial deve ser anterior à data final' },
);

export type DadosVenda = z.infer<typeof esquemaWebhook>;
export type FiltrosRelatorio = z.infer<typeof esquemaFiltros>;
