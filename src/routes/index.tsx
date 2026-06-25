import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import softfocusLogo from "@/assets/softfocus-logo.webp.asset.json";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Softfocus · Happiness Door" },
      { name: "description", content: "Registro de humor e clima organizacional da Softfocus." },
    ],
  }),
  component: App,
});

type MoodId = "stressed" | "bad" | "neutral" | "good" | "radiant";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
}

interface Submission {
  id: string;
  employeeId: string;
  name: string;
  mood: MoodId;
  score: number;
  comment: string;
  timestamp: string;
  submissionDate: string;
  tags: string[];
}

const TAGS = [
  "#CargaDeTrabalho",
  "#ClimaNaEquipe",
  "#Reconhecimento",
  "#Ferramentas/Processos",
  "#VidaPessoal",
] as const;

interface Mood {
  id: MoodId;
  label: string;
  emoji: string;
  score: number;
}

const MOCK_EMPLOYEES: (Employee & { phone: string })[] = [
  { id: "SF-4012", name: "Márcio Cardozo", role: "Diretor de Tecnologia", department: "P&D", phone: "(46) 99122-3841" },
  { id: "SF-7781", name: "Amanda Silveira", role: "Desenvolvedora Frontend", department: "Fábrica de Software", phone: "(46) 98815-4029" },
  { id: "SF-2093", name: "Cezar Andrade", role: "Especialista em Crédito Rural", department: "Agro", phone: "(46) 99911-7732" },
  { id: "SF-5104", name: "Letícia Pato", role: "Product Designer", department: "UX/UI", phone: "(46) 99104-5151" },
  { id: "SF-3329", name: "Rodrigo Santos", role: "Engenheiro de QA", department: "Qualidade", phone: "(46) 98402-3329" },
];

type MoodCounts = Record<string, number>;
interface ArchiveDay { date: string; counts: MoodCounts }

function todayKey() {
  // Use São Paulo locale to match DB default (America/Sao_Paulo)
  const d = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d); // YYYY-MM-DD
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Agora mesmo";
  }
}

const MOODS: Mood[] = [
  { id: "stressed", label: "Estressado", emoji: "🤯", score: 1 },
  { id: "bad", label: "Desanimado", emoji: "😔", score: 2 },
  { id: "neutral", label: "Neutro", emoji: "😐", score: 3 },
  { id: "good", label: "Feliz", emoji: "🙂", score: 4 },
  { id: "radiant", label: "Radiante", emoji: "🤩", score: 5 },
];

interface DbRow {
  id: string;
  employee_id: string;
  employee_name: string;
  mood: string;
  score: number;
  comment: string | null;
  submission_date: string;
  created_at: string;
  tags: string[] | null;
}

function rowToSubmission(r: DbRow): Submission {
  return {
    id: r.id,
    employeeId: r.employee_id,
    name: r.employee_name,
    mood: r.mood as MoodId,
    score: r.score,
    comment: r.comment || "Sem comentários adicionais.",
    timestamp: formatTimestamp(r.created_at),
    submissionDate: r.submission_date,
    tags: r.tags ?? [],
  };
}

type AlertState = { show: boolean; type: "success" | "error" | "warning" | ""; message: string };

