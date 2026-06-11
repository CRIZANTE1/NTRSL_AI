import { createClient, type User } from 'npm:@supabase/supabase-js@2';

export async function requireUser(req: Request): Promise<User> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ error: 'Token ausente.' }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnon) {
    throw new Response(JSON.stringify({ error: 'Supabase não configurado no servidor.' }), {
      status: 500,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: 'Token inválido ou expirado.' }), { status: 401 });
  }

  return data.user;
}

export function getServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    throw new Response(JSON.stringify({ error: 'Service role não configurada.' }), { status: 500 });
  }
  return createClient(supabaseUrl, serviceKey);
}
