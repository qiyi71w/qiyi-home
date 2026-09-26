import { cached, readPresence, readServices } from "../lib/status-server";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/api/")) {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
      }
      if (pathname === "/api/presence") {
        return Response.json(await cached("steam", 30000, readPresence), {
          headers: { "Cache-Control": "no-store" },
        });
      }
      if (pathname === "/api/services") {
        return Response.json(await cached("services", 60000, readServices), {
          headers: { "Cache-Control": "no-store" },
        });
      }
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return env.ASSETS.fetch(request);
  },
};
