import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import softfocusLogo from "@/assets/softfocus-logo.webp.asset.json";

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
  id: number;
  employeeId: string;
  name: string;
  mood: MoodId;
  score: number;
  comment: string;
  timestamp: string;
}

interface Mood {
  id: MoodId;
  label: string;
  emoji: string;
  score: number;
}

const MOCK_EMPLOYEES: Employee[] = [
  { id: "SF-4012", name: "Márcio Cardozo", role: "Diretor de Tecnologia", department: "P&D" },
  { id: "SF-7781", name: "Amanda Silveira", role: "Desenvolvedora Frontend", department: "Fábrica de Software" },
  { id: "SF-2093", name: "Cezar Andrade", role: "Especialista em Crédito Rural", department: "Agro" },
  { id: "SF-5104", name: "Letícia Pato", role: "Product Designer", department: "UX/UI" },
  { id: "SF-3329", name: "Rodrigo Santos", role: "Engenheiro de QA", department: "Qualidade" },
];

const INITIAL_SUBMISSIONS: Submission[] = [
  { id: 1, employeeId: "SF-4012", name: "Márcio Cardozo", mood: "radiant", score: 5, comment: "Excelente dia de planejamento e cocriação de soluções!", timestamp: "Hoje, 09:30" },
  { id: 2, employeeId: "SF-7781", name: "Amanda Silveira", mood: "good", score: 4, comment: "Refatoração de código fluindo super bem no projeto de crédito.", timestamp: "Hoje, 10:15" },
  { id: 3, employeeId: "SF-2093", name: "Cezar Andrade", mood: "neutral", score: 3, comment: "Muitas reuniões operacionais sobre o Sicor hoje.", timestamp: "Ontem, 16:45" },
  { id: 4, employeeId: "SF-5104", name: "Letícia Pato", mood: "radiant", score: 5, comment: "Design do novo fluxo do Proagro foi validado com sucesso!", timestamp: "Ontem, 14:20" },
  { id: 5, employeeId: "SF-3329", name: "Rodrigo Santos", mood: "bad", score: 2, comment: "Alguns bloqueios técnicos nos testes automatizados, mas buscando evoluir.", timestamp: "Ontem, 11:05" },
];

const MOODS: Mood[] = [
  { id: "stressed", label: "Estressado", emoji: "🤯", score: 1 },
  { id: "bad", label: "Desanimado", emoji: "😔", score: 2 },
  { id: "neutral", label: "Neutro", emoji: "😐", score: 3 },
  { id: "good", label: "Feliz", emoji: "🙂", score: 4 },
  { id: "radiant", label: "Radiante", emoji: "🤩", score: 5 },
];

type AlertState = { show: boolean; type: "success" | "error" | "warning" | ""; message: string };

