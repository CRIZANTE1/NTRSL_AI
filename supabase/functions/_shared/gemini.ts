import { GoogleGenerativeAI, type GenerativeModel } from 'npm:@google/generative-ai@0.21.0';

export function getGeminiModel(): GenerativeModel {
  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!apiKey) {
    throw new Response(JSON.stringify({ error: 'GOOGLE_API_KEY não configurada.' }), { status: 500 });
  }

  const modelName = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

export async function generateJson<T>(prompt: string, schemaDescription: string): Promise<T> {
  const model = getGeminiModel();
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const text = result.response.text();
  if (!text) {
    throw new Response(JSON.stringify({ error: 'Resposta vazia do Gemini.' }), { status: 502 });
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Response(
      JSON.stringify({ error: `JSON inválido do Gemini (${schemaDescription}).` }),
      { status: 502 },
    );
  }
}
