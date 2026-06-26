import { requireUser, getServiceClient } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { generateJson } from '../_shared/gemini.ts';

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

interface WeeklyCoachDay {
  logDate: string;
  dayLabel: string;
  hasLog: boolean;
  consumidas: number;
  gastas: number;
  proteina: number;
  duracaoMin: number;
  aguaLitros: number;
  alimentos: string[];
  exercicios: string[];
}

interface WeeklyCoachContext {
  anchorDate: string;
  days: WeeklyCoachDay[];
  totals: {
    diasComRegistro: number;
    mediaConsumidas: number;
    mediaGastas: number;
    totalMinutosExercicio: number;
    totalAguaLitros: number;
  };
}

interface ProfileGoals {
  kcal: number;
  proteina: number;
  carbs: number;
}

interface CoachRecommendationStructured {
  visaoSemanal: string;
  alimentos: string[];
  agua: string[];
  exercicios: string[];
  proximoPasso: string;
}

function formatRecommendation(s: CoachRecommendationStructured): string {
  const lines = [
    `Visão da semana\n${s.visaoSemanal}`,
    `Alimentos\n${s.alimentos.map((x) => `• ${x}`).join('\n')}`,
    `Água\n${s.agua.map((x) => `• ${x}`).join('\n')}`,
    `Exercícios\n${s.exercicios.map((x) => `• ${x}`).join('\n')}`,
    `Próximo passo\n${s.proximoPasso}`,
  ];
  return lines.join('\n\n');
}

function normalizeList(items: unknown, fallback: string): string[] {
  if (!Array.isArray(items)) return [fallback];
  const cleaned = items.map((x) => String(x).trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : [fallback];
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
      logDate?: string;
      weeklyContext?: WeeklyCoachContext;
      profileGoals?: ProfileGoals;
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
    const logDate = body.logDate ?? 'hoje';
    const weekly = body.weeklyContext;
    const profile = body.profileGoals ?? { kcal: 2000, proteina: 50, carbs: 250 };

    const prompt = `Você é um coach de saúde e nutrição do app NTRSL AI. Responda em português (pt-BR), tom acolhedor e prático.

METAS DO USUÁRIO (texto):
${goals}

METAS NUMÉRICAS DIÁRIAS:
- Calorias: ${profile.kcal} kcal
- Proteína: ${profile.proteina} g
- Carboidratos: ${profile.carbs} g

DIA EM FOCO (${logDate}):
- Calorias gastas: ${r.gastas} kcal
- Calorias consumidas: ${r.consumidas} kcal
- Balanço: ${balanco} kcal
- Exercícios (${r.duracao} min): ${r.exercicios.join(', ') || 'nenhum'}
- Alimentos: ${r.alimentos.join(', ') || 'nenhum'}
- Macros: P ${r.proteina}g | C ${r.carboidratos}g | G ${r.gordura}g

CONTEXTO SEMANAL (últimos 7 dias, JSON):
${JSON.stringify(weekly ?? { days: [], totals: {} })}

INSTRUÇÕES:
1. Analise o PADRÃO DA SEMANA (dias com registro, médias, gaps, consistência de água e exercício).
2. Compare o dia em foco com a média semanal e as metas numéricas.
3. Retorne JSON estruturado — cada lista com 2 a 4 itens concretos e acionáveis.
4. "agua": incluir meta diária em litros, observação da semana e dica prática (ex.: horários).
5. "alimentos": sugestões específicas (incluir proteína, refeições, ajustes vs meta kcal).
6. "exercicios": tipos, frequência e duração sugeridos com base no histórico semanal.
7. Não prescreva medicamentos. Não invente alimentos que o usuário nunca registrou sem marcar como sugestão nova.

Retorne APENAS JSON:
{
  "visaoSemanal": "string — 2-3 frases sobre tendência da semana",
  "alimentos": ["string", "..."],
  "agua": ["string", "..."],
  "exercicios": ["string", "..."],
  "proximoPasso": "string — uma ação clara para hoje ou amanhã"
}`;

    let structured = await generateJson<CoachRecommendationStructured>(prompt, 'CoachRecommendation');

    structured = {
      visaoSemanal: structured.visaoSemanal?.trim() || 'Continue registrando seu dia para acompanhar a evolução semanal.',
      alimentos: normalizeList(structured.alimentos, 'Mantenha refeições equilibradas com proteína em cada refeição principal.'),
      agua: normalizeList(structured.agua, 'Beba água ao longo do dia — meta comum: 2 L/dia, ajuste conforme seu peso e atividade.'),
      exercicios: normalizeList(structured.exercicios, 'Inclua ao menos 30 min de atividade moderada nos dias em que não treinou esta semana.'),
      proximoPasso: structured.proximoPasso?.trim() || 'Registre a próxima refeição e a ingestão de água ainda hoje.',
    };

    const recommendation = formatRecommendation(structured);

    await service.from('ai_usage').upsert({
      user_id: user.id,
      last_request_at: new Date().toISOString(),
    });

    const elapsedSeconds = Math.round((performance.now() - started) / 100) / 10;
    return jsonResponse({ recommendation, structured, elapsedSeconds });
  } catch (e) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});
