import 'dotenv/config';

const porta = Number(process.env.PORT ?? '3000');

if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
  throw new Error('Variável PORT inválida');
}

export const ambiente = {
  porta,
  urlBanco: process.env.DATABASE_URL,
};
