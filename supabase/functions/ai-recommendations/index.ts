import { requireUser, getServiceClient } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getGeminiModel } from '../_shared/gemini.ts';

const COOLDOWN_SECONDS = 30 * 60;

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

  const started = performance.now();

  try {
    const user = await requireUser(req);
    const body = (await req.json()) as {
      resumo?: NutritionSummary;
      userGoals?: string;
    };

    if (!body.resumo) {
      return jsonResponse({ error: 'Resumo nutricional obrigatório.' }, 400);
    }

    const service = getServiceClient();
    const { data: usage } = await service
      .from('ai_usage')
      .select('last_request_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (usage?.last_request_at) {
      const elapsed = (Date.now() - new Date(usage.last_request_at).getTime()) / 1000;
      if (elapsed < COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COOLDOWN_SECONDS - elapsed);
        return jsonResponse(
          { error: `Aguarde ${remaining}s antes de nova recomendação (cooldown).` },
          429,
        );
      }
    }

    const goals = (body.userGoals ?? '').trim() || 'Melhorar hábitos de saúde e bem-estar.';
    const r = body.resumo;
    const balanco = Math.round((r.consumidas - r.gastas) * 10) / 10;

    const prompt = `Você é um coach de saúde e nutrição do app NTRSL AI. Responda em português (pt-BR), de forma acolhedora e prática.

DADOS DO DIA:
- Calorias gastas (exercícios): ${r.gastas} kcal
- Calorias consumidas: ${r.consumidas} kcal
- Balanço: ${balanco} kcal
- Duração total de exercícios: ${r.duracao} min
- Exercícios: ${r.exercicios.join(', ') || 'nenhum'}
- Alimentos: ${r.alimentos.join(', ') || 'nenhum'}
- Proteína: ${r.proteina}g | Carboidratos: ${r.carboidratos}g | Gordura: ${r.gordura}g

METAS DO USUÁRIO:
${goals}

Forneça recomendações personalizadas em 3–5 parágrafos curtos: análise do dia, sugestões alimentares e de atividade, e um próximo passo concreto. Não prescreva medicamentos.`;

    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const recommendation = result.response.text()?.trim();

    if (!recommendation) {
      return jsonResponse({ error: 'Falha na API Gemini.' }, 502);
    }

    await service.from('ai_usage').upsert({
      user_id: user.id,
      last_request_at: new Date().toISOString(),
    });

    const elapsedSeconds = Math.round((performance.now() - started) / 100) / 10;
    return jsonResponse({ recommendation, elapsedSeconds });
  } catch (e) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});
