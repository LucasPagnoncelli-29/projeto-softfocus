import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { EMOTIONS, addEntry, type Emotion } from "@/lib/mood-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Happiness Door · Totem" },
      { name: "description", content: "Registre como você está se sentindo hoje." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const canSubmit = name.trim().length > 0 && emotion !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addEntry({ name: name.trim(), emotion: emotion!, comment: comment.trim() || undefined });
    setSubmitted(true);
    setTimeout(() => {
      setName(""); setEmotion(null); setComment(""); setSubmitted(false);
    }, 2500);
  };

  return (
    <main className="min-h-screen px-6 py-10 md:px-12 md:py-14 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md border-glow-cyan flex items-center justify-center text-xl">🎮</div>
          <div className="font-display text-sm tracking-[0.2em] text-glow-cyan">
            HAPPINESS DOOR · TOTEM
          </div>
        </div>
        <button
          onClick={() => navigate({ to: "/ceo-login" })}
          className="text-xs md:text-sm font-display tracking-widest px-4 py-2 rounded-md border border-border hover:border-glow-magenta transition-all text-muted-foreground hover:text-foreground"
        >
          ÁREA DO CEO
        </button>
      </header>

      {/* Hero */}
      <section className="mb-10">
        <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
          COMO VOCÊ ESTÁ <span className="text-glow-cyan">SE SENTINDO</span> HOJE?
        </h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl">
          Compartilhe como você está se sentindo neste momento.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card/40 text-sm">
          <span>📅</span>
          <span className="text-glow-cyan capitalize">{today}</span>
        </div>
      </section>

      {/* Form Panel */}
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-glow-cyan">▶</span>
          <h2 className="font-display text-2xl md:text-3xl text-glow-cyan">REGISTRAR HUMOR</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-6">Identifique-se e selecione sua emoção</p>

        {/* Name */}
        <label className="block mb-6">
          <div className="font-display text-sm tracking-wider mb-2">
            ▸ NOME DO FUNCIONÁRIO <span className="text-destructive">*</span>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Digite seu nome"
            className="w-full px-4 py-3 rounded-md bg-input/60 border border-border focus:border-glow-cyan focus:outline-none transition-all"
          />
        </label>

        {/* Emotion */}
        <div className="mb-6">
          <div className="font-display text-sm tracking-wider mb-3">▸ SELECIONE SUA EMOÇÃO</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EMOTIONS.map((e) => {
              const active = emotion === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => setEmotion(e.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-5 rounded-md border transition-all ${
                    active
                      ? "border-glow-cyan bg-primary/10"
                      : "border-border bg-card/50 hover:border-primary/60"
                  }`}
                >
                  <span className="text-4xl">{e.emoji}</span>
                  <span className="font-display text-sm tracking-wider" style={{ color: active ? "var(--cyan)" : e.color }}>
                    {e.label.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment */}
        <label className="block mb-6">
          <div className="font-display text-sm tracking-wider mb-2 flex items-center justify-between">
            <span>▸ COMENTÁRIO <span className="text-muted-foreground font-sans font-normal normal-case text-xs">(opcional)</span></span>
            <span className="text-xs text-muted-foreground font-sans">{comment.length}/250</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 250))}
            placeholder="Deseja compartilhar algo sobre como está se sentindo hoje?"
            rows={3}
            className="w-full px-4 py-3 rounded-md bg-input/60 border border-border focus:border-glow-cyan focus:outline-none transition-all resize-none"
          />
        </label>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitted}
          className={`w-full py-4 rounded-md font-display tracking-[0.2em] text-sm md:text-base transition-all ${
            submitted
              ? "bg-primary/20 text-glow-cyan border border-glow-cyan"
              : canSubmit
              ? "bg-primary text-primary-foreground hover:opacity-90 border-glow-cyan"
              : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
          }`}
        >
          {submitted ? "✓ HUMOR REGISTRADO" : canSubmit ? "REGISTRAR HUMOR" : "PREENCHA NOME E EMOÇÃO"}
        </button>
      </section>

      <footer className="mt-10 text-center text-xs text-muted-foreground/70">
        Seus dados são privados. Apenas você visualiza seu registro.{" "}
        <Link to="/ceo-login" className="underline hover:text-foreground">Acesso executivo</Link>
      </footer>
    </main>
  );
}
