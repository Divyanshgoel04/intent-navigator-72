import { Link } from "@tanstack/react-router";
import { BarChart3, BrainCircuit, Package, Sparkles, MessagesSquare } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { to: "/", label: "Live Demo", icon: MessagesSquare },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/how-it-works", label: "How it works", icon: Sparkles },
] as const;

export function AppNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary glow-shadow">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Helix Support</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">AI Agent</div>
          </div>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Agent online
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}