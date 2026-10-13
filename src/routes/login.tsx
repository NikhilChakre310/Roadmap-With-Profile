import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { meta } from "@/lib/meta";
import { HEAT } from "@/lib/stats";

export const Route = createFileRoute("/login")({
  head: () =>
    meta("Sign in", "Sign in to DevRoadmap to track your learning, projects and coding practice."),
  component: Login,
});

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          });
    setBusy(false);
    if (res.error) return void toast.error(res.error.message);
    if (mode === "up" && !res.data.session)
      toast.success("Check your email to confirm your account.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) toast.error(String(r.error.message ?? r.error));
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r bg-sidebar p-10 lg:flex">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md glow-line" />
          <span className="font-display text-lg font-semibold">DevRoadmap</span>
        </div>
        <div>
          <p className="stat-label">Test Engineer → Full Stack → AI Engineer</p>
          <h1 className="mt-3 max-w-md text-4xl font-semibold leading-tight">
            Learn every day. Build every month. Track every improvement.
          </h1>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            8 months · 8 milestone projects · 3 project slots for every topic.
          </p>
        </div>
        <div className="grid max-w-xs grid-cols-14 gap-1">
          {Array.from({ length: 98 }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-sm ${HEAT[[0, 1, 0, 2, 3, 0, 4, 1][(i * 7 + (i >> 2)) % 8]!]}`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h2 className="text-2xl font-semibold">
            {mode === "in" ? "Welcome back" : "Create your account"}
          </h2>
          <Button type="button" variant="outline" className="w-full" onClick={google}>
            Continue with Google
          </Button>
          <div className="stat-label text-center">or</div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input
              id="pw"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
          >
            {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
