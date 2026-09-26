import { cached, readServices } from "@/lib/status-server";
export async function GET() {
  return Response.json(await cached("services", 60000, readServices), { headers: { "Cache-Control": "no-store" } });
}
