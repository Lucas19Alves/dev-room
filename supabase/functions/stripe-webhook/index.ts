import { admin, config, json, safeFailure, stripe } from "../_shared/http.ts";
import { subscriptionSnapshot, verifyStripeSignature } from "../_shared/billing.js";

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let event;
  try { event = await verifyStripeSignature(await request.text(), request.headers.get("stripe-signature"), config("STRIPE_WEBHOOK_SECRET")); }
  catch { return json({ error: "invalid_signature" }, 400); }
  try {
    const supported = ["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.paid", "invoice.payment_failed", "checkout.session.completed"];
    if (!supported.includes(event.type)) return json({ received: true });
    const object = event.data.object;
    const subscriptionId = event.type.startsWith("customer.subscription.") ? object.id : typeof object.subscription === "string" ? object.subscription : object.subscription?.id || object.parent?.subscription_details?.subscription;
    if (!subscriptionId) return json({ received: true });
    // Fetch current state to tolerate delivery retries and out-of-order events.
    const subscription = await stripe(`subscriptions/${encodeURIComponent(subscriptionId)}`);
    const snapshot = subscriptionSnapshot(subscription, [config("STRIPE_PRICE_MONTHLY"),config("STRIPE_PRICE_YEARLY")]);
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const { error } = await admin().rpc("apply_billing_event", {
      event_id: event.id, event_type: event.type, event_created: event.created,
      customer_id: customerId, subscription: snapshot,
    });
    if (error) throw new Error("billing_update_failed");
    return json({ received: true });
  } catch(error) { return safeFailure(error); }
});
