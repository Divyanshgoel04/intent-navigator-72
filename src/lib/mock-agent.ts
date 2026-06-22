export type Intent = "ORDER" | "REFUND" | "ACCOUNT" | "SHIPPING" | "TECHNICAL" | "BILLING" | "GENERAL";

export const INTENT_META: Record<Intent, { label: string; color: string; bg: string; ring: string }> = {
  ORDER: { label: "Order", color: "text-blue-300", bg: "bg-blue-500/15", ring: "ring-blue-400/40" },
  REFUND: { label: "Refund", color: "text-emerald-300", bg: "bg-emerald-500/15", ring: "ring-emerald-400/40" },
  ACCOUNT: { label: "Account", color: "text-purple-300", bg: "bg-purple-500/15", ring: "ring-purple-400/40" },
  SHIPPING: { label: "Shipping", color: "text-amber-300", bg: "bg-amber-500/15", ring: "ring-amber-400/40" },
  TECHNICAL: { label: "Technical", color: "text-rose-300", bg: "bg-rose-500/15", ring: "ring-rose-400/40" },
  BILLING: { label: "Billing", color: "text-cyan-300", bg: "bg-cyan-500/15", ring: "ring-cyan-400/40" },
  GENERAL: { label: "General", color: "text-slate-300", bg: "bg-slate-500/15", ring: "ring-slate-400/40" },
};

const RULES: { intent: Intent; keywords: string[]; reply: string }[] = [
  { intent: "REFUND", keywords: ["refund", "money back", "return", "chargeback"], reply: "I've reviewed your request and initiated a refund. You'll see the credit on your original payment method within 5–7 business days." },
  { intent: "SHIPPING", keywords: ["shipping", "delivery", "tracking", "shipped", "arrive", "package"], reply: "Your package is in transit. Based on the carrier's latest scan, it should arrive within 2 business days. I've sent the live tracking link to your email." },
  { intent: "ORDER", keywords: ["order", "purchase", "cart", "checkout", "buy"], reply: "I've pulled up your order. Everything looks good and it's being prepared for fulfillment. You'll get a shipping confirmation as soon as it leaves the warehouse." },
  { intent: "ACCOUNT", keywords: ["account", "login", "password", "sign in", "email", "username", "profile"], reply: "I've sent a secure password reset link to the email on file. The link expires in 15 minutes — let me know if you don't receive it." },
  { intent: "BILLING", keywords: ["billing", "invoice", "charge", "subscription", "payment", "card"], reply: "I've located the charge on your account. The amount matches your current plan. Want me to email you a copy of the invoice?" },
  { intent: "TECHNICAL", keywords: ["bug", "error", "broken", "not working", "crash", "issue", "glitch"], reply: "Thanks for the report. I've logged this with the engineering team and applied a temporary workaround on your account. We'll follow up once a permanent fix ships." },
];

export interface AgentResult {
  intent: Intent;
  confidence: number;
  escalated: boolean;
  response: string;
  latencyMs: number;
}

export function classify(text: string): AgentResult {
  const lower = text.toLowerCase();
  let best: { intent: Intent; score: number; reply: string } = { intent: "GENERAL", score: 0, reply: "Thanks for reaching out. I've routed your message to the right team and you'll hear back shortly." };
  for (const rule of RULES) {
    const hits = rule.keywords.filter((k) => lower.includes(k)).length;
    if (hits > best.score) best = { intent: rule.intent, score: hits, reply: rule.reply };
  }
  const base = best.score === 0 ? 0.42 + Math.random() * 0.15 : Math.min(0.99, 0.78 + best.score * 0.07 + Math.random() * 0.08);
  const confidence = Number(base.toFixed(4));
  const escalated = confidence < 0.7;
  return {
    intent: best.intent,
    confidence,
    escalated,
    response: escalated
      ? "This needs a human touch. I've created a priority ticket and a support specialist will reach out within the next hour."
      : best.reply,
    latencyMs: 240 + Math.floor(Math.random() * 380),
  };
}

export interface TicketRecord {
  id: string;
  time: string;
  preview: string;
  intent: Intent;
  confidence: number;
  escalated: boolean;
}

export const RECENT_TICKETS: TicketRecord[] = [
  { id: "T-10481", time: "2m ago", preview: "Where is my order #45128?", intent: "SHIPPING", confidence: 0.96, escalated: false },
  { id: "T-10480", time: "8m ago", preview: "I want to return these headphones", intent: "REFUND", confidence: 0.93, escalated: false },
  { id: "T-10479", time: "14m ago", preview: "Can't log into my account", intent: "ACCOUNT", confidence: 0.89, escalated: false },
  { id: "T-10478", time: "22m ago", preview: "Charged twice for subscription", intent: "BILLING", confidence: 0.62, escalated: true },
  { id: "T-10477", time: "31m ago", preview: "App crashes on checkout", intent: "TECHNICAL", confidence: 0.58, escalated: true },
  { id: "T-10476", time: "44m ago", preview: "Update shipping address on order", intent: "ORDER", confidence: 0.91, escalated: false },
  { id: "T-10475", time: "1h ago", preview: "How do I redeem a gift card?", intent: "GENERAL", confidence: 0.71, escalated: false },
  { id: "T-10474", time: "1h ago", preview: "Refund hasn't arrived yet", intent: "REFUND", confidence: 0.84, escalated: false },
];

export const INTENT_DISTRIBUTION: { intent: Intent; count: number }[] = [
  { intent: "ORDER", count: 412 },
  { intent: "SHIPPING", count: 388 },
  { intent: "REFUND", count: 271 },
  { intent: "BILLING", count: 196 },
  { intent: "ACCOUNT", count: 154 },
  { intent: "TECHNICAL", count: 121 },
  { intent: "GENERAL", count: 88 },
];

export interface OrderRecord {
  id: string;
  product: string;
  date: string;
  status: "Delivered" | "Shipped" | "Processing" | "Cancelled";
  amount: number;
  refund: "None" | "Pending" | "Refunded";
}

export const MOCK_ORDERS: Record<string, OrderRecord> = {
  "45128": { id: "45128", product: "Sony WH-1000XM5 Headphones", date: "Jun 14, 2026", status: "Shipped", amount: 399.99, refund: "None" },
  "45077": { id: "45077", product: "Logitech MX Master 3S", date: "Jun 09, 2026", status: "Delivered", amount: 109.0, refund: "None" },
  "44981": { id: "44981", product: "Standing Desk Converter", date: "Jun 01, 2026", status: "Delivered", amount: 249.5, refund: "Refunded" },
  "44872": { id: "44872", product: "Mechanical Keyboard — Tactile", date: "May 22, 2026", status: "Processing", amount: 179.0, refund: "Pending" },
  "44801": { id: "44801", product: "4K Webcam Pro", date: "May 18, 2026", status: "Cancelled", amount: 159.99, refund: "Refunded" },
};