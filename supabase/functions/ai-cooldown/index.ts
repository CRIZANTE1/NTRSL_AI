import { requireUser, getServiceClient } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

const COOLDOWN_SECONDS = 30 * 60;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  try {
    const user = await requireUser(req);
    const service = getServiceClient();

    const { data: usage } = await service
      .from('ai_usage')
      .select('last_request_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!usage?.last_request_at) {
      return jsonResponse({ remainingSeconds: 0, allowed: true });
    }

    const elapsed = (Date.now() - new Date(usage.last_request_at).getTime()) / 1000;
    const remainingSeconds = Math.max(0, Math.ceil(COOLDOWN_SECONDS - elapsed));

    return jsonResponse({
      remainingSeconds,
      allowed: remainingSeconds === 0,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});
