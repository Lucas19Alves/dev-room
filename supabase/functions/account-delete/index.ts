import { authenticate, cors, json, safeFailure, stripe } from "../_shared/http.ts";

Deno.serve(async (request) => {
  let headers: Record<string,string> = {};
  try {
    headers = cors(request);
    if (request.method === "OPTIONS") return new Response(null, {status:204,headers});
    if (request.method !== "POST") return json({ error: "method_not_allowed" },405,headers);
    const { client, user, token } = await authenticate(request);
    const input = await request.json();
    if (input.confirmation !== "EXCLUIR MINHA CONTA") throw new Error("invalid_confirmation");
    const { data: billing, error } = await client.from("billing_customers").select("stripe_customer_id").eq("user_id",user.id).maybeSingle();
    if(error) throw new Error("service_unavailable");
    if(billing) {
      const subscriptions = await stripe(`subscriptions?customer=${encodeURIComponent(billing.stripe_customer_id)}&status=all&limit=100`);
      for(const subscription of subscriptions.data) {
        if(!["canceled","incomplete_expired"].includes(subscription.status)) await stripe(`subscriptions/${encodeURIComponent(subscription.id)}`,"DELETE");
      }
    }
    // Revoke refresh sessions before deleting. Residual access JWTs are also
    // denied by the ownership/exists checks in account RPCs after deletion.
    const signedOut = await client.auth.admin.signOut(token,"global");
    if(signedOut.error) throw new Error("session_revoke_failed");
    const deleted = await client.auth.admin.deleteUser(user.id);
    if(deleted.error) throw new Error("account_delete_failed");
    return json({ deleted:true },200,headers);
  } catch(error) { return safeFailure(error,headers); }
});
