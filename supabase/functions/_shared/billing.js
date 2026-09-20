// Pure helpers shared by Edge Functions and the Node test suite.
// Stripe signs the exact raw body. Do not parse/stringify before verification.
export async function verifyStripeSignature(body, header, secret, now = Date.now()) {
  if (!secret || !header || body.length > 1_000_000) throw new Error("invalid_signature");
  const entries = header.split(",").map((part) => part.trim().split("="));
  const timestamp = entries.find(([key]) => key === "t")?.[1];
  const signatures = entries.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!/^\d+$/.test(timestamp || "") || Math.abs(now / 1000 - Number(timestamp)) > 300) throw new Error("invalid_signature");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const payload = new TextEncoder().encode(`${timestamp}.${body}`);
  for (const signature of signatures) {
    if (!/^[a-f0-9]{64}$/i.test(signature || "")) continue;
    const bytes = Uint8Array.from(signature.match(/../g), (hex) => parseInt(hex, 16));
    if (await crypto.subtle.verify("HMAC", key, bytes, payload)) return JSON.parse(body);
  }
  throw new Error("invalid_signature");
}

export function subscriptionSnapshot(subscription, allowedPriceIds) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  if (!subscription.id || !allowedPriceIds.includes(priceId)) throw new Error("unrecognized_price");
  const end = subscription.current_period_end || subscription.items?.data?.[0]?.current_period_end;
  return {
    id: subscription.id,
    status: subscription.status,
    priceId,
    currentPeriodEnd: end ? new Date(end * 1000).toISOString() : null,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  };
}

export function checkoutPrice(interval, prices) {
  if (!['month', 'year'].includes(interval)) throw new Error("invalid_interval");
  const id = prices[interval];
  if (!id || !/^price_[A-Za-z0-9]+$/.test(id)) throw new Error("billing_unavailable");
  return id;
}

export function checkoutIntegrationIdentifier(random = crypto.getRandomValues(new Uint8Array(8))) {
  const suffix = Array.from(random, (byte) => String.fromCharCode(97 + (byte % 26))).join("");
  return `noma_checkout_${suffix}`;
}

export function verifyPrice(price, interval) {
  const expected = interval === "year" ? 19000 : 1900;
  if (!price.active || price.currency !== "brl" || price.unit_amount !== expected || price.recurring?.interval !== interval || price.recurring?.interval_count !== 1)
    throw new Error("billing_price_mismatch");
}

export function allowedOrigin(origin, siteUrl) {
  try {
    const site = new URL(siteUrl);
    if (site.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(site.hostname)) return false;
    return new URL(origin).origin === site.origin;
  } catch { return false; }
}
