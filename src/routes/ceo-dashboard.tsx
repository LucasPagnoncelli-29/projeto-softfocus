import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { EMOTIONS, getEntries, isToday, type MoodEntry } from "@/lib/mood-store";

const AUTH_KEY = "ceo-auth";

export const Route = createFileRoute("/ceo-dashboard")({
  head: () => ({ meta: [{ title: "Dashboard Executivo · Happiness Door" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(AUTH_KEY) !== "1") {
      navigate({ to: "/ceo-login" });
      return;
    }
    setEntries(getEntries());
    setReady(true);
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    navigate({ to: "/" });
  };

  const today = useMemo(() => entries.filter((e) => isToday(e.timestamp)), [entries]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    EMOTIONS.forEach((e) => (map[e.id] = 0));
    today.forEach((e) => (map[e.emotion] = (map[e.emotion] ?? 0) + 1));
    return map;
  }, [today]);

  const total = today.length;
  const predominant = useMemo(() => {
    let best = EMOTIONS[0];
    let max = -1;
    EMOTIONS.forEach((e) => {
      if (counts[e.id] > max) { max = counts[e.id]; best = e; }
    });
    return max > 0 ? best : null;
  }, [counts]);

  // Weekly trend (last 7 days)
  const week = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const c = entries.filter((e) => {
        const ed = new Date(e.timestamp);
        return ed.toDateString() === d.toDateString();
      }).length;
      days.push({ label: d.toLocaleDateString("pt-BR", { weekday: "short" }), count: c });
    }
    return days;
  }, [entries]);
  const maxWeek = Math.max(1, ...week.map((d) => d.count));

  // Top contributors
  const topPeople = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => map.set(e.name, (map.get(e.name) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [entries]);

  const exportCsv = () => {
    const rows = [
      ["data", "nome", "emocao", "comentario"],
      ...entries.map((e) => [
        new Date(e.timestamp).toISOString(),
        e.name,
        e.emotion,
        (e.comment ?? "").replace(/\n/g, " "),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `happiness-door-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!ready) return null;

  return (
    <main className="min-h-screen px-6 py-8 md:px-12 max-w-7xl mx-auto">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="font-display text-xs tracking-[0.25em] text-glow-magenta">PAINEL EXECUTIVO</div>
          <h1 className="font-display text-3xl md:text-4xl mt-1">Dashboard <span className="text-glow-cyan">CEO</span></h1>
        </div>
        <button
          onClick={logout}
          className="text-xs md:text-sm font-display tracking-widest px-4 py-2 rounded-md border border-border hover:border-glow-magenta text-muted-foreground hover:text-foreground transition"
        >
          SAIR
        </button>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Kpi label="Registros hoje" value={total.toString()} accent="cyan" />
        <Kpi label="Total histórico" value={entries.length.toString()} accent="cyan" />
        <Kpi
          label="Humor predominante"
          value={predominant ? `${predominant.emoji} ${predominant.label}` : "—"}
          accent="magenta"
        />
        <Kpi
          label="Pessoas únicas"
          value={new Set(entries.map((e) => e.name.toLowerCase())).size.toString()}
          accent="magenta"
        />
      </section>

      {/* Distribution */}
      <section className="panel p-6 md:p-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-glow-magenta">▮</span>
          <h2 className="font-display text-xl text-glow-magenta">DISTRIBUIÇÃO DE HOJE</h2>
        </div>
        <div className="space-y-4">
          {EMOTIONS.map((e) => {
            const c = counts[e.id];
            const pct = total > 0 ? Math.round((c / total) * 100) : 0;
            return (
              <div key={e.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{e.emoji}</span>
                    <span className="font-semibold" style={{ color: e.color }}>{e.label}</span>
                  </div>
                  <div className="text-sm text-muted-foreground tabular-nums">{c} · {pct}%</div>
                </div>
                <div className="h-2 rounded-full bg-input/60 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: e.color, boxShadow: `0 0 8px ${e.color}` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weekly trend + Top people */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="panel p-6">
          <h3 className="font-display text-glow-cyan mb-4">📈 EVOLUÇÃO SEMANAL</h3>
          <div className="flex items-end gap-3 h-40">
            {week.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md bg-primary/70"
                    style={{ height: `${(d.count / maxWeek) * 100}%`, boxShadow: "var(--glow-cyan)", minHeight: d.count > 0 ? "4px" : "0" }}
                  />
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">{d.count}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <h3 className="font-display text-glow-magenta mb-4">🏆 TOP COLABORADORES</h3>
          {topPeople.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum registro ainda.</p>
          ) : (
            <ul className="space-y-3">
              {topPeople.map(([name, count], i) => (
                <li key={name} className="flex items-center justify-between p-3 rounded-md bg-card/40 border border-border">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-glow-cyan w-6">#{i + 1}</span>
                    <span>{name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground tabular-nums">{count} registros</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* History */}
      <section className="panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-glow-cyan">📋 HISTÓRICO DE EMOÇÕES</h3>
          <button
            onClick={exportCsv}
            className="text-xs font-display tracking-widest px-3 py-2 rounded-md border border-border hover:border-glow-cyan transition"
          >
            EXPORTAR CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left py-2 pr-4">Data</th>
                <th className="text-left py-2 pr-4">Nome</th>
                <th className="text-left py-2 pr-4">Emoção</th>
                <th className="text-left py-2">Comentário</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Sem registros ainda.</td></tr>
              )}
              {[...entries].reverse().slice(0, 50).map((e) => {
                const em = EMOTIONS.find((x) => x.id === e.emotion)!;
                return (
                  <tr key={e.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted-foreground tabular-nums">
                      {new Date(e.timestamp).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 pr-4">{e.name}</td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-2">
                        <span>{em.emoji}</span>
                        <span style={{ color: em.color }}>{em.label}</span>
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">{e.comment || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: "cyan" | "magenta" }) {
  return (
    <div className="panel p-5">
      <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-2">{label}</div>
      <div className={`font-display text-2xl ${accent === "cyan" ? "text-glow-cyan" : "text-glow-magenta"}`}>{value}</div>
    </div>
  );
}
