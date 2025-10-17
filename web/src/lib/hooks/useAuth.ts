"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export function useAuth() {
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<User>("/api/users/me").then(setMe).catch(()=>setMe(null)).finally(()=>setLoading(false));
  }, []);
  return { me, loading, setMe };
}