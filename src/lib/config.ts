/**
 * Endereço do questionário de usabilidade (SUS), definido na hora do build
 * pela variável VITE_SUS_URL. Sem ela, o tour só orienta a responder o
 * questionário enviado junto com o link.
 */
const raw = import.meta.env.VITE_SUS_URL as string | undefined;

export const SUS_URL: string | undefined =
  raw && /^https?:\/\//.test(raw.trim()) ? raw.trim() : undefined;