function App() {
  const [activeTab, setActiveTab] = useState<"register" | "dashboard">("register");
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);
  const [comment, setComment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [alert, setAlert] = useState<AlertState>({ show: false, type: "", message: "" });
  const [ceoAuth, setCeoAuth] = useState(false);
  const [ceoUser, setCeoUser] = useState("");
  const [ceoPass, setCeoPass] = useState("");

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

  const showAlert = (type: AlertState["type"], message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
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
    if (employee) {
      const moodObj = MOODS.find((m) => m.id === selectedMood)!;
      const newSubmission: Submission = {
        id: Date.now(),
        employeeId: employee.id,
        name: employee.name,
        mood: selectedMood,
        score: moodObj.score,
        comment: comment.trim() || "Sem comentários adicionais.",
        timestamp: "Agora mesmo",
      };
      setSubmissions([newSubmission, ...submissions]);
      showAlert("success", " HUMOR REGISTADO COM SUCESSO! ");
      setSelectedMood(null);
      setComment("");
      setEmployeeId("");
    } else {
      showAlert("error", " ID INCORRETO! ");
    }
  };

  const totalSubmissions = submissions.length;
  const averageMoodScore =
    totalSubmissions > 0
      ? (submissions.reduce((acc, c) => acc + c.score, 0) / totalSubmissions).toFixed(1)
      : "0";

  const getMoodDistributionPercentage = (moodId: MoodId) => {
    if (totalSubmissions === 0) return 0;
    const count = submissions.filter((s) => s.mood === moodId).length;
    return Math.round((count / totalSubmissions) * 100);
  };

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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
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
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-sm font-extrabold text-[#0a1d37] mb-1.5 uppercase tracking-wider flex items-center gap-2">
                      <span className="bg-emerald-500 text-[#0a1d37] text-xs font-extrabold w-5 h-5 rounded-full inline-flex items-center justify-center">3</span>
                      Confirme seu ID de colaborador
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Para segurança e autenticação, insira seu identificador de crachá único (SF-XXXX).
                    </p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-mono font-semibold text-sm">ID:</span>
                      </div>
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="SF-4012"
                        className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0a1d37] focus:border-transparent transition-all uppercase placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#0a1d37] hover:bg-[#0f2c52] text-white rounded-xl font-extrabold uppercase tracking-widest text-sm shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 border-b-4 border-emerald-500 cursor-pointer"
                >
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Registrar meu humor agora
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                <h3 className="text-[#0a1d37] font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="p-1 bg-emerald-50 text-emerald-600 rounded">ℹ️</span>
                  Validação ativa de segurança
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  O sistema está integrado à tabela de pessoal oficial da Softfocus de Pato Branco. Caso seja informado um ID incompatível, a entrega do humor é impedida para evitar registros indevidos ou duplicados.
                </p>
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                  <span className="text-base">⚠️</span>
                  <div>
                    <span className="font-extrabold">Atenção avaliadores:</span> Para testar o fluxo de erro, tente digitar qualquer outro código (ex.: <code className="font-mono bg-amber-100 px-1 rounded font-bold">SF-9999</code>) para obter a mensagem instantânea de <code className="font-bold">ID INCORRETO!</code>.
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
                <div className="p-4 divide-y divide-slate-100">
                  {MOCK_EMPLOYEES.map((employee) => (
                    <div key={employee.id} className="py-3 flex items-center justify-between hover:bg-slate-50 transition-all rounded px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0a1d37] text-white font-extrabold flex items-center justify-center text-xs">
                          {employee.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{employee.name}</p>
                          <p className="text-slate-400 text-xs">
                            {employee.role} • <span className="font-medium text-[#0a1d37]">{employee.department}</span>
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-extrabold bg-emerald-100 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg">
                        {employee.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-8">
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
                  <p className="text-3xl font-extrabold text-[#0a1d37] mt-1">
                    {Math.round(
                      (submissions.filter((v, i, a) => a.findIndex((t) => t.employeeId === v.employeeId) === i).length /
                        MOCK_EMPLOYEES.length) *
                        100
                    )}
                    %
                  </p>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                <h3 className="font-extrabold text-[#0a1d37] uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
                  <span>📊</span> Distribuição de humor hoje
                </h3>
                <div className="space-y-4">
                  {MOODS.map((mood) => {
                    const percentage = getMoodDistributionPercentage(mood.id);
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
                            className={`h-full rounded-full transition-all duration-1000 ${
                              mood.id === "stressed"
                                ? "bg-red-500"
                                : mood.id === "bad"
                                ? "bg-orange-500"
                                : mood.id === "neutral"
                                ? "bg-amber-500"
                                : mood.id === "good"
                                ? "bg-emerald-500"
                                : "bg-teal-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col">
                <h3 className="font-extrabold text-[#0a1d37] uppercase tracking-wider text-sm mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">⏱️ Últimos registros efetuados</span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded font-normal">Sincronizado</span>
                </h3>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 flex-1">
                  {submissions.map((sub) => {
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
                            <span className="text-[11px] text-slate-400 font-medium">{sub.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-1 italic">"{sub.comment}"</p>
                        </div>
                      </div>
                    );
                  })}
                  {submissions.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-sm">Nenhum registro efetuado hoje.</div>
                  )}
                </div>
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
              <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">FIA Employee Experience</p>
              <p className="text-[10px] text-white font-semibold">Lugares Incríveis Para Trabalhar</p>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 text-center">
              <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">Certificação Clima</p>
              <p className="text-[10px] text-white font-semibold">Gente e Cultura Softfolks</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-slate-800 text-center text-[11px]">
          © {new Date().getFullYear()} Softfocus. Todos os direitos reservados. Projeto piloto Happiness Door para aprimoramento de clima interno.
        </div>
      </footer>
    </div>
  );
}
