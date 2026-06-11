import caloriasData from '../_shared/data/calorias.json' with { type: 'json' };
import exerciciosData from '../_shared/data/exercicios.json' with { type: 'json' };
import { requireUser } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { generateJson } from '../_shared/gemini.ts';

interface ExerciseInput {
  name: string;
  durationMinutes: number;
}

interface FoodInput {
  name: string;
  quantity: number;
}

interface NutritionSummary {
  gastas: number;
  consumidas: number;
  exercicios: string[];
  duracao: number;
  alimentos: string[];
  proteina: number;
  carboidratos: number;
  gordura: number;
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
      exercises?: ExerciseInput[];
      foods?: FoodInput[];
    };

    const exercises = Array.isArray(body.exercises) ? body.exercises : [];
    const foods = Array.isArray(body.foods) ? body.foods : [];

    const prompt = `Você é um calculador nutricional preciso para o app NTRSL AI (pt-BR).

Use EXCLUSIVAMENTE as tabelas de referência abaixo para alimentos e exercícios conhecidos.
Se um item não existir na tabela, estime com base em dados nutricionais padrão e indique valores razoáveis.

REGRAS DE CÁLCULO:
- Alimentos: macros são por 100g; fator = quantidade_g / 100
- Água: quantidade informada está em LITROS; converta para ml (× 1000) antes do fator /100
- Exercícios: calorias = calorias_queimadas_por_minuto × duração em minutos
- Arredonde gastas, consumidas, proteina, carboidratos e gordura para 1 casa decimal
- exercicios: array de strings no formato "nome (X min)"
- alimentos: array de strings no formato "nome (X g)" ou "água (X L)" para água
- duracao: soma das durações dos exercícios em minutos

TABELA ALIMENTOS (por 100g, exceto água):
${JSON.stringify(caloriasData)}

TABELA EXERCÍCIOS (calorias/min):
${JSON.stringify(exerciciosData)}

ENTRADA:
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

    const summary = await generateJson<NutritionSummary>(prompt, 'NutritionSummary');

    return jsonResponse(summary);
  } catch (e) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});
