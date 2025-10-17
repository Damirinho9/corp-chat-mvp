"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useChats } from "@/lib/hooks/useChats";
import { useMessages } from "@/lib/hooks/useMessages";
import { api, upload } from "@/lib/api";
import { connectSSE, pingPresence } from "@/lib/sse";
import type { Chat, Message, User, Attachment, IncomingEvt } from "@/lib/types";

export default function ChatApp() {
  const { me, loading } = useAuth();
  const { chats } = useChats();
  const [current, setCurrent] = useState<Chat | null>(null);
  const [recipients, setRecipients] = useState<User[]>([]);
  const [fileList, setFileList] = useState<FileList | null>(null);
  const { items, loadOlder, push } = useMessages(current?.id ?? null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [presence, setPresence] = useState<Record<number,string>>({});

  useEffect(() => {
    const es = connectSSE((evt: IncomingEvt) => {
      if (evt.type === "message") push(evt as any as Message);
      if (evt.type === "presence") setPresence(p => ({ ...p, [evt.userId]: evt.status }));
    });
    const id = setInterval(() => pingPresence(), 30000);
    let last = 0;
    const onAct = () => { const now = Date.now(); if (now - last > 10000) { last = now; pingPresence(); } };
    ["mousemove","keydown","click"].forEach(ev => window.addEventListener(ev, onAct));
    return () => { es.close(); clearInterval(id); ["mousemove","keydown","click"].forEach(ev => window.removeEventListener(ev, onAct)); };
  }, [push]);

  useEffect(() => { if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight; }, [items.length]);

  const headerSub = useMemo(() => {
    if (!current) return "";
    if (current.type === "DM") {
      // для простоты: статус подтянется при открытии DM из поиска
      return "Личные сообщения";
    }
    return current.name || "";
  }, [current]);

  async function searchUsers(q: string) {
    const list = await api<User[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
    setRecipients(list);
  }

  async function openDm(user: User) {
    const chat = await api<Chat>("/api/chats/dm", { method: "POST", body: JSON.stringify({ recipientId: user.id }) });
    setCurrent({ ...chat, name: user.displayName || user.username, type: "DM" } as any);
  }

  async function send(text: string) {
    if (!current) return;
    const attachments: number[] = [];
    if (fileList && fileList.length) {
      const up = await upload(fileList);
      up.files.forEach(f => attachments.push(f.id));
    }
    const body = { chatId: current.id, content: text, attachmentIds: attachments };
    await api("/api/messages/chat", { method: "POST", body: JSON.stringify(body) });
  }

  if (loading) return null;
  if (!me) return <div className="p-4">Не авторизован. Перейди на <a href="/login" className="text-blue-600 underline">/login</a></div>;

  return (
    <div className="max-w-[1200px] mx-auto p-4 grid grid-cols-[320px_1fr] gap-4">
      <aside className="bg-white border rounded-xl p-3">
        <div className="font-bold mb-2">Мои чаты</div>
        <ul className="space-y-2">
          {chats.map(c => (
            <li key={c.id}>
              <button className="w-full text-left border rounded-lg px-3 py-2 hover:border-blue-500"
                onClick={()=>setCurrent(c)}>
                {c.name || `Чат ${c.id}`}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <div className="font-bold mb-2">Поиск адресатов ЛС</div>
          <input className="w-full border rounded-lg px-3 py-2 mb-2" placeholder="имя или username"
            onChange={e=>searchUsers(e.target.value)} />
          <ul className="space-y-1">
            {recipients.map(u => (
              <li key={u.id}>
                <button className="w-full text-left border rounded-lg px-3 py-2 hover:border-blue-500"
                  onClick={()=>openDm(u)}>
                  {u.displayName} ({u.username})
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="bg-white border rounded-xl p-3 flex flex-col">
        <div className="flex items-center justify-between border-b pb-2 mb-2">
          <div>
            <div className="font-bold">{current?.name || "Выберите чат"}</div>
            <div className="text-sm text-gray-500">{headerSub}</div>
          </div>
          <div className="text-gray-500 text-sm">SSE: онлайн</div>
        </div>

        <div ref={messagesRef} className="flex-1 overflow-auto space-y-2">
          {items.map(m => <Msg key={m.id} meId={me.id} m={m} />)}
        </div>

        <SendBox onSend={send} onFiles={setFileList} />
      </main>
    </div>
  );
}

function Msg({ m, meId }: { m: Message; meId: number }) {
  const me = m.senderId === meId;
  return (
    <div className={`max-w-[70%] border rounded-xl px-3 py-2 ${me ? "self-end bg-blue-50 border-blue-100 ml-auto" : "bg-white"}`}>
      <div className="text-xs text-gray-500 mb-1">
        {(m.sender?.displayName || m.sender?.username || `id ${m.senderId}`)} · {new Date(m.createdAt).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
      </div>
      {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
      {!!m.attachments?.length && (
        <div className="mt-2 space-y-1">
          {m.attachments.map((a: Attachment) =>
            (a.mimeType || "").startsWith("image/") ? (
              <img key={a.id} src={a.url} alt={a.filename} className="max-w-[260px] rounded-lg" />
            ) : (
              <a key={a.id} href={a.url} target="_blank" rel="noopener" className="text-blue-600 underline">
                {a.filename} ({Math.round(a.size / 1024)} KB)
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}

function SendBox({ onSend, onFiles }: { onSend: (t: string)=>Promise<void>; onFiles: (f: FileList | null)=>void }) {
  const [text, setText] = useState("");
  return (
    <form className="flex gap-2 pt-2" onSubmit={async e => {
      e.preventDefault();
      const t = text.trim();
      if (!t) return;
      setText("");
      await onSend(t);
    }}>
      <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Сообщение..."
        autoFocus value={text} onChange={e=>setText(e.target.value)} />
      <input type="file" multiple onChange={e=>onFiles(e.target.files)} />
      <button className="bg-blue-600 text-white rounded-lg px-4">Отправить</button>
    </form>
  );
}