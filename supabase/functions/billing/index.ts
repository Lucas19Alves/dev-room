import { authenticate, config, cors, json, safeFailure, stripe } from "../_shared/http.ts";
import { checkoutPrice, verifyPrice } from "../_shared/billing.js";

Deno.serve(async (request) => {
  let headers: Record<string,string> = {};
  try {
    headers = cors(request);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, headers);
    const { client, user } = await authenticate(request);
    const input = await request.json();
    if (!["checkout", "portal"].includes(input.action)) throw new Error("invalid_action");
    const { data: existing, error: lookupError } = await client.from("billing_customers").select("stripe_customer_id").eq("user_id",user.id).maybeSingle();
    if (lookupError) throw new Error("service_unavailable");
    let customerId = existing?.stripe_customer_id;
    const site = new URL(config("NOMA_SITE_URL")).origin;
    if (input.action === "portal") {
      if (!customerId) throw new Error("invalid_customer");
      const session = await stripe("billing_portal/sessions", "POST", new URLSearchParams({ customer: customerId, return_url: `${site}/app?view=settings` }));
      return json({ url: session.url }, 200, headers);
    }
    const interval = input.interval || "month";
    const priceId = checkoutPrice(interval, { month: config("STRIPE_PRICE_MONTHLY"), year: config("STRIPE_PRICE_YEARLY") });
    verifyPrice(await stripe(`prices/${encodeURIComponent(priceId)}`), interval);
    if (!customerId) {
      const customer = await stripe("customers", "POST", new URLSearchParams({ email: user.email!, "metadata[noma_user_id]": user.id }), `noma-customer-${user.id}`);
      const { error } = await client.from("billing_customers").upsert({ user_id: user.id, stripe_customer_id: customer.id }, { onConflict: "user_id", ignoreDuplicates: true });
      if (error) throw new Error("service_unavailable");
      const { data: stored, error: storedError } = await client.from("billing_customers").select("stripe_customer_id").eq("user_id",user.id).single();
      if (storedError) throw new Error("service_unavailable");
      customerId = stored.stripe_customer_id;
    }
    // Query Stripe as well as our webhook-derived table to avoid duplicate paid
    // subscriptions when the user returns before webhook delivery.
    const subscriptions = await stripe(`subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=100`);
    if (subscriptions.data.some((item: { status: string }) => ["active","trialing","past_due","unpaid","incomplete","paused"].includes(item.status))) {
      const portal = await stripe("billing_portal/sessions", "POST", new URLSearchParams({ customer: customerId, return_url: `${site}/app?view=settings` }));
      return json({ url: portal.url, action: "portal" }, 200, headers);
    }
    const session = await stripe("checkout/sessions", "POST", new URLSearchParams({
      mode: "subscription", customer: customerId,
      "line_items[0][price]": priceId, "line_items[0][quantity]": "1",
      client_reference_id: user.id, "subscription_data[metadata][noma_user_id]": user.id,
      success_url: `${site}/app?billing=success`, cancel_url: `${site}/app?billing=cancelled`,
    }), `noma-checkout-${user.id}-${interval}-${Math.floor(Date.now()/1800000)}`);
    return json({ url: session.url }, 200, headers);
  } catch (error) { return safeFailure(error, headers); }
});
