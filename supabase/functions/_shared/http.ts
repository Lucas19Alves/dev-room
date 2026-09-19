import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { allowedOrigin } from "./billing.js";

export function config(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error("service_unavailable");
  return value;
}
export function admin() {
  return createClient(config("SUPABASE_URL"), config("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
}
export function cors(request: Request) {
  const origin = request.headers.get("origin") || "";
  if (!allowedOrigin(origin, config("NOMA_SITE_URL"))) throw new Error("forbidden_origin");
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}
export function json(body: unknown, status = 200, headers: Record<string,string> = {}) {
  return Response.json(body, { status, headers: { ...headers, "Cache-Control": "no-store" } });
}
export async function authenticate(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!token) throw new Error("authentication_required");
  const client = admin();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user || !data.user.email_confirmed_at) throw new Error("authentication_required");
  return { client, user: data.user, token };
}
export async function stripe(path: string, method = "GET", body?: URLSearchParams, idempotencyKey?: string) {
  const headers: Record<string,string> = { Authorization: `Bearer ${config("STRIPE_SECRET_KEY")}`, "Stripe-Version": "2025-02-24.acacia" };
  if (body) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await fetch(`https://api.stripe.com/v1/${path}`, { method, headers, body, signal: AbortSignal.timeout(15000) });
  const result = await response.json();
  if (!response.ok) throw new Error("payment_service_unavailable");
  return result;
}
export function safeFailure(error: unknown, headers: Record<string,string> = {}) {
  const code = error instanceof Error ? error.message : "service_unavailable";
  const status = code === "authentication_required" ? 401 : code === "forbidden_origin" ? 403 : code.startsWith("invalid_") ? 400 : 503;
  // Details remain server-side; responses never return SDK, database or secret data.
  console.error("Noma request failed", { code });
  return json({ error: status === 401 ? "authentication_required" : status === 403 ? "request_not_allowed" : "service_unavailable" }, status, headers);
}
