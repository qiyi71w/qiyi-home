import type { Presence, Services, Beat, Monitor } from "./live-data";
import { siteConfig, steamProfileUrl } from "./site-config";
const cache = new Map<string, { value: Presence | Services; expires: number }>();
export async function cached<T extends Presence | Services>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  // Only completed data may cross Worker request boundaries. An in-flight promise
  // can stop progressing when the request that created it is disconnected.
  const value = await fn();
  const latest = cache.get(key);
  if (!latest || Date.parse(value.checkedAt) >= Date.parse(latest.value.checkedAt)) {
    cache.set(key, { value, expires: Date.now() + (value.error ? 10000 : ttl) });
  }
  return value;
}
async function readText(url: string, timeoutMs = 12000) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Upstream request timed out"));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      (async () => {
        const r = await fetch(url, { headers: { "Accept": "application/json, application/xml, text/xml, text/html", "User-Agent": "qiyi71w-home/1.0" }, signal: controller.signal });
        if (!r.ok) {
          void r.body?.cancel().catch(() => {});
          throw new Error(`Upstream ${r.status}`);
        }
        return await r.text();
      })(),
      deadline,
    ]);
  } finally { clearTimeout(timer); }
}
export function xmlTag(xml: string, tag: string) {
  const raw = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1] ?? "";
  return raw.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").trim();
}
function plainText(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&apos;|&#39;/gi, "'").replace(/&#(x[0-9a-f]+|\d+);/gi, (_, value: string) => {
    const code = value[0].toLowerCase() === "x" ? parseInt(value.slice(1), 16) : Number(value);
    return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  }).replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}
