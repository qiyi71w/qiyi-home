export type Presence = {
  state: "online" | "offline" | "in-game" | "away" | "unknown";
  name: string; game: string | null; gameImage: string | null; avatar: string | null; checkedAt: string; error?: string;
};
export type Beat = { status: number; time: string; ping: number | null };
export type Monitor = { id: number; name: string; type: string; status: number | null; lastSeen: string | null; ping: number | null; uptime: number | null; history: Beat[]; stale: boolean };
export type Services = { monitors: Monitor[]; incidents: { title: string; content: string }[]; checkedAt: string; error?: string };