function App() {
  const [activeTab, setActiveTab] = useState<"register" | "dashboard">("register");
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [dashSubs, setDashSubs] = useState<Submission[]>([]);
  const [distPeriod, setDistPeriod] = useState<"day" | "week" | "month">("day");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<AlertState>({ show: false, type: "", message: "" });
  const [ceoAuth, setCeoAuth] = useState(false);
  const [ceoUser, setCeoUser] = useState("");
  const [ceoPass, setCeoPass] = useState("");
  const [currentDay, setCurrentDay] = useState<string>(todayKey());
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<{ from: string; to: string } | null>(null);

  // Effective range = custom filter OR distPeriod tab
  const effectiveRange = (() => {
    if (activeFilter) return activeFilter;
    const today = currentDay;
    if (distPeriod === "day") return { from: today, to: today };
    const [y, m, d] = today.split("-").map(Number);
    const todayDate = new Date(y, (m ?? 1) - 1, d ?? 1);
    const fmt = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    if (distPeriod === "week") {
      const s = new Date(todayDate);
      s.setDate(todayDate.getDate() - 6);
      return { from: fmt(s), to: today };
    }
    const s = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    return { from: fmt(s), to: today };
  })();
  const rangeFrom = effectiveRange.from;
  const rangeTo = effectiveRange.to;

  const fetchDash = useCallback(async (from: string, to: string) => {
    const { data } = await supabase
      .from("mood_submissions")
      .select("*")
      .gte("submission_date", from)
      .lte("submission_date", to)
      .order("created_at", { ascending: false });
    setDashSubs(((data ?? []) as DbRow[]).map(rowToSubmission));
  }, []);

  useEffect(() => {
    fetchDash(rangeFrom, rangeTo);
  }, [rangeFrom, rangeTo, fetchDash]);

  // Realtime: append inserts that fall within the active range
  useEffect(() => {
    const channel = supabase
      .channel("mood_submissions_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mood_submissions" },
        (payload) => {
          const row = payload.new as DbRow;
          if (row.submission_date >= rangeFrom && row.submission_date <= rangeTo) {
            setDashSubs((prev) =>
              prev.some((s) => s.id === row.id) ? prev : [rowToSubmission(row), ...prev]
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [rangeFrom, rangeTo]);

  // Midnight rollover
  useEffect(() => {
    const id = setInterval(() => {
      const t = todayKey();
      if (t !== currentDay) setCurrentDay(t);
    }, 60_000);
    return () => clearInterval(id);
  }, [currentDay]);

  const showAlert = (type: AlertState["type"], message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const handleCeoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (ceoUser.trim().toLowerCase() === "ceo" && ceoPass === "ceo123") {
      setCeoAuth(true);
      setCeoUser("");
      setCeoPass("");
      showAlert("success", " ACESSO AUTORIZADO! ");
    } else {
      showAlert("error", " CREDENCIAIS INVÁLIDAS! ");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!selectedMood) {
      showAlert("warning", "Por favor, selecione como você está se sentindo hoje primeiro!");
      return;
    }
    if (!employeeId.trim()) {
      showAlert("warning", "Insira seu ID de funcionário antes de registrar!");
      return;
    }
    const employee = MOCK_EMPLOYEES.find(
      (emp) => emp.id.toUpperCase() === employeeId.trim().toUpperCase()
    );
    if (!employee) {
      showAlert("error", " ID INCORRETO! ");
      return;
    }

    setSubmitting(true);
    const today = todayKey();

    const { data: existing } = await supabase
      .from("mood_submissions")
      .select("id")
      .eq("employee_id", employee.id)
      .eq("submission_date", today)
      .maybeSingle();

    if (existing) {
      showAlert("warning", "Você já se registrou hoje!");
      setSubmitting(false);
      return;
    }

    const moodObj = MOODS.find((m) => m.id === selectedMood)!;
    const { error } = await supabase.from("mood_submissions").insert({
      employee_id: employee.id,
      employee_name: employee.name,
      mood: selectedMood,
      score: moodObj.score,
      comment: comment.trim() || null,
      submission_date: today,
      tags: selectedTags,
    });

    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        showAlert("warning", "Você já se registrou hoje!");
        return;
      }
      showAlert("error", "Não foi possível registrar agora. Tente novamente.");
      return;
    }

    showAlert("success", " HUMOR REGISTADO COM SUCESSO! ");
    setSelectedMood(null);
    setComment("");
    setSelectedTags([]);
    setEmployeeId("");
    fetchDash(rangeFrom, rangeTo);
  };

  // KPIs derived from the same filtered set
  const totalSubmissions = dashSubs.length;
  const averageMoodScore =
    totalSubmissions > 0
      ? (dashSubs.reduce((acc, c) => acc + c.score, 0) / totalSubmissions).toFixed(1)
      : "0";
  const uniqueEmployees = new Set(dashSubs.map((s) => s.employeeId)).size;
  const adherenceRate = Math.round((uniqueEmployees / MOCK_EMPLOYEES.length) * 100);

  const periodCounts: MoodCounts = (() => {
    const c: MoodCounts = {};
    for (const s of dashSubs) c[s.mood] = (c[s.mood] ?? 0) + 1;
    return c;
  })();

  const periodTotal = Object.values(periodCounts).reduce((a, b) => a + b, 0);
  const getPeriodPercentage = (moodId: MoodId) =>
    periodTotal === 0 ? 0 : Math.round(((periodCounts[moodId] ?? 0) / periodTotal) * 100);
  const periodMax = Math.max(1, ...MOODS.map((m) => periodCounts[m.id] ?? 0));

  const tagCounts = (() => {
    const c: Record<string, number> = {};
    for (const s of dashSubs) for (const t of s.tags) c[t] = (c[t] ?? 0) + 1;
    return c;
  })();
  const tagMax = Math.max(1, ...Object.values(tagCounts));
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);


  const formatBR = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const moodBarColor = (id: MoodId) =>
    id === "stressed"
      ? "bg-red-500"
      : id === "bad"
      ? "bg-orange-500"
      : id === "neutral"
      ? "bg-amber-500"
      : id === "good"
      ? "bg-emerald-500"
      : "bg-teal-500";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-[#0a1d37] text-white shadow-xl border-b-4 border-emerald-500">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <img src={softfocusLogo.url} alt="Softfocus" className="h-10 w-auto" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-xl">SOFTFOCUS</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full uppercase border border-emerald-500/30 font-semibold">Pato Branco - PR</span>
              </div>
              <p className="text-xs text-slate-300 font-medium">Happiness Door • Avaliação de Humor e Clima Organizacional</p>
            </div>
          </div>

          <div className="flex bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setActiveTab("register")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "register"
                  ? "bg-emerald-500 text-[#0a1d37] shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Registrar Humor
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "dashboard"
                  ? "bg-emerald-500 text-[#0a1d37] shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
              CEO Dashboard
            </button>
          </div>
        </div>
      </header>


      {alert.show && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 animate-bounce">
          <div
            className={`p-4 rounded-xl shadow-2xl border-2 flex items-center gap-3 ${
              alert.type === "success"
                ? "bg-emerald-500 text-white border-emerald-400"
                : alert.type === "error"
                ? "bg-red-500 text-white border-red-400"
                : "bg-amber-500 text-white border-amber-400"
            }`}
          >
            <div className="bg-white/20 p-2 rounded-full">
              {alert.type === "success" && (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {alert.type === "error" && (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {alert.type === "warning" && (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div className="font-extrabold text-base tracking-wide flex-1 text-center">{alert.message}</div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === "register" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-[#0a1d37] p-6 text-white border-b-2 border-emerald-500">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-emerald-400">⚡</span> Como está seu dia na Softfocus hoje?
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Sua percepção diária apoia na construção de um clima leve, transparente e de alta performance.
                </p>
              </div>
              <form onSubmit={handleRegister} className="p-6 sm:p-8 space-y-8">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <span className="bg-emerald-500 text-[#0a1d37] text-xs font-extrabold w-5 h-5 rounded-full inline-flex items-center justify-center">1</span>
                    Selecione seu humor dominante do dia
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {MOODS.map((mood) => {
                      const isSelected = selectedMood === mood.id;
                      return (
                        <button
                          key={mood.id}
                          type="button"
                          onClick={() => setSelectedMood(mood.id)}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-2 transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-400 scale-105"
                              : "border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-600"
                          }`}
                        >
                          <span className="text-3xl filter drop-shadow-sm">{mood.emoji}</span>
                          <span className={`text-xs font-bold ${isSelected ? "text-emerald-700" : "text-slate-600"}`}>
                            {mood.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider flex items-center gap-2">
                    <span className="bg-emerald-500 text-[#0a1d37] text-xs font-extrabold w-5 h-5 rounded-full inline-flex items-center justify-center">2</span>
                    Conte um pouco mais sobre seu dia (opcional)
                  </label>
                  <p className="text-xs text-slate-400 mb-2">
                    Pode ser um agradecimento, um impedimento ou o que motivou sua escolha hoje.
                  </p>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ex: Tivemos uma ótima entrega de sprint e o time resolveu os gargalos técnicos rapidamente!"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-400 text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-3 mb-2 font-semibold uppercase tracking-wider">
                    Ou marque um motivo rápido:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TAGS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setSelectedTags((prev) =>
                              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                            )
                          }
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                            active
                              ? "bg-emerald-500 text-[#0a1d37] border-emerald-600 shadow"
                              : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400 hover:text-emerald-700"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-sm font-extrabold text-[#0a1d37] mb-1.5 uppercase tracking-wider flex items-center gap-2">
                      <span className="bg-emerald-500 text-[#0a1d37] text-xs font-extrabold w-5 h-5 rounded-full inline-flex items-center justify-center">3</span>
                      Confirme seu ID de colaborador
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Informe o identificador único de crachá (SF-XXXX) presente em seu cartão da empresa.
                    </p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-mono font-semibold text-sm">ID:</span>
                      </div>
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="SF-XXXX"
                        className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0a1d37] focus:border-transparent transition-all uppercase placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#0a1d37] hover:bg-[#0f2c52] text-white rounded-xl font-extrabold uppercase tracking-widest text-sm shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 border-b-4 border-emerald-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {submitting ? "Registrando..." : "Registrar meu humor agora"}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && !ceoAuth && (
          <div className="max-w-md mx-auto mt-8">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-[#0a1d37] p-6 text-white border-b-2 border-emerald-500 text-center">
                <div className="inline-flex w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3zm-7 9a7 7 0 1114 0H5z" />
                  </svg>
                </div>
                <h2 className="text-lg font-extrabold uppercase tracking-wider">Acesso Restrito - CEO</h2>
                <p className="text-xs text-slate-300 mt-1">Informe suas credenciais executivas para continuar.</p>
              </div>
              <form onSubmit={handleCeoLogin} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">ID do CEO</label>
                  <input
                    type="text"
                    value={ceoUser}
                    onChange={(e) => setCeoUser(e.target.value)}
                    placeholder="Digite seu usuário"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">Senha</label>
                  <input
                    type="password"
                    value={ceoPass}
                    onChange={(e) => setCeoPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#0a1d37] hover:bg-[#0f2c52] text-white rounded-xl font-extrabold uppercase tracking-widest text-sm shadow-lg border-b-4 border-emerald-500 transition-all cursor-pointer"
                >
                  Entrar no painel
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  Demo: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">ceo</code> / <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">ceo123</code>
                </p>
              </form>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && ceoAuth && (
          <div className="space-y-8">
            <div className="bg-white p-4 rounded-2xl shadow border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Sessão Executiva</p>
                  <p className="text-sm font-bold text-[#0a1d37]">CEO autenticado · Painel da Diretoria</p>
                </div>
              </div>
              <button
                onClick={() => { setCeoAuth(false); setActiveTab("register"); }}
                className="text-xs font-extrabold uppercase tracking-wider px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer"
              >
                Sair (Logout)
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-emerald-500 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs uppercase font-extrabold tracking-wider">Índice de humor</p>
                  <p className="text-3xl font-extrabold text-[#0a1d37] mt-1">
                    {averageMoodScore} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                  </p>
                </div>
                <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl font-bold text-lg">
                  {parseFloat(averageMoodScore) >= 4 ? "🤩 Ótimo" : parseFloat(averageMoodScore) >= 3 ? "😐 Neutro" : "😔 Alerta"}
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-[#0a1d37] flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs uppercase font-extrabold tracking-wider">Total de registros</p>
                  <p className="text-3xl font-extrabold text-[#0a1d37] mt-1">{totalSubmissions}</p>
                </div>
                <div className="bg-slate-100 text-slate-700 p-3 rounded-xl text-xl">📝</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-teal-500 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs uppercase font-extrabold tracking-wider">Taxa de adesão</p>
                  <p className="text-3xl font-extrabold text-[#0a1d37] mt-1">{adherenceRate}%</p>

                </div>
                <div className="bg-teal-100 text-teal-700 p-3 rounded-xl text-xl">👥</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-amber-500 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs uppercase font-extrabold tracking-wider">Localidade ativa</p>
                  <p className="text-xl font-extrabold text-[#0a1d37] mt-1">Pato Branco</p>
                  <p className="text-[10px] text-slate-400">Parque Tecnológico / PR</p>
                </div>
                <div className="bg-amber-100 text-amber-700 p-3 rounded-xl text-xl">📍</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h3 className="font-extrabold text-[#0a1d37] uppercase tracking-wider text-sm flex items-center gap-2">
                  <span>📊</span> Distribuição de humor{" "}
                  {activeFilter
                    ? `(${formatBR(activeFilter.from)} → ${formatBR(activeFilter.to)})`
                    : distPeriod === "day"
                    ? "hoje"
                    : distPeriod === "week"
                    ? "(últimos 7 dias)"
                    : "(este mês)"}
                </h3>
                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setFilterOpen((o) => !o)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                        activeFilter
                          ? "bg-emerald-500 text-[#0a1d37] border-emerald-600"
                          : "bg-white text-[#0a1d37] border-slate-300 hover:border-emerald-400"
                      }`}
                    >
                      📅 Filtrar por período
                    </button>
                    {filterOpen && (
                      <div className="absolute right-0 mt-2 z-30 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-3">
                          Selecione duas datas
                        </p>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">De</label>
                        <input
                          type="date"
                          value={filterFrom}
                          onChange={(e) => setFilterFrom(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Até</label>
                        <input
                          type="date"
                          value={filterTo}
                          onChange={(e) => setFilterTo(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!filterFrom || !filterTo) {
                                showAlert("warning", "Selecione as duas datas!");
                                return;
                              }
                              const from = filterFrom <= filterTo ? filterFrom : filterTo;
                              const to = filterFrom <= filterTo ? filterTo : filterFrom;
                              setActiveFilter({ from, to });
                              setFilterOpen(false);
                            }}
                            className="flex-1 bg-[#0a1d37] text-white text-xs font-extrabold uppercase tracking-wider py-2 rounded-lg hover:bg-[#0f2c52] cursor-pointer"
                          >
                            Aplicar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFilter(null);
                              setRangeSubs([]);
                              setFilterFrom("");
                              setFilterTo("");
                              setFilterOpen(false);
                            }}
                            className="flex-1 border border-slate-300 text-slate-600 text-xs font-extrabold uppercase tracking-wider py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            Limpar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {!activeFilter && (
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                      {([
                        { id: "day", label: "Diário" },
                        { id: "week", label: "Semanal" },
                        { id: "month", label: "Mensal" },
                      ] as const).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setDistPeriod(p.id)}
                          className={`px-3 py-1.5 rounded-md text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                            distPeriod === p.id
                              ? "bg-[#0a1d37] text-emerald-400 shadow"
                              : "text-slate-500 hover:text-[#0a1d37]"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {MOODS.map((mood) => {
                    const percentage = getPeriodPercentage(mood.id);
                    return (
                      <div key={mood.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{mood.emoji}</span>
                            {mood.label}
                          </span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200/50">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${moodBarColor(mood.id)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-l border-slate-100 md:pl-6 flex flex-col">
                  <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-3">
                    Volume de registros · total {periodTotal}
                  </p>
                  <div className="flex-1 flex items-end justify-between gap-2 h-56 border-b border-slate-200 pb-2">
                    {MOODS.map((mood) => {
                      const count = periodCounts[mood.id] ?? 0;
                      const heightPct = (count / periodMax) * 100;
                      return (
                        <div key={mood.id} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                          <span className="text-[10px] font-extrabold text-slate-600">{count}</span>
                          <div
                            className={`w-full rounded-t-md transition-all duration-700 ${moodBarColor(mood.id)} ${count === 0 ? "opacity-30 min-h-[4px]" : ""}`}
                            style={{ height: `${count === 0 ? 2 : Math.max(heightPct, 6)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between gap-2 mt-2">
                    {MOODS.map((mood) => (
                      <div key={mood.id} className="flex-1 text-center text-lg" title={mood.label}>
                        {mood.emoji}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <h3 className="font-extrabold text-[#0a1d37] uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                <span>☁️</span> Nuvem de tags{" "}
                <span className="text-[10px] text-slate-400 font-bold normal-case">
                  · principais motivos no período
                </span>
              </h3>
              {sortedTags.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  Nenhuma tag registrada no período selecionado.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {sortedTags.map(([tag, count]) => {
                    const scale = 0.85 + (count / tagMax) * 1.4;
                    return (
                      <span
                        key={tag}
                        title={`${count} ocorrência${count > 1 ? "s" : ""}`}
                        className="font-extrabold text-[#0a1d37] hover:text-emerald-600 transition-colors cursor-default"
                        style={{ fontSize: `${scale}rem`, lineHeight: 1.2 }}
                      >
                        {tag}
                        <span className="text-[10px] font-bold text-slate-400 ml-1 align-top">
                          {count}
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col">

                <h3 className="font-extrabold text-[#0a1d37] uppercase tracking-wider text-sm mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    ⏱️ Últimos registros efetuados
                    {activeFilter && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded normal-case">
                        {formatBR(activeFilter.from)} → {formatBR(activeFilter.to)}
                      </span>
                    )}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded font-normal">
                    {activeFilter ? "Filtrado por período" : "Sincronizado em tempo real"}
                  </span>
                </h3>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 flex-1">
                  {dashSubs.map((sub) => {
                    const moodObj = MOODS.find((m) => m.id === sub.mood) || MOODS[2];
                    return (
                      <div key={sub.id} className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl flex gap-3 transition-all">
                        <div className="text-3xl p-1 bg-white rounded-lg shadow-sm border border-slate-100 h-fit self-start">
                          {moodObj.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                              <span className="font-extrabold text-slate-800 text-sm block sm:inline">{sub.name}</span>
                              <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded ml-0 sm:ml-2">
                                {sub.employeeId}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {activeFilter ? formatBR(sub.submissionDate) : sub.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-1 italic">"{sub.comment}"</p>
                          {sub.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {sub.tags.map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {dashSubs.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      {activeFilter
                        ? "Nenhum registro encontrado nesse período."
                        : "Nenhum registro efetuado hoje."}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-[#0a1d37] text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Banco de dados oficial (5 colaboradores)
                </h3>
                <span className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded text-emerald-400">MOCK_DB</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_EMPLOYEES.map((employee) => (
                  <div key={employee.id} className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all bg-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#0a1d37] text-white font-extrabold flex items-center justify-center text-xs shrink-0">
                        {employee.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm leading-tight">{employee.name}</p>
                        <p className="text-slate-400 text-xs">{employee.department}</p>
                      </div>
                    </div>
                    <p className="italic text-slate-500 text-xs mb-2">{employee.role}</p>
                    <a
                      href={`tel:+55${employee.phone.replace(/\D/g, "")}`}
                      className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm py-2 border-y border-slate-100"
                    >
                      <span aria-hidden>📞</span> {employee.phone}
                    </a>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Crachá:</span>
                      <span className="font-mono text-xs font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg">
                        {employee.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-[#0a1d37] text-slate-400 border-t border-slate-800 py-8 px-4 mt-12 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-bold text-white text-sm">Softfocus Soluções Tecnológicas Ltda.</p>
            <p>Parque Tecnológico de Pato Branco • Rua Lídio Oltramari, 1628 - Bloco 1C</p>
            <p>Pato Branco - PR • CEP 85503-381</p>
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">CNPJ</p>
              <p className="font-mono text-white font-bold text-xs">04.962.314/0001-08</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
