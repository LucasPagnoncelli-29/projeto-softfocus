import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

const CEO_USER = "ceo";
const CEO_PASS = "ceo123";
const AUTH_KEY = "ceo-auth";

export const Route = createFileRoute("/ceo-login")({
  head: () => ({ meta: [{ title: "Área do CEO · Happiness Door" }] }),
  component: CeoLogin,
});

function CeoLogin() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(AUTH_KEY) === "1") {
      navigate({ to: "/ceo-dashboard" });
    }
  }, [navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.trim() === CEO_USER && pass === CEO_PASS) {
      localStorage.setItem(AUTH_KEY, "1");
      navigate({ to: "/ceo-dashboard" });
    } else {
      setError("Usuário ou senha inválidos");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md panel p-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-glow-magenta">◆</span>
          <h1 className="font-display text-2xl text-glow-magenta">PAINEL EXECUTIVO</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6">Acesso restrito · autenticação necessária</p>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <div className="font-display text-xs tracking-wider mb-2">▸ USUÁRIO</div>
            <input
              value={user}
              onChange={(e) => { setUser(e.target.value); setError(""); }}
              className="w-full px-4 py-3 rounded-md bg-input/60 border border-border focus:border-glow-magenta focus:outline-none"
              autoFocus
            />
          </label>
          <label className="block">
            <div className="font-display text-xs tracking-wider mb-2">▸ SENHA</div>
            <input
              type="password"
              value={pass}
              onChange={(e) => { setPass(e.target.value); setError(""); }}
              className="w-full px-4 py-3 rounded-md bg-input/60 border border-border focus:border-glow-magenta focus:outline-none"
            />
          </label>

          {error && (
            <div className="text-sm text-destructive border border-destructive/40 bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-md font-display tracking-[0.2em] text-sm bg-accent text-accent-foreground border-glow-magenta hover:opacity-90 transition"
          >
            ENTRAR
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Voltar ao registro</Link>
        </div>
        <p className="mt-6 text-[10px] text-muted-foreground/60 text-center">
          Demo: usuário <code className="text-foreground">ceo</code> · senha <code className="text-foreground">ceo123</code>
        </p>
      </div>
    </main>
  );
}
