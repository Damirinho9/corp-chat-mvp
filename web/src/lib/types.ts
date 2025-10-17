export type User = { id: number; username: string; displayName: string; role: string; departmentId: number | null; status?: string };
export type Chat = { id: number; name: string; type: "DM" | "GROUP"; departmentId?: number | null };
export type Attachment = { id: number; url: string; filename: string; mimeType: string; size: number; width?: number; height?: number };
export type Message = {
  id: number; chatId: number; senderId: number;
  sender?: { id: number; username: string; displayName: string };
  content: string; createdAt: string;
  attachments?: Attachment[];
};
export type PresenceEvt = { type: "presence"; userId: number; status: "ONLINE" | "OFFLINE" | "AWAY"; at: string };
export type IncomingEvt = PresenceEvt | { type: "message"; [k: string]: any };