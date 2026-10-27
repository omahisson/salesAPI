import { describe, expect, it } from 'vitest';
import { esquemaFiltros, esquemaWebhook } from '../src/modulos/vendas/esquemas-vendas.js';

const exemplo = {
  platform: ' Hotmart ',
  saleId: ' VENDA-001 ',
  amountCents: 14990,
  currency: 'BRL',
  paidAt: '2026-10-27T14:30:00Z',
};

describe('Validação do webhook', () => {
  it('aceita e normaliza uma venda válida', () => {
    const dados = esquemaWebhook.parse(exemplo);
    expect(dados.platform).toBe('hotmart');
    expect(dados.saleId).toBe('VENDA-001');
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejeita amountCents inválido (%s)', (amountCents) => {
      expect(esquemaWebhook.safeParse({ ...exemplo, amountCents }).success).toBe(false);
    },
  );

  it('rejeita moedas diferentes de BRL', () => {
    expect(esquemaWebhook.safeParse({ ...exemplo, currency: 'USD' }).success).toBe(false);
  });

  it('rejeita datas inexistentes', () => {
    expect(esquemaWebhook.safeParse({ ...exemplo, paidAt: '2026-02-30T14:30:00Z' }).success).toBe(false);
  });

  it('rejeita campos desconhecidos', () => {
    expect(esquemaWebhook.safeParse({ ...exemplo, extra: 123 }).success).toBe(false);
  });
});

describe('Validação dos filtros de relatório', () => {
  it('aceita intervalo válido', () => {
    expect(esquemaFiltros.safeParse({ from: '2026-10-01', to: '2026-11-01' }).success).toBe(true);
  });

  it('aceita consulta sem filtros', () => {
    expect(esquemaFiltros.safeParse({}).success).toBe(true);
  });

  it('rejeita intervalo invertido', () => {
    expect(esquemaFiltros.safeParse({ from: '2026-11-01', to: '2026-10-01' }).success).toBe(false);
  });

  it('rejeita datas inexistentes', () => {
    expect(esquemaFiltros.safeParse({ from: '2026-02-30' }).success).toBe(false);
  });
});
