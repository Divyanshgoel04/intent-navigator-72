import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Loader2, TicketCheck, UserCog, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fetchMetrics, fetchRecentTickets } from "@/lib/api";
import { useEffect, useState } from "react";

interface MetricsData {
  total_tickets: number;
  auto_resolved: number;
  escalated: number;
  escalation_rate: number;
  intent_distribution: Record<string, number>;
}

interface Ticket {
  ticket_id: string;
  raw_text: string;
  intent: string;
  category: string;
  confidence_score: number;
  escalated: boolean;
  resolved: boolean;
  timestamp: string;
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

const CHART_COLORS = [
  "#7c3aed", "#6d28d9", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#4f46e5", "#818cf8", "#93c5fd", "#60a5fa", "#3b82f6"
];

const PIE_COLORS = ["#7c3aed", "#ec4899"];

const formatIntent = (intent: string) => {
  return intent
    .split('_')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1e1b4b', border: '1px solid #7c3aed', borderRadius: 12, padding: '8px 12px' }}>
        <p style={{ color: '#ffffff', margin: 0 }}>{payload[0].name} : {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1e1b4b', border: '1px solid #7c3aed', borderRadius: 12, padding: '8px 12px' }}>
        <p style={{ color: '#ffffff', margin: 0, fontWeight: 600 }}>{formatIntent(label)}</p>
        <p style={{ color: '#a78bfa', margin: 0 }}>count : {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const CustomBar = (props: any) => {
  const { x, y, width, height, index } = props;
  const color = CHART_COLORS[index % CHART_COLORS.length];
  return <rect x={x} y={y} width={width} height={height} fill={color} rx={8} ry={8} />;
};

function Analytics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [data, ticketsData] = await Promise.all([
          fetchMetrics(),
          fetchRecentTickets()
        ]);
        if (!cancelled) {
          setMetrics(data as MetricsData);
          setRecentTickets(ticketsData.tickets || []);
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
    { name: "Auto-resolved", value: resolved },
    { name: "Escalated", value: escalated },
  ];

  const barData = metrics?.intent_distribution
    ? Object.entries(metrics.intent_distribution).map(([intent, count]) => ({
        name: intent,
        count,
      }))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="gradient-text text-3xl font-semibold tracking-tight">Analytics</h1>
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
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-semibold tabular-nums">
                      {total > 0 ? ((resolved / total) * 100).toFixed(0) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">auto-resolved</div>
                  </div>
                </div>
                <div className="mt-4 flex justify-center gap-6 text-xs">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
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
                      <XAxis
                        dataKey="name"
                        stroke="var(--muted-foreground)"
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatIntent}
                      />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(124, 58, 237, 0.2)" }}
                        content={<CustomBarTooltip />}
                      />
                      <Bar dataKey="count" shape={(props: any) => <CustomBar {...props} />} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          <Card className="surface-card border-border/60 p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
              Recent Tickets
            </h2>
            {recentTickets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Submit tickets via the Live Demo page to see them appear here
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Time</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Ticket</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Intent</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Confidence</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTickets.map((ticket, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-white/5 transition-colors">
                        <td className="py-2 px-3 text-muted-foreground text-xs">
                          {new Date(ticket.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-foreground max-w-xs truncate">
                          {ticket.raw_text}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ background: '#7c3aed33', color: '#a78bfa' }}>
                            {formatIntent(ticket.intent)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-foreground">
                          {ticket.confidence_score}%
                        </td>
                        <td className="py-2 px-3">
                          {ticket.escalated ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{ background: '#ec489933', color: '#f472b6' }}>
                              Escalated
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{ background: '#10b98133', color: '#34d399' }}>
                              Resolved
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({
  label, value, delta, up, icon, loading
}: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  icon: React.ReactNode;
  loading?: boolean;
}) {
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