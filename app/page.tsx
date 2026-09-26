import { ArrowDown, ArrowUpRight, Code2 as Github, Mail, MapPin, GraduationCap, ScanLine, ChartNoAxesCombined, Layers } from "lucide-react";
import { LiveStatus } from "./status";
import { ThemeToggle } from "./theme";
import { siteConfig, statusPageUrl } from "@/lib/site-config";
const repo = "https://github.com/wimi321/lizzieyzy-next";
export default function Home() {
  return <div className="site-shell">
    <a className="skip-link" href="#main">跳至主要内容</a>
    <header className="site-header">
      <a href="#about" className="wordmark" aria-label="qiyi71w 首页"><span className="brand-icon">q.</span>qiyi71w<span className="slash">/</span><span className="home-label">个人主页</span></a>
      <div className="header-actions"><nav aria-label="主导航"><a href="#about">关于</a><a href="#project">项目</a><a href="#services">状态</a><a href="https://github.com/qiyi71w" target="_blank" rel="noreferrer" aria-label="访问我的 GitHub"><Github size={19}/></a></nav><ThemeToggle/></div>
    </header>
    <main id="main">
      <section id="about" className="hero">
        <div className="intro">
          <div className="intro-kicker"><img src="/favicon.svg" width="42" height="42" alt="qiyi71w 标志"/><span>你好，很高兴在这里遇见你。</span></div>
          <h1>qiyi71w<span>.</span></h1>
          <p className="intro-copy">参与 LizzieYzy Next 的 readboard 维护与优化。<br className="desktop-break"/>这里是我的项目、在线动态，以及正在运行的小服务。</p>
          {(siteConfig.location || siteConfig.education) && <div className="profile-meta">{siteConfig.location && <span><MapPin size={15}/>{siteConfig.location}</span>}{siteConfig.education && <span><GraduationCap size={16}/>{siteConfig.education}</span>}</div>}
          <a className="text-link hero-link" href="#project">看看我参与的项目 <ArrowDown size={16}/></a>
        </div>
        <LiveStatus kind="steam"/>
      </section>
      <section id="project" className="project-section">
        <div className="section-title"><h2><span className="section-index">01</span>参与的项目</h2><span className="eyebrow">OPEN SOURCE / GO</span></div>
        <article className="project-card">
          <div className="project-visual">
            <a href={repo} target="_blank" rel="noreferrer" className="screenshot-link" aria-label="查看 LizzieYzy Next 项目"><img src="/images/lizzieyzy.webp" alt="LizzieYzy Next 实际界面，展示围棋棋盘、AI 推荐落点和胜率曲线" width="1065" height="700"/></a>
          </div>
          <div className="project-info">
            <div className="project-tags"><span>围棋 AI</span><span>开源项目</span></div>
            <h3>LizzieYzy <span>Next</span></h3>
            <p className="project-description">基于 LizzieYzy 与 KataGo 的围棋 AI 复盘工具。从获取棋谱到全盘分析，让棋局中的关键变化更清楚。</p>
            <ul className="feature-list"><li><ScanLine size={18}/><span>野狐昵称抓谱</span></li><li><Layers size={18}/><span>快速全盘分析</span></li><li><ChartNoAxesCombined size={18}/><span>胜率与问题手概览</span></li></ul>
            <p className="contribution"><span>我的参与</span>readboard 持续维护与优化</p>
            <div className="project-actions"><a className="primary-link" href={repo} target="_blank" rel="noreferrer"><Github size={17}/>GitHub 仓库<ArrowUpRight size={16}/></a><a className="text-link" href={repo + "/releases"} target="_blank" rel="noreferrer">下载版本<ArrowUpRight size={16}/></a></div>
            <p className="project-platforms">Windows · macOS · Linux<span>GPL-3.0</span></p>
          </div>
        </article>
      </section>
      <section id="services" className="services-section">
        <div className="section-title"><h2><span className="section-index">02</span>服务状态</h2>{statusPageUrl && <a className="text-link" href={statusPageUrl} target="_blank" rel="noreferrer">完整状态页<ArrowUpRight size={16}/></a>}</div>
        <LiveStatus kind="services"/>
      </section>
    </main>
    <footer>
      <a className="footer-brand" href="#about">qiyi71w<span>.</span></a>
      <span>代码、棋局，以及日常。</span>
      <div className="footer-contacts">
        {siteConfig.email && <a href={`mailto:${siteConfig.email}`} aria-label={`发送邮件至 ${siteConfig.email}`}><Mail size={16} aria-hidden="true"/><span>{siteConfig.email}</span></a>}
        <a href="https://github.com/qiyi71w" target="_blank" rel="noreferrer">在 GitHub 找到我<ArrowUpRight size={14} aria-hidden="true"/></a>
      </div>
    </footer>
  </div>;
}
