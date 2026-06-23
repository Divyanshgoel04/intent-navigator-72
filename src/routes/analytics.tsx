import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Loader2, TicketCheck, UserCog, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { INTENT_META, RECENT_TICKETS } from "@/lib/mock-agent";
import { fetchMetrics } from "@/lib/api";
import { useEffect, useState } from "react";

interface MetricsData {
  total_tickets: number;
  auto_resolved: number;
  escalated: number;
  escalation_rate: number;
  intent_distribution: Record<string, number>;
}

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Helix Support" },
      { name: "description", content: "Auto-resolve rate, escalations, intent mix, and recent tickets handled by the AI agent." },
      { property: "og:title", content: "Analytics — Helix Support" },
      { property: "og:description", content: "Auto-resolve rate, escalations, intent mix, and recent ticket activity." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMetrics();
        if (!cancelled) {
          setMetrics(data as MetricsData);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Unable to load metrics. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const total = metrics?.total_tickets ?? 0;
  const resolved = metrics?.auto_resolved ?? 0;
  const escalated = metrics?.escalated ?? 0;
  const rate = metrics?.escalation_rate ?? 0;

  const pieData = [
    { name: "Auto-resolved", value: resolved, color: "var(--color-chart-1)" },
    { name: "Escalated", value: escalated, color: "var(--color-chart-4)" },
  ];

  const barData = metrics?.intent_distribution
    ? Object.entries(metrics.intent_distribution).map(([name, count], i) => ({
        name,
        count,
        fill: `var(--color-chart-${(i % 5) + 1})`,
      }))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live agent activity across all channels.</p>
      </div>

      {loading && !metrics && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Loading metrics…</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-border/60 bg-card p-6 text-center text-sm text-rose-300">
          {error}
        </div>
      )}

      {metrics && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total tickets" value={total.toLocaleString()} delta="—" up icon={<TicketCheck className="h-4 w-4" />} loading={loading} />
            <Metric label="Auto-resolved" value={resolved.toLocaleString()} delta="—" up icon={<CheckCircle2 className="h-4 w-4" />} loading={loading} />
            <Metric label="Escalated" value={escalated.toLocaleString()} delta="—" up={false} icon={<UserCog className="h-4 w-4" />} loading={loading} />
            <Metric label="Escalation rate" value={`${rate.toFixed(1)}%`} delta="—" up={false} icon={<Zap className="h-4 w-4" />} loading={loading} />
          </div>

          {total === 0 ? (
            <Card className="surface-card border-border/60 p-12 text-center">
              <p className="text-muted-foreground">No tickets processed yet</p>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="surface-card border-border/60 p-6 lg:col-span-2">
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Resolution mix</h2>
                <div className="relative mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={3} stroke="none">
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-semibold tabular-nums">{total > 0 ? ((resolved / total) * 100).toFixed(0) : 0}%</div>
                    <div className="text-xs text-muted-foreground">auto-resolved</div>
                  </div>
                </div>
                <div className="mt-4 flex justify-center gap-6 text-xs">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                      {d.name} <span className="text-foreground">· {d.value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="surface-card border-border/60 p-6 lg:col-span-3">
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Top intents</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.4 }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {barData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          <Card className="surface-card border-border/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 p-6">
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Recent tickets</h2>
                <p className="mt-1 text-xs text-muted-foreground">Live stream of the latest classifications.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Time</th>
                    <th className="px-6 py-3 font-medium">Intent</th>
                    <th className="px-6 py-3 font-medium">Confidence</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_TICKETS.map((t) => {
                    const meta = INTENT_META[t.intent];
                    const pct = Math.round(t.confidence * 100);
                    return (
                      <tr key={t.id} className="border-t border-border/40 transition-colors hover:bg-accent/40">
                        <td className="px-6 py-4 text-muted-foreground">{t.time}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.bg} ${meta.color} ${meta.ring}`}>
                            {meta.label.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-background/60">
                              <div className="h-full rounded-full gradient-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="tabular-nums text-xs text-muted-foreground">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{t.escalated ? "Hand-off" : "Auto-reply"}</td>
                        <td className="px-6 py-4">
                          {t.escalated ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-400/30">
                              Escalated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30">
                              Resolved
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, delta, up, icon, loading }: { label: string; value: string; delta: string; up: boolean; icon: React.ReactNode; loading?: boolean }) {
  return (
    <Card className="surface-card border-border/60 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary-glow">{icon}</span>
      </div>
      <div className="mt-4 text-3xl font-semibold tabular-nums">
        {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : value}
      </div>
      <div className={`mt-2 inline-flex items-center gap-1 text-xs ${up ? "text-emerald-300" : "text-rose-300"}`}>
        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {delta} <span className="text-muted-foreground">vs yesterday</span>
      </div>
    </Card>
  );
}