// Match a bounded, balanced div, so recent-games markup outside the active block is excluded.
function scopedDiv(html: string, requiredClasses: string[]) {
  const tags = /<\/?div\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = tags.exec(html))) {
    if (/^<\//.test(match[0])) continue;
    const classes = match[0].match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1].split(/\s+/) ?? [];
    if (!requiredClasses.every(c => classes.includes(c))) continue;
    const start = tags.lastIndex;
    let depth = 1;
    let next: RegExpExecArray | null;
    while ((next = tags.exec(html)) && next.index - start < 16000) {
      depth += /^<\//.test(next[0]) ? -1 : 1;
      if (depth === 0) return html.slice(start, next.index);
    }
    return null;
  }
  return null;
}
export function parseHtmlCurrentGame(html: string): string | null {
  const block = scopedDiv(html, ["profile_in_game", "in-game"]);
  if (!block) return null;
  const header = scopedDiv(block, ["profile_in_game_header"]);
  if (!header || plainText(header).toLowerCase() !== "currently in-game") return null;
  const name = scopedDiv(block, ["profile_in_game_name"]);
  return name ? plainText(name).slice(0, 300) || null : null;
}
export function parsePresence(xml: string): Presence {
  const checkedAt = new Date().toISOString();
  if (!siteConfig.steamId || xmlTag(xml, "steamID64") !== siteConfig.steamId) throw new Error("Invalid Steam response");
  const name = xmlTag(xml, "steamID") || "Steam";
  const avatarRaw = xmlTag(xml, "avatarMedium");
  const avatar = /^https:\/\/avatars\.(?:akamai\.steamstatic\.com|steamstatic\.com|cloudflare\.steamstatic\.com)\//.test(avatarRaw) ? avatarRaw : null;
  if (xmlTag(xml, "privacyState") !== "public") return { state: "unknown", name, game: null, gameImage: null, avatar, checkedAt, error: "Steam 资料未公开，无法判断在线状态。" };
  const raw = xmlTag(xml, "onlineState").toLowerCase().replace(/[-_\s]/g, "");
  const state = raw === "ingame" ? "in-game" : raw === "offline" ? "offline" : raw === "online" ? "online" : ["away", "snooze", "busy"].includes(raw) ? "away" : "unknown";
  // Only the active-game block describes current play; recent games are not presence.
  const activeGame = state === "in-game" ? xmlTag(xml, "inGameInfo") : "";
  const message = state === "in-game" ? xmlTag(xml, "stateMessage").split(/<br\s*\/?\s*>/i).slice(1).join(" ") : "";
  const game = xmlTag(activeGame, "gameName") || plainText(message) || null;
  const imageUrl = xmlTag(activeGame, "gameLogoSmall") || xmlTag(activeGame, "gameLogo") || xmlTag(activeGame, "gameIcon");
  let gameImage: string | null = null;
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      const trusted = url.hostname.endsWith(".steamstatic.com") || url.hostname === "steamcdn-a.akamaihd.net" || url.hostname === "cdn.akamai.steamstatic.com" || url.hostname === "cdn.cloudflare.steamstatic.com";
      if (trusted && ["http:", "https:"].includes(url.protocol)) { url.protocol = "https:"; gameImage = url.toString(); }
    } catch { /* Artwork is optional; preserve the game's name and presence. */ }
  }
  return { state, name, game, gameImage, avatar, checkedAt, ...(state === "unknown" ? { error: "Steam 暂未提供可识别的在线状态。" } : {}) };
}
export async function readPresence(): Promise<Presence> {
  if (!siteConfig.steamId) return { state: "unknown", name: "Steam", game: null, gameImage: null, avatar: null, checkedAt: new Date().toISOString(), error: "尚未配置 Steam 账号。" };
  try {
    const presence = parsePresence(await readText(`${steamProfileUrl}?xml=1`, 8000));
    // Steam XML sometimes omits current software, even while the public profile shows it.
    if (!presence.error && presence.state !== "offline" && !presence.game) {
      try {
        const html = await readText(`${steamProfileUrl}?l=english`, 4000);
        const game = parseHtmlCurrentGame(html);
        if (game) return { ...presence, state: "in-game", game, checkedAt: new Date().toISOString() };
      } catch { /* An optional page fallback failure must not erase a valid XML status. */ }
    }
    return presence;
  }
  catch (error) {
    console.warn("steam_presence_unavailable", error instanceof Error ? error.message : "Unknown upstream error");
    return { state: "unknown", name: "Steam", game: null, gameImage: null, avatar: null, checkedAt: new Date().toISOString(), error: "暂时无法读取 Steam，将自动重试，也可以手动刷新。" };
  }
}
export function utcTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(" ", "T");
  const ms = Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/.test(normalized) ? normalized : normalized + "Z");
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}
export function normalizeServices(config: any, heartbeats: any): Services {
  if (!Array.isArray(config.publicGroupList) || typeof heartbeats.heartbeatList !== "object" || heartbeats.heartbeatList === null) throw new Error("Invalid status response");
  const now = Date.now();
  const monitors: Monitor[] = config.publicGroupList.flatMap((g: any) => Array.isArray(g.monitorList) ? g.monitorList : []).map((m: any) => {
    const raw = heartbeats.heartbeatList[String(m.id)];
    const history: Beat[] = (Array.isArray(raw) ? raw : []).flatMap((h: any) => {
      const time = utcTime(h.time);
      return time && [0,1,2,3].includes(h.status) ? [{ status: h.status, time, ping: typeof h.ping === "number" && Number.isFinite(h.ping) ? h.ping : null }] : [];
    }).sort((a: Beat,b: Beat) => Date.parse(a.time)-Date.parse(b.time));
    const last = history.at(-1);
    // Infer cadence from recent samples so infrequent push monitors are not treated as down.
    const diffs = history.slice(-20).slice(1).map((h, i) => Date.parse(h.time) - Date.parse(history.slice(-20)[i].time)).filter(n => n > 0).sort((a,b) => a-b);
    const cadence = diffs.length ? diffs[Math.floor(diffs.length / 2)] : 300000;
    const stale = !last || now - Date.parse(last.time) > Math.max(3 * 60000, cadence * 3);
    const uptime = heartbeats.uptimeList?.[`${m.id}_24`];
    return { id: Number(m.id), name: String(m.name), type: String(m.type), status: stale ? null : last.status, lastSeen: last?.time ?? null, ping: last?.ping ?? null, uptime: typeof uptime === "number" && Number.isFinite(uptime) && uptime >= 0 && uptime <= 1 ? uptime : null, history: history.slice(-40), stale };
  });
  const incidents = (Array.isArray(config.incidents) ? config.incidents : []).slice(0,5).map((i: any) => ({ title: String(i.title || "服务公告"), content: String(i.content || "") }));
  return { monitors, incidents, checkedAt: new Date(now).toISOString() };
}
export async function readServices(): Promise<Services> {
  const statusBaseUrl = siteConfig.statusBaseUrl.replace(/\/+$/, "");
  if (!statusBaseUrl) return { monitors: [], incidents: [], checkedAt: new Date().toISOString(), error: "尚未配置服务状态页。" };
  const statusPageSlug = encodeURIComponent(siteConfig.statusPageSlug);
  try {
    const [config, heartbeats] = await Promise.all([readText(`${statusBaseUrl}/api/status-page/${statusPageSlug}`).then(JSON.parse), readText(`${statusBaseUrl}/api/status-page/heartbeat/${statusPageSlug}`).then(JSON.parse)]);
    return normalizeServices(config, heartbeats);
  } catch { return { monitors: [], incidents: [], checkedAt: new Date().toISOString(), error: "暂时无法读取监控数据。可打开完整状态页查看。" }; }
}
