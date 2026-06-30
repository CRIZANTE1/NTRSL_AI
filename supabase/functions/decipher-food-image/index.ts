import { requireUser } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getGeminiModel } from '../_shared/gemini.ts';

const MAX_BASE64_LENGTH = 6_000_000;

interface DecipherResponse {
  identified: boolean;
  description: string;
}

function stripBase64Payload(raw: string): string {
  const trimmed = raw.trim();
  const commaIndex = trimmed.indexOf(',');
  if (commaIndex !== -1 && trimmed.slice(0, commaIndex).includes('base64')) {
    return trimmed.slice(commaIndex + 1);
  }
  return trimmed;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  try {
    await requireUser(req);

    const body = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
    };

    const base64 = stripBase64Payload(body.imageBase64 ?? '');
    const mimeType = body.mimeType?.trim() || 'image/jpeg';

    if (!base64) {
      return jsonResponse({ error: 'Imagem obrigatória.' }, 400);
    }

    if (base64.length > MAX_BASE64_LENGTH) {
      return jsonResponse({ error: 'Imagem muito grande. Use uma foto menor.' }, 413);
    }

    const prompt = `Você analisa fotos de refeições para o app NTRSL AI (pt-BR).

Descreva os alimentos e bebidas visíveis de forma concisa, como o usuário digitaria no diário.
Inclua quantidades estimadas quando possível (ex.: "2 fatias de pizza calabresa, 200 ml de suco de laranja").
Não inclua calorias, macros nem comentários extras — apenas a descrição textual.

Se NÃO houver comida ou bebida identificável (foto escura, objeto sem relação, prato vazio, etc.):
- identified: false
- description: "" (string vazia)

Se houver alimentos/bebidas identificáveis:
- identified: true
- description: texto conciso para o diário

Retorne APENAS JSON:
{ "identified": boolean, "description": "string" }`;

    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }, { inlineData: { mimeType, data: base64 } }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = result.response.text();
    if (!text) {
      return jsonResponse({ error: 'Resposta vazia do Gemini.' }, 502);
    }

    let parsed: DecipherResponse;
    try {
      parsed = JSON.parse(text) as DecipherResponse;
    } catch {
      return jsonResponse({ error: 'JSON inválido do Gemini (DecipherResponse).' }, 502);
    }

    const description = parsed.description?.trim() ?? '';
    const identified = parsed.identified === true && description.length > 0;

    if (!identified) {
      return jsonResponse({ identified: false, description: '' });
    }

    return jsonResponse({ identified: true, description });
  } catch (e) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});
