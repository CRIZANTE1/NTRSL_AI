import { supabase } from './supabase';

export type AuditAction =
  | 'users.update'
  | 'users.create'
  | 'auth.signout'
  | 'nutrition.summary'
  | 'ai.recommendation';

export async function logAuditEvent(params: {
  organization_id: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: AuditAction;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const actor_email = params.actor_email ?? null;
  if (!actor_email) return;

  await (supabase as any).from('security_audit_events').insert({
    organization_id: params.organization_id,
    kind: 'action',
    actor_user_id: params.actor_user_id,
    actor_email,
    actor_role: params.actor_role ?? null,
    action: params.action,
    entity_type: params.entity_type ?? null,
    entity_id: params.entity_id ?? null,
    severity: null,
    message: null,
    stack: null,
    route: null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    metadata: params.metadata ?? null,
  });
}

export async function logCriticalError(params: {
  organization_id: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  message: string;
  stack?: string | null;
  route?: string | null;
  severity?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const actor_email = params.actor_email ?? null;
  if (!actor_email) return;

  await (supabase as any).from('security_audit_events').insert({
    organization_id: params.organization_id,
    kind: 'critical_error',
    actor_user_id: params.actor_user_id,
    actor_email,
    actor_role: params.actor_role ?? null,
    action: null,
    entity_type: null,
    entity_id: null,
    severity: params.severity ?? 'critical',
    message: params.message,
    stack: params.stack ?? null,
    route: params.route ?? null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    metadata: params.metadata ?? null,
  });
}

