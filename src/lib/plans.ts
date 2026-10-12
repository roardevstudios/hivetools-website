export type PlanId = 'free' | 'starter' | 'plus' | 'max';

export const planCatalog = {
  plans: [
    { id: 'free', name: 'Hive Free', price: 0, period: '', description: 'A daily allowance for everyday AI work.' },
    { id: 'starter', name: 'Hive Starter', price: 4.99, period: '/ month', description: 'The essentials for everyday AI work.' },
    { id: 'plus', name: 'Hive Plus', price: 12.99, period: '/ month', description: 'More room for research, voice, and daily projects.' },
    { id: 'max', name: 'Hive Max', price: 22.99, period: '/ month', description: 'Maximum planned capacity for demanding workflows.' },
  ] satisfies { id: PlanId; name: string; price: number; period: string; description: string }[],
  features: [
    { id: 'tokens', label: 'Hive Free chat tokens / day', values: ['25,000', '50,000', '500,000', '2,000,000'], home: 'Daily chat token allowance' },
    { id: 'voice', label: 'Voice sessions / day', values: ['5', '25', '100', 'Unlimited'], home: 'Daily voice session allowance' },
    { id: 'models', label: 'Model access', values: ['Standard', 'Standard', 'Standard', 'Fastest models · top priority'], home: 'Model access and request priority' },
    { id: 'chat', label: 'Core chat workspace', values: ['Included', 'Included', 'Included', 'Included'], home: 'Core chat workspace' },
    { id: 'research', label: 'Cited web research', values: ['—', 'Included', 'Included', 'Included'], home: 'Cited web research', from: 'starter' as PlanId },
    { id: 'pc', label: 'PC actions with Allow / Deny', values: ['—', 'Included', 'Included', 'Included'], home: 'PC actions with Allow / Deny', from: 'starter' as PlanId },
    { id: 'tools', label: 'Standard agent tools', values: ['—', 'Included', 'Included', 'Included'], home: 'Standard agent tools', from: 'starter' as PlanId },
    { id: 'swarm', label: 'Agent swarm routing', values: ['—', 'Standard', 'Priority', 'Top priority'], home: 'Agent swarm routing', from: 'starter' as PlanId },
    { id: 'buddy', label: 'Buddy + desktop notch', values: ['—', '—', 'Included', 'Included'], home: 'Buddy and desktop notch', from: 'plus' as PlanId },
    { id: 'cloud', label: 'HiveBox cloud disk', values: ['—', '—', 'Included', 'Included'], home: 'HiveBox cloud disk', from: 'plus' as PlanId },
    { id: 'background', label: 'HiveBox background tasks', values: ['—', '—', '—', 'Included'], home: 'HiveBox background tasks', from: 'max' as PlanId },
  ] satisfies { id: string; label: string; values: string[]; home: string; from?: PlanId }[],
} as const;

export const planIndex = (id: PlanId) => planCatalog.plans.findIndex((plan) => plan.id === id);
export const featureIncluded = (feature: (typeof planCatalog.features)[number], planId: PlanId) =>
  planIndex(planId) >= planIndex('free') && planIndex(planId) >= planIndex(feature.from ?? 'free');
