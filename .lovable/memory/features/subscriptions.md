---
name: Subscription Plans
description: Paddle-based SaaS billing with Free/Basic/Pro tiers
type: feature
---
- Free: 20 products, single location, basic POS
- Basic ($15/mo, $150/yr): unlimited products, single location, full POS
- Pro ($39/mo, $390/yr): multi-location, reports, bank reconciliation
- KES not supported by Paddle; prices in USD
- Product IDs: free_plan, basic_plan, pro_plan
- Price IDs: basic_monthly, basic_yearly, pro_monthly, pro_yearly
- Subscription tab in Settings page
- useSubscription hook with realtime updates
- Edge functions: payments-webhook, get-paddle-price, customer-portal
