"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Gamepad2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Presence, Services } from "@/lib/live-data";
import { steamProfileUrl } from "@/lib/site-config";
function clock(value?: string) { return value ? new Date(value).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : ""; }
function useLive<T>(url: string, interval: number) {
  const [data, setData] = useState<T | null>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (controller.current) return;
    setBusy(true);
    const c = new AbortController(); controller.current = c;
    const timeout = setTimeout(() => c.abort(), 18000);
    try {
      const r = await fetch(url, { cache: "no-store", signal: c.signal });
      if (!r.ok) throw new Error("Unavailable");
      const next = await r.json();
      if (controller.current === c) { setData(next as T); setFailed(false); }
    } catch { if (controller.current === c) setFailed(true); }
    finally {
      clearTimeout(timeout);
      if (controller.current === c) { controller.current = null; setBusy(false); setNow(Date.now()); }
    }
  }, [url]);
  useEffect(() => {
    refresh();
    const timer = setInterval(() => { setNow(Date.now()); if (!document.hidden) refresh(); }, interval);
    const resume = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", resume);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", resume);
      const previous = controller.current;
      controller.current = null;
      previous?.abort();
    };
  }, [refresh, interval]);
  return { data, busy, failed, now, refresh };
}
function Refresh({busy, refresh, label}: {busy: boolean; refresh: () => void; label: string}) {
  return <Button variant="ghost" size="sm" className="refresh-button" onClick={refresh} disabled={busy} aria-label={label}><RefreshCw size={13} className={busy ? "spinning" : ""}/><span>{busy ? "刷新中" : "刷新"}</span></Button>;
}
function SteamStatus() {
  const {data, busy, failed, now, refresh} = useLive<Presence>("/api/presence", 60000);
  const stale = !!data && now - Date.parse(data.checkedAt) > 180000;
  const unavailable = failed || stale || !!data?.error;
  const state = unavailable ? "unknown" : data?.state;
  const labels: Record<string,string> = { online: "现在在线", offline: "当前离线", "in-game": "游戏中", away: "暂时离开", unknown: "状态未知" };
  const online = state === "online" || state === "in-game";
  const identity = <>
    {data?.avatar ? <img src={data.avatar} width={36} height={36} alt="Steam 头像"/> : <Gamepad2 size={32}/>}
    <div><p>{data?.name || "Steam 个人主页"}</p><small>Steam 个人主页</small></div>
  </>;
  return <aside className="steam-card" aria-label="Steam 在线状态">
    <div className="card-label"><span>此刻 / NOW</span><Gamepad2 size={20}/></div>
    <div aria-live="polite">
      <h2 className="presence-title"><span className={`state-dot ${online ? "up" : state === "away" ? "pending" : ""}`}/>{data || failed ? labels[state || "unknown"] : "正在连接"}</h2>
      <p className="presence-subtitle">{unavailable ? "Steam 状态暂不可用" : state === "in-game" ? "Steam 正在运行游戏" : state === "online" ? "Steam 已上线" : state === "offline" ? "Steam 显示离线或隐身" : state === "away" ? "Steam 显示离开或忙碌" : "正在读取 Steam 公开状态"}</p>
      {state === "in-game" && <div className="game-activity">
        {data?.gameImage ? <img className="game-art" src={data.gameImage} width={76} height={46} alt="" onError={e => { e.currentTarget.style.display = "none"; }}/> : <Gamepad2 size={26}/>}
        <div className="game-copy"><small>正在玩</small><strong>{data?.game || "游戏名称未公开"}</strong></div>
      </div>}
      {(state === "online" || state === "away") && <div className="game-activity game-idle"><Gamepad2 size={22}/><div className="game-copy"><small>游戏活动</small><span>暂无公开的游戏活动</span></div></div>}
    </div>
    {steamProfileUrl ? <a className="steam-identity" href={steamProfileUrl} target="_blank" rel="noreferrer">{identity}<ArrowUpRight size={17}/></a> : <div className="steam-identity">{identity}</div>}
    {unavailable && <p className="error-detail">{data?.error || "连接暂时中断，请稍后刷新。"}</p>}
    <div className="steam-footer"><span>{data ? `${clock(data.checkedAt)} 更新` : "每分钟自动更新"}</span><Refresh busy={busy} refresh={refresh} label="刷新 Steam 状态"/></div>
  </aside>;
}
const stateClass = (status: number | null) => status === 1 ? "up" : status === 0 ? "down" : status === 2 ? "pending" : status === 3 ? "maintenance" : "unknown";
const stateName = (status: number | null) => status === 1 ? "运行正常" : status === 0 ? "服务异常" : status === 2 ? "检测中" : status === 3 ? "维护中" : "状态未知";
function ServiceStatus() {
  const { data, busy, failed, now, refresh } = useLive<Services>("/api/services", 60000);
  const stale = !!data && now - Date.parse(data.checkedAt) > 180000;
  const unavailable = failed || stale || !!data?.error;
  const monitors = data?.monitors ?? [];
  const allUp = monitors.length > 0 && monitors.every(m => m.status === 1) && !unavailable;
  const someDown = monitors.some(m => m.status === 0) && !unavailable;
  const known = monitors.filter(m => m.status !== null).length;
  const summary = unavailable ? "监控数据暂不可用" : !data ? "正在读取服务状态" : !monitors.length ? "暂无公开监控项" : allUp ? "所有服务运行正常" : someDown ? "部分服务出现异常" : known < monitors.length ? "部分服务状态未知" : monitors.some(m => m.status === 3) ? "部分服务维护中" : "部分服务检测中";
  return <div>
    <div className="service-box">
      <div className="service-summary"><div className="summary-main" role="status"><span className={`state-dot ${allUp ? "up" : someDown ? "down" : ""}`}/>{summary}</div><div className="summary-meta"><span>{monitors.length ? `${unavailable ? "?" : monitors.filter(m => m.status === 1).length} / ${monitors.length} 正常` : ""}</span><Refresh busy={busy} refresh={refresh} label="刷新服务状态"/></div></div>
      {data?.incidents.map((i,index) => <div className="incident" key={index}><b>{i.title}</b>{i.content}</div>)}
      {!data && !failed && <div className="service-empty" aria-label="正在加载监控"><Skeleton className="loading-block w-2/3"/><Skeleton className="loading-block w-1/2"/></div>}
      {unavailable && <div className="service-empty">{data?.error || "连接暂时中断，下方记录为上次读取结果。请刷新或访问完整状态页。"}</div>}
      {data && !monitors.length && !unavailable && <div className="service-empty">状态页目前没有公开的服务。</div>}
      {monitors.map(m => {
        const status = unavailable ? null : m.status;
        return <div className="monitor-row" key={m.id}>
          <div className="monitor-name">{m.name}<small>{m.type === "push" ? "主动上报" : m.type === "port" ? "TCP 端口监测" : "HTTP 服务监测"}{m.ping !== null && !unavailable && !m.stale ? ` · ${m.ping} ms` : ""}</small></div>
          <div className="uptime-bars" role="img" aria-label={`${m.name} 最近 ${m.history.length} 次监测记录，${m.history.filter(h => h.status === 0).length} 次异常`}>
            {m.history.length ? m.history.map((h,i) => <span key={i} className={stateClass(h.status)} title={`${new Date(h.time).toLocaleString("zh-CN")} · ${stateName(h.status)}`}/>) : <span/>}
          </div>
          <div className="monitor-end"><b className={stateClass(status)}>{stateName(status)}</b><small title={m.lastSeen ? `最后监测：${new Date(m.lastSeen).toLocaleString("zh-CN")}` : "尚无监测记录"}>{m.stale ? "监测数据已过期" : m.uptime === null ? "可用率暂无数据" : `24h 可用率 ${(m.uptime * 100).toFixed(2)}%`}</small></div>
        </div>;
      })}
    </div>
    <div className="service-caption"><span>来自 Uptime Kuma{data ? ` · ${clock(data.checkedAt)} 更新` : ""} · 每分钟刷新</span><span className="history-legend"><span><i/>正常</span><span><i className="fault"/>异常</span><span><i className="missing"/>无数据</span></span><span>最近 40 次监测 →</span></div>
  </div>;
}
export function LiveStatus({ kind }: { kind: "steam" | "services" }) { return kind === "steam" ? <SteamStatus/> : <ServiceStatus/>; }
