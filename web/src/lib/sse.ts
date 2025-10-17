export function connectSSE(onEvent: (e: any)=>void) {
  const es = new EventSource("/api/events", { withCredentials: true });
  es.onmessage = (ev) => {
    try { const j = JSON.parse(ev.data); onEvent(j); } catch {}
  };
  es.onerror = () => { /* авто реконнект handled by browser */ };
  return es;
}
export async function pingPresence() {
  try { await fetch("/api/presence/ping", { method: "POST", credentials: "include" }); } catch {}
}