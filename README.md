# BlackRoad Feature Flags

Feature flag service for toggles, gradual rollouts, A/B testing, and user targeting.

## Live

- **Dashboard**: https://blackroad-flags.amundsonalexa.workers.dev
- **API**: https://blackroad-flags.amundsonalexa.workers.dev/api/flags

## Features

- **Boolean Flags** - Simple on/off toggles
- **Percentage Rollouts** - Gradual feature releases
- **A/B Variants** - Multi-variant experiments
- **User Targeting** - Rules based on user attributes
- **Consistent Hashing** - Same user gets same variant
- **Multi-environment** - Production, staging, development

## Flag Types

| Type | Description | Example |
|------|-------------|---------|
| `boolean` | Simple on/off | Dark mode |
| `percentage` | Gradual rollout | 25% of users |
| `variant` | A/B testing | Control vs Variant A |
| `targeting` | Rule-based | Beta for @company.com |

## API

### GET /api/flags
List all flags.

### GET /api/flags/:id
Get a single flag.

### PUT /api/flags/:id
Update flag (enable/disable, change rollout).

### POST /api/evaluate
Evaluate a flag for a user context.

```json
{
  "flag": "beta-features",
  "context": {
    "userId": "usr_123",
    "email": "user@blackroad.io",
    "plan": "enterprise"
  }
}
```

Response:
```json
{
  "flag": "beta-features",
  "enabled": true
}
```

### POST /api/evaluate-all
Evaluate all flags for a context.

## Targeting Operators

| Operator | Description |
|----------|-------------|
| `equals` | Exact match |
| `contains` | Substring match |
| `startsWith` | Prefix match |
| `endsWith` | Suffix match |
| `in` | Value in list |
| `greaterThan` | Numeric comparison |
| `lessThan` | Numeric comparison |

## SDK Usage

```typescript
const flags = await fetch('https://blackroad-flags.../api/evaluate-all', {
  method: 'POST',
  body: JSON.stringify({ context: { userId: user.id, email: user.email } })
}).then(r => r.json());

if (flags['new-dashboard'].enabled) {
  showNewDashboard();
}
```

## Development

```bash
npm install
npm run dev      # Local development
npm run deploy   # Deploy to Cloudflare
```

## License

Proprietary - BlackRoad OS, Inc.
