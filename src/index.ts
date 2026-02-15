// BlackRoad Feature Flags Service
// Toggle features, gradual rollouts, A/B testing

interface Env {
  ENVIRONMENT: string;
}

interface Flag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'boolean' | 'percentage' | 'variant' | 'targeting';
  value: any;
  variants?: { id: string; name: string; weight: number }[];
  targeting?: { attribute: string; operator: string; value: string; result: any }[];
  rolloutPercentage?: number;
  environments: string[];
  createdAt: string;
  updatedAt: string;
  evaluations: number;
}

// Demo flags
const flags: Map<string, Flag> = new Map([
  ['dark-mode', {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Enable dark mode UI',
    enabled: true,
    type: 'boolean',
    value: true,
    environments: ['production', 'staging', 'development'],
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-10T14:30:00Z',
    evaluations: 45231,
  }],
  ['new-dashboard', {
    id: 'new-dashboard',
    name: 'New Dashboard',
    description: 'Gradual rollout of redesigned dashboard',
    enabled: true,
    type: 'percentage',
    value: true,
    rolloutPercentage: 25,
    environments: ['production', 'staging'],
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-14T16:00:00Z',
    evaluations: 12453,
  }],
  ['checkout-flow', {
    id: 'checkout-flow',
    name: 'Checkout Flow',
    description: 'A/B test checkout variants',
    enabled: true,
    type: 'variant',
    value: null,
    variants: [
      { id: 'control', name: 'Original', weight: 50 },
      { id: 'variant-a', name: 'One-Page Checkout', weight: 25 },
      { id: 'variant-b', name: 'Express Checkout', weight: 25 },
    ],
    environments: ['production'],
    createdAt: '2026-02-05T11:00:00Z',
    updatedAt: '2026-02-13T10:00:00Z',
    evaluations: 8934,
  }],
  ['beta-features', {
    id: 'beta-features',
    name: 'Beta Features',
    description: 'Enable beta features for specific users',
    enabled: true,
    type: 'targeting',
    value: false,
    targeting: [
      { attribute: 'email', operator: 'endsWith', value: '@blackroad.io', result: true },
      { attribute: 'plan', operator: 'equals', value: 'enterprise', result: true },
      { attribute: 'userId', operator: 'in', value: 'usr_123,usr_456', result: true },
    ],
    environments: ['production', 'staging'],
    createdAt: '2026-02-08T14:00:00Z',
    updatedAt: '2026-02-15T02:00:00Z',
    evaluations: 3421,
  }],
  ['ai-assistant', {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Enable AI-powered assistant',
    enabled: false,
    type: 'boolean',
    value: false,
    environments: ['development'],
    createdAt: '2026-02-12T16:00:00Z',
    updatedAt: '2026-02-12T16:00:00Z',
    evaluations: 234,
  }],
]);

// Hash function for consistent percentage rollouts
function hashUserId(userId: string, flagId: string): number {
  let hash = 0;
  const str = userId + flagId;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % 100;
}

