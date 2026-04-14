---
name: Feature gating rules
description: Subscription tier restrictions and masquerade mode
type: feature
---
## Tier Limits
- Free: max 20 products, 1 location, no reports/banking/chart-of-accounts
- Basic: unlimited products, 1 location, no reports/banking/chart-of-accounts
- Pro: unlimited products, unlimited locations, full access

## Implementation
- `FeatureGate` component wraps route content requiring a tier
- `useFeatureLimit` hook exposes maxProducts, maxLocations, canAccessReports etc
- Sidebar shows Lock icon on tier-restricted nav items
- Products page disables "Add Product" button at limit

## Masquerade Mode
- Super admin clicks "View as" on a business in Super Admin > Businesses
- Stores `masquerade_business_id` in localStorage
- BusinessContext loads that business instead of the user's own
- Yellow banner in AppLayout with "Exit" button to stop masquerading
- Super admin gets full admin access while masquerading
