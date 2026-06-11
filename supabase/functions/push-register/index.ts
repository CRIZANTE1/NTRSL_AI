import { requireUser, getServiceClient } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  try {
    const user = await requireUser(req);
    const body = (await req.json()) as { fcm_token?: string; platform?: string };

    const fcmToken = body.fcm_token?.trim();
    const platform = body.platform?.trim();

    if (!fcmToken) {
      return jsonResponse({ error: 'fcm_token obrigatório.' }, 400);
    }
    if (!platform || !['android', 'ios', 'web'].includes(platform)) {
      return jsonResponse({ error: 'platform inválida.' }, 400);
    }

    const service = getServiceClient();
    const { error } = await service.from('push_tokens').upsert(
      {
        user_id: user.id,
        fcm_token: fcmToken,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,fcm_token' },
    );

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});
