export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}
export async function upload(files: FileList | File[]) {
  const fd = new FormData();
  Array.from(files as any).forEach(f => fd.append("files", f));
  const r = await fetch("/api/uploads", { method: "POST", body: fd, credentials: "include" });
  if (!r.ok) throw new Error("upload_failed");
  return r.json() as Promise<{ files: { id: number }[] }>;
}