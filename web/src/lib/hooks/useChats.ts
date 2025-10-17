"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Chat } from "@/lib/types";

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  useEffect(() => { api<Chat[]>("/api/chats").then(setChats).catch(()=>setChats([])); }, []);
  return { chats, setChats };
}