// Evaluate flag for a user context
function evaluateFlag(flag: Flag, context: any): { enabled: boolean; variant?: string } {
  if (!flag.enabled) {
    return { enabled: false };
  }

  flag.evaluations++;

  switch (flag.type) {
    case 'boolean':
      return { enabled: flag.value };

    case 'percentage':
      const userId = context.userId || context.sessionId || Math.random().toString();
      const hash = hashUserId(userId, flag.id);
      return { enabled: hash < (flag.rolloutPercentage || 0) };

    case 'variant':
      if (!flag.variants?.length) return { enabled: false };
      const variantHash = hashUserId(context.userId || Math.random().toString(), flag.id);
      let cumulative = 0;
      for (const variant of flag.variants) {
        cumulative += variant.weight;
        if (variantHash < cumulative) {
          return { enabled: true, variant: variant.id };
        }
      }
      return { enabled: true, variant: flag.variants[0].id };

    case 'targeting':
      if (!flag.targeting?.length) return { enabled: flag.value };
      for (const rule of flag.targeting) {
        const attrValue = context[rule.attribute];
        if (!attrValue) continue;

        let matches = false;
        switch (rule.operator) {
          case 'equals': matches = attrValue === rule.value; break;
          case 'contains': matches = attrValue.includes(rule.value); break;
          case 'startsWith': matches = attrValue.startsWith(rule.value); break;
          case 'endsWith': matches = attrValue.endsWith(rule.value); break;
          case 'in': matches = rule.value.split(',').includes(attrValue); break;
          case 'greaterThan': matches = Number(attrValue) > Number(rule.value); break;
          case 'lessThan': matches = Number(attrValue) < Number(rule.value); break;
        }
        if (matches) return { enabled: rule.result };
      }
      return { enabled: flag.value };

    default:
      return { enabled: flag.value };
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BlackRoad Feature Flags</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #000; color: #fff; min-height: 100vh; }
    .header { background: linear-gradient(135deg, #111 0%, #000 100%); border-bottom: 1px solid #333; padding: 21px 34px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 21px; font-weight: bold; background: linear-gradient(135deg, #F5A623 0%, #FF1D6C 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .btn { padding: 10px 21px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
    .btn:hover { transform: scale(1.05); }
    .btn-primary { background: linear-gradient(135deg, #FF1D6C 0%, #9C27B0 100%); color: #fff; }
    .container { max-width: 1200px; margin: 0 auto; padding: 34px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 21px; margin-bottom: 34px; }
    .stat-card { background: #111; border: 1px solid #333; border-radius: 13px; padding: 21px; text-align: center; }
    .stat-value { font-size: 34px; font-weight: bold; background: linear-gradient(135deg, #FF1D6C 0%, #F5A623 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-label { color: #888; font-size: 13px; margin-top: 8px; }
    .section-title { font-size: 21px; margin-bottom: 21px; display: flex; align-items: center; gap: 8px; }
    .section-title span { color: #FF1D6C; }
    .flags-list { display: flex; flex-direction: column; gap: 13px; }
    .flag-card { background: #111; border: 1px solid #333; border-radius: 13px; padding: 21px; transition: border-color 0.2s; }
    .flag-card:hover { border-color: #FF1D6C; }
    .flag-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 13px; }
    .flag-name { font-size: 18px; font-weight: 600; }
    .flag-toggle { position: relative; width: 50px; height: 26px; }
    .flag-toggle input { opacity: 0; width: 0; height: 0; }
    .flag-toggle .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #333; border-radius: 26px; transition: 0.3s; }
    .flag-toggle .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background: #666; border-radius: 50%; transition: 0.3s; }
    .flag-toggle input:checked + .slider { background: linear-gradient(135deg, #FF1D6C 0%, #9C27B0 100%); }
    .flag-toggle input:checked + .slider:before { transform: translateX(24px); background: #fff; }
    .flag-desc { color: #888; font-size: 14px; margin-bottom: 13px; }
    .flag-meta { display: flex; gap: 21px; flex-wrap: wrap; font-size: 13px; }
    .flag-meta-item { display: flex; gap: 8px; align-items: center; }
    .flag-meta-label { color: #666; }
    .flag-type { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .flag-type.boolean { background: #2979FF22; color: #2979FF; }
    .flag-type.percentage { background: #10B98122; color: #10B981; }
    .flag-type.variant { background: #9C27B022; color: #9C27B0; }
    .flag-type.targeting { background: #F5A62322; color: #F5A623; }
    .variants { display: flex; gap: 8px; margin-top: 13px; flex-wrap: wrap; }
    .variant { background: #222; padding: 6px 12px; border-radius: 6px; font-size: 12px; }
    .variant-weight { color: #FF1D6C; margin-left: 8px; }
    .targeting-rules { margin-top: 13px; background: #0a0a0a; border-radius: 8px; padding: 13px; }
    .rule { display: flex; gap: 8px; align-items: center; padding: 6px 0; font-size: 12px; font-family: monospace; }
    .rule-attr { color: #2979FF; }
    .rule-op { color: #888; }
    .rule-val { color: #10B981; }
    .rule-result { color: #F5A623; }
    .rollout-bar { height: 8px; background: #222; border-radius: 4px; margin-top: 13px; overflow: hidden; }
    .rollout-fill { height: 100%; background: linear-gradient(90deg, #10B981 0%, #2979FF 100%); border-radius: 4px; }
    .footer { border-top: 1px solid #333; padding: 21px 34px; text-align: center; color: #666; font-size: 13px; }
    .footer a { color: #FF1D6C; text-decoration: none; }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <header class="header">
    <div class="logo">BlackRoad Feature Flags</div>
    <button class="btn btn-primary" onclick="showCreate()">+ Create Flag</button>
  </header>
  <div class="container">
    <div class="stats-grid" id="stats"></div>
    <h2 class="section-title"><span>//</span> Feature Flags</h2>
    <div class="flags-list" id="flags-list"></div>
  </div>
  <footer class="footer">
    <p>Powered by <a href="https://blackroad.io">BlackRoad OS</a> &bull; <a href="https://blackroad-dev-portal.amundsonalexa.workers.dev">Developer Portal</a></p>
  </footer>
  <script>
    async function loadFlags() {
      const resp = await fetch('/api/flags');
      const data = await resp.json();
      const enabled = data.flags.filter(f => f.enabled).length;
      const evals = data.flags.reduce((s, f) => s + f.evaluations, 0);

      document.getElementById('stats').innerHTML = \`
        <div class="stat-card"><div class="stat-value">\${data.flags.length}</div><div class="stat-label">Total Flags</div></div>
        <div class="stat-card"><div class="stat-value">\${enabled}</div><div class="stat-label">Enabled</div></div>
        <div class="stat-card"><div class="stat-value">\${(evals/1000).toFixed(1)}K</div><div class="stat-label">Evaluations</div></div>
        <div class="stat-card"><div class="stat-value">4</div><div class="stat-label">Types</div></div>
      \`;

      document.getElementById('flags-list').innerHTML = data.flags.map(f => \`
        <div class="flag-card">
          <div class="flag-header">
            <div style="display:flex;align-items:center;gap:13px;">
              <span class="flag-name">\${f.name}</span>
              <span class="flag-type \${f.type}">\${f.type}</span>
            </div>
            <label class="flag-toggle">
              <input type="checkbox" \${f.enabled ? 'checked' : ''} onchange="toggleFlag('\${f.id}', this.checked)">
              <span class="slider"></span>
            </label>
          </div>
          <p class="flag-desc">\${f.description}</p>
          \${f.type === 'percentage' ? \`
            <div class="rollout-bar"><div class="rollout-fill" style="width:\${f.rolloutPercentage}%"></div></div>
            <div style="font-size:12px;color:#888;margin-top:8px;">\${f.rolloutPercentage}% rollout</div>
          \` : ''}
          \${f.type === 'variant' && f.variants ? \`
            <div class="variants">\${f.variants.map(v => \`<span class="variant">\${v.name}<span class="variant-weight">\${v.weight}%</span></span>\`).join('')}</div>
          \` : ''}
          \${f.type === 'targeting' && f.targeting ? \`
            <div class="targeting-rules">\${f.targeting.map(r => \`<div class="rule"><span class="rule-attr">\${r.attribute}</span><span class="rule-op">\${r.operator}</span><span class="rule-val">"\${r.value}"</span><span class="rule-op">=></span><span class="rule-result">\${r.result}</span></div>\`).join('')}</div>
          \` : ''}
          <div class="flag-meta">
            <div class="flag-meta-item"><span class="flag-meta-label">ID:</span><span style="font-family:monospace">\${f.id}</span></div>
            <div class="flag-meta-item"><span class="flag-meta-label">Evaluations:</span><span>\${f.evaluations.toLocaleString()}</span></div>
            <div class="flag-meta-item"><span class="flag-meta-label">Envs:</span><span>\${f.environments.join(', ')}</span></div>
          </div>
        </div>
      \`).join('');
    }

    async function toggleFlag(id, enabled) {
      await fetch('/api/flags/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      loadFlags();
    }

    function showCreate() { alert('Create flag modal coming soon!'); }
    loadFlags();
  </script>
</body>
</html>`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // List all flags
    if (url.pathname === '/api/flags' && method === 'GET') {
      return Response.json({ flags: Array.from(flags.values()) }, { headers: corsHeaders });
    }

    // Get single flag
    if (url.pathname.match(/^\/api\/flags\/[\w-]+$/) && method === 'GET') {
      const id = url.pathname.split('/').pop()!;
      const flag = flags.get(id);
      if (!flag) return Response.json({ error: 'Flag not found' }, { status: 404, headers: corsHeaders });
      return Response.json({ flag }, { headers: corsHeaders });
    }

    // Update flag
    if (url.pathname.match(/^\/api\/flags\/[\w-]+$/) && method === 'PUT') {
      const id = url.pathname.split('/').pop()!;
      const flag = flags.get(id);
      if (!flag) return Response.json({ error: 'Flag not found' }, { status: 404, headers: corsHeaders });
      const body = await request.json() as any;
      if (body.enabled !== undefined) flag.enabled = body.enabled;
      if (body.rolloutPercentage !== undefined) flag.rolloutPercentage = body.rolloutPercentage;
      flag.updatedAt = new Date().toISOString();
      flags.set(id, flag);
      return Response.json({ success: true, flag }, { headers: corsHeaders });
    }

    // Evaluate flag
    if (url.pathname === '/api/evaluate' && method === 'POST') {
      const body = await request.json() as any;
      const flagId = body.flag;
      const context = body.context || {};
      const flag = flags.get(flagId);
      if (!flag) return Response.json({ error: 'Flag not found' }, { status: 404, headers: corsHeaders });
      const result = evaluateFlag(flag, context);
      return Response.json({ flag: flagId, ...result }, { headers: corsHeaders });
    }

    // Evaluate multiple flags
    if (url.pathname === '/api/evaluate-all' && method === 'POST') {
      const body = await request.json() as any;
      const context = body.context || {};
      const results: any = {};
      for (const [id, flag] of flags) {
        results[id] = evaluateFlag(flag, context);
      }
      return Response.json({ flags: results }, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/api/health') {
      return Response.json({ status: 'healthy', version: '1.0.0', flagCount: flags.size }, { headers: corsHeaders });
    }

    // Dashboard
    return new Response(dashboardHTML, { headers: { 'Content-Type': 'text/html' } });
  },
};
