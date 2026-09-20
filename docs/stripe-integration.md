# Noma Stripe integration

## Product plan

Noma sells access to its own SaaS, so this is a first-party subscription flow, not Stripe Connect. Keep the existing Free tier and offer one Noma Pro product with two recurring BRL prices:

- Monthly: R$ 19 (`1900` minor units).
- Annual: R$ 190 (`19000` minor units), a R$ 38 saving against twelve monthly payments.

The user chooses a billing interval in Noma. A Supabase Edge Function authenticates the account, resolves the server-owned Stripe Price ID, creates or reuses the Stripe Customer, prevents a second active subscription, and returns a hosted Checkout URL. Checkout owns payment-data collection. Subscription and invoice webhooks remain the source of truth for access; the browser's return URL is only a navigation state.

Use Stripe Billing with hosted Checkout for subscriptions and the Stripe Customer Portal for cancellation, payment-method changes, and invoice history. Stripe automatically creates an invoice for each subscription billing cycle. Enable invoice history in the Customer Portal configuration in Stripe Dashboard so customers can retrieve their receipts/invoices. Do not create a second invoice store in Noma unless a product requirement calls for a first-party invoice list.

## Tax decision

Do not enable `automatic_tax` for the current Brazil-based business. Stripe Tax's current supported-country table does not list Brazil as a supported business location. Stripe Tax also requires the business to have an active registration in each jurisdiction before it calculates and collects tax. Revisit this only after confirming the business's tax obligations and Stripe's supported jurisdictions with an accountant; foreign-market tax may need a separately scoped decision. The current flow must not imply that Stripe Tax is collecting Brazilian taxes.

## Data and trust boundaries

- Supabase Auth identifies the signed-in Noma user.
- `billing_customers` maps that user to a Stripe Customer; the browser cannot write the mapping.
- `subscriptions` and the private `billing_events` receipt ledger are updated only by the signed webhook function.
- `get_my_entitlements()` returns the account's derived plan to the signed-in user. Client-side plan state is never authoritative.
- Stripe secret and webhook signing keys belong only in Supabase Edge Function secrets. Use separate sandbox and live credentials; prefer a least-privilege restricted key. Never place them in Vite variables, source files, `.env` files committed to Git, browser storage, or logs.

## Required Stripe and Supabase setup

1. Create a Stripe sandbox for development and a separate live environment.
2. In each environment, create the Noma Pro product and monthly/yearly recurring BRL prices above; store the resulting Price IDs in the matching Supabase environment.
3. Configure Customer Portal subscription management and invoice history.
4. Register `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` as the webhook destination. Subscribe to `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`.
5. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, and `NOMA_SITE_URL` as Supabase Edge Function secrets. `SUPABASE_SERVICE_ROLE_KEY` remains a Supabase-managed server secret.
6. Test signup, initial payment, renewal, failed renewal, cancellation, portal access, and idempotent webhook retries in the sandbox before enabling live prices.

## Current implementation and remaining checks

The repository already has hosted subscription Checkout, Customer Portal redirects, server-side price validation, signed webhook verification, event idempotency, subscription snapshots, and server-derived entitlements. This iteration moves Stripe requests to the official server SDK, updates the Stripe API version, adds the required Checkout integration identifier, and handles asynchronous Checkout completion/failure events. The project does not include Stripe credentials or Price IDs, so no live or sandbox Stripe objects were created and end-to-end payment behavior cannot be verified yet.

Before production, run the Edge Functions in the Supabase Edge Runtime and validate the SDK/API version and event payloads against a Stripe sandbox, check webhook replay and out-of-order delivery, and confirm the Customer Portal invoice-history setting. This workspace has no local Deno or Supabase CLI, so that runtime validation remains outstanding. Do not add automatic tax until supported business location, product tax code, and active registrations are confirmed.
