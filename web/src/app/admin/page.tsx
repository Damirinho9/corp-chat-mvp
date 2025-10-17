"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Audit = { id:number; createdAt:string; actorId:number|null; action:string; outcome:string; targetId:number|null; resource:string|null; reason?:string|null };

export default function Admin() {
  const [rows, setRows] = useState<Audit[]>([]);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    api<Audit[]>("/api/admin/audit").then(setRows).catch(()=>setErr("Нет доступа или ошибка"));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="text-xl font-bold mb-3">Audit log</div>
      {err && <div className="text-red-600 mb-2">{err}</div>}
      <div className="overflow-auto border rounded-xl bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Время</th>
              <th className="text-left p-2">Actor</th>
              <th className="text-left p-2">Action</th>
              <th className="text-left p-2">Resource</th>
              <th className="text-left p-2">Target</th>
              <th className="text-left p-2">Outcome</th>
              <th className="text-left p-2">Reason</th>
            </tr>
          </thead>
          <tbody>
          {rows.map(r=>(
            <tr key={r.id} className="border-t">
              <td className="p-2">{new Date(r.createdAt).toLocaleString("ru-RU")}</td>
              <td className="p-2">{r.actorId ?? "-"}</td>
              <td className="p-2">{r.action}</td>
              <td className="p-2">{r.resource ?? "-"}</td>
              <td className="p-2">{r.targetId ?? "-"}</td>
              <td className="p-2">{r.outcome}</td>
              <td className="p-2">{r.reason ?? "-"}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}