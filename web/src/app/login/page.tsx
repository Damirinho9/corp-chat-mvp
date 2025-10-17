"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const r = useRouter();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) { setErr("Ошибка входа"); return; }
    r.replace("/app");
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={submit} className="bg-white border rounded-xl p-6 w-[360px] space-y-3">
        <div className="font-bold text-lg">Войти</div>
        <input className="w-full border rounded-lg p-2" placeholder="username" value={username} onChange={e=>setU(e.target.value)} />
        <input className="w-full border rounded-lg p-2" placeholder="password" type="password" value={password} onChange={e=>setP(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full bg-blue-600 text-white rounded-lg py-2">Войти</button>
      </form>
    </div>
  );
}