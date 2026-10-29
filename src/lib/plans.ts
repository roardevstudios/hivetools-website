export type PlanId = 'free' | 'pro' | 'max';

export const DISCORD_URL = 'https://discord.gg/jN3MxRqvsV';

export const planCatalog = {
  plans: [
    { id: 'free', name: 'Hive Free', price: 0, period: '', description: 'A daily allowance for everyday AI work.' },
    { id: 'pro', name: 'Hive Pro', price: 4.99, period: '/ month', description: 'The essentials for everyday AI work.' },
    { id: 'max', name: 'Hive Max', price: 22.99, period: '/ month', description: 'Maximum planned capacity for demanding workflows.' },
  ] satisfies { id: PlanId; name: string; price: number; period: string; description: string }[],
  features: [
    { id: 'tokens', label: 'Chat tokens / day', values: ['25,000', '50,000', '50,000', '2,000,000'], home: 'Chat tokens per day' },
    { id: 'voice', label: 'Voice sessions / day', values: ['5', '25', '25', 'Unlimited'], home: 'Daily voice session allowance' },
    { id: 'models', label: 'Model access', values: ['Bonsai', 'Qwen', 'Qwen', 'Nemotron · top priority'], home: 'Model access and request priority' },
    { id: 'chat', label: 'Core chat workspace', values: ['Included', 'Included', 'Included', 'Included'], home: 'Core chat workspace' },
    { id: 'research', label: 'Cited web research', values: ['—', 'Included', 'Included', 'Included'], home: 'Cited web research', from: 'pro' as PlanId },
    { id: 'pc', label: 'PC actions with Allow / Deny', values: ['—', 'Included', 'Included', 'Included'], home: 'PC actions with Allow / Deny', from: 'pro' as PlanId },
    { id: 'tools', label: 'Standard agent tools', values: ['—', 'Included', 'Included', 'Included'], home: 'Standard agent tools', from: 'pro' as PlanId },
    { id: 'swarm', label: 'Agent swarm routing', values: ['—', 'Standard', 'Standard', 'Top priority'], home: 'Agent swarm routing', from: 'pro' as PlanId },
    { id: 'support', label: 'Priority support', values: ['—', '—', '—', 'Included'], home: 'Priority support', from: 'max' as PlanId },
    { id: 'buddy', label: 'Buddy + desktop notch (coming soon)', values: ['—', '—', '—', 'Included'], home: 'Buddy and desktop notch', from: 'max' as PlanId },
    { id: 'cloud', label: 'HiveBox cloud disk', values: ['—', '—', '—', 'Included'], home: 'HiveBox cloud disk', from: 'max' as PlanId },
    { id: 'background', label: 'HiveBox background tasks', values: ['—', '—', '—', 'Included'], home: 'HiveBox background tasks', from: 'max' as PlanId },
  ] satisfies { id: string; label: string; values: string[]; home: string; from?: PlanId }[],
} as const;

export const planIndex = (id: PlanId) => planCatalog.plans.findIndex((plan) => plan.id === id);
export const featureIncluded = (feature: (typeof planCatalog.features)[number], planId: PlanId) =>
  planIndex(planId) >= planIndex('free') && planIndex(planId) >= planIndex(feature.from ?? 'free');
