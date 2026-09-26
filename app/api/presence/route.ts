import { cached, readPresence } from "@/lib/status-server";
export async function GET() {
  return Response.json(await cached("steam", 30000, readPresence), { headers: { "Cache-Control": "no-store" } });
}
