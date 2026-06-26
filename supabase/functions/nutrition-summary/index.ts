import { requireUser } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { generateJson } from '../_shared/gemini.ts';
import {
  buildSummaryFromEntries,
  mergeNutritionSummary,
  needsAiRefinement,
  type ExerciseInput,
  type FoodInput,
  type NutritionSummary,
} from '../_shared/nutrition.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  try {
    await requireUser(req);

    const body = (await req.json()) as {
      exercises?: ExerciseInput[];
      foods?: FoodInput[];
    };

    const exercises = Array.isArray(body.exercises) ? body.exercises : [];
    const foods = Array.isArray(body.foods) ? body.foods : [];

    const localSummary = buildSummaryFromEntries(exercises, foods);

    if (!needsAiRefinement(exercises, foods)) {
      return jsonResponse(localSummary);
    }

    const prompt = `Você é um calculador nutricional preciso para o app NTRSL AI (pt-BR).

Já existe um resumo calculado localmente com dados confiáveis do catálogo. Use-o como BASELINE.
NUNCA retorne zeros para campos em que a baseline é maior que zero.
Ajuste apenas itens sem dados locais ou melhore estimativas claramente incorretas.

REGRA DE QUANTIDADE:
- O campo "quantity" no input é apenas fallback (100g).
- Se o nome do alimento contém quantidade explícita (ex: "2 ovos", "1 fatia de pão", "200ml de leite",
  "uma xícara de arroz", "meio filé"), EXTRAIA essa quantidade e use-a no cálculo.
  Calcule as calorias totais para essa porção, NÃO para 100g.
- Para unidades (ovos, fatias, colheres de sopa), use o peso médio típico em gramas.
- Se nenhuma quantidade for detectável no texto, use o fallback de 100g.

BASELINE (obrigatória como piso):
${JSON.stringify(localSummary)}

ENTRADA DETALHADA (inclui macros por 100g e calorias/min quando disponíveis):
${JSON.stringify({ exercises, foods })}

Retorne APENAS JSON com este schema exato:
{
  "gastas": number,
  "consumidas": number,
  "exercicios": string[],
  "duracao": number,
  "alimentos": string[],
  "proteina": number,
  "carboidratos": number,
  "gordura": number
}`;

    const aiSummary = await generateJson<NutritionSummary>(prompt, 'NutritionSummary');
    const merged = mergeNutritionSummary(localSummary, aiSummary);

    return jsonResponse(merged);
  } catch (e) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});
