"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";

/* ────── 폰트 목록 ────── */
const HEADING_FONTS = [
  { label: "Playfair Display", value: "'Playfair Display', serif", gf: "Playfair+Display:wght@400;700;900" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif", gf: "Cormorant+Garamond:wght@300;600;700" },
  { label: "Noto Serif KR", value: "'Noto Serif KR', serif", gf: "Noto+Serif+KR:wght@400;700;900" },
  { label: "Montserrat", value: "'Montserrat', sans-serif", gf: "Montserrat:wght@600;800;900" },
  { label: "DM Serif Display", value: "'DM Serif Display', serif", gf: "DM+Serif+Display" },
  { label: "Libre Baskerville", value: "'Libre Baskerville', serif", gf: "Libre+Baskerville:wght@400;700" },
];
const BODY_FONTS = [
  { label: "Noto Sans KR", value: "'Noto Sans KR', sans-serif", gf: "Noto+Sans+KR:wght@300;400;500;700" },
  { label: "Inter", value: "'Inter', sans-serif", gf: "Inter:wght@300;400;500;700" },
  { label: "Lato", value: "'Lato', sans-serif", gf: "Lato:wght@300;400;700" },
  { label: "Poppins", value: "'Poppins', sans-serif", gf: "Poppins:wght@300;400;500;700" },
  { label: "Outfit", value: "'Outfit', sans-serif", gf: "Outfit:wght@300;400;500;700" },
];

/* ────── 테마 프리셋 ────── */
const THEMES = [
  { name: "화이트 골드", bg: "#ffffff", dark: "#1a1a2e", section: "#f8f8f6", primary: "#1a1a2e", accent: "#c9a96e" },
  { name: "로즈 베이지", bg: "#fffaf7", dark: "#3d2b1f", section: "#fdf0e8", primary: "#3d2b1f", accent: "#d4896a" },
  { name: "딥 네이비", bg: "#ffffff", dark: "#0d1b3e", section: "#f0f4ff", primary: "#0d1b3e", accent: "#4f86c6" },
  { name: "에메랄드", bg: "#f7fffe", dark: "#0d3b35", section: "#e8f5f3", primary: "#0d3b35", accent: "#2a9d8f" },
  { name: "퍼플 럭스", bg: "#ffffff", dark: "#2d1b69", section: "#f5f0ff", primary: "#2d1b69", accent: "#9b5de5" },
  { name: "모던 블랙", bg: "#ffffff", dark: "#111111", section: "#f5f5f5", primary: "#111111", accent: "#ff6b35" },
];

interface Styles {
  bgMain: string; bgDark: string; bgSection: string;
  colorPrimary: string; colorAccent: string;
  colorText: string; colorTextMuted: string;
  overlayOpacity: number;
  fontHeading: string; fontBody: string;
  radiusCard: string;
}
const DEFAULT: Styles = {
  bgMain: "#ffffff", bgDark: "#1a1a2e", bgSection: "#f8f8f6",
  colorPrimary: "#1a1a2e", colorAccent: "#c9a96e",
  colorText: "#1a1a1a", colorTextMuted: "#6b6b6b",
  overlayOpacity: 0.75,
  fontHeading: "'Playfair Display', serif",
  fontBody: "'Noto Sans KR', sans-serif",
  radiusCard: "16px",
};

function buildCssVars(s: Styles) {
  return `:root{--bg-main:${s.bgMain};--bg-dark:${s.bgDark};--bg-section:${s.bgSection};--color-primary:${s.colorPrimary};--color-accent:${s.colorAccent};--color-text:${s.colorText};--color-text-muted:${s.colorTextMuted};--overlay-opacity:${s.overlayOpacity};--font-heading:${s.fontHeading};--font-body:${s.fontBody};--radius-card:${s.radiusCard};}body{background-color:var(--bg-main)!important;}`;
}

function buildHtml(base: string, s: Styles): string {
  const hf = HEADING_FONTS.find(f => f.value === s.fontHeading);
  const bf = BODY_FONTS.find(f => f.value === s.fontBody);
  const fontLinks = [hf, bf].filter(Boolean)
    .map(f => `<link href="https://fonts.googleapis.com/css2?family=${f!.gf}&display=swap" rel="stylesheet">`)
    .join("\n");

  const injected = `${fontLinks}
<style id="__ev__">${buildCssVars(s)}</style>
<script id="__eb__">(function(){
window.addEventListener("message",function(e){
if(!e.data||!e.data.__ed__)return;
if(e.data.t==="CSS"){var el=document.getElementById("__ev__");if(el)el.textContent=e.data.css;}
if(e.data.t==="EDIT"){
var on=e.data.on;
document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,span,a,li,td,th,label").forEach(function(el){
if(on){el.contentEditable="true";el.style.outline="2px dashed rgba(99,102,241,0.5)";el.style.minHeight="1em";}
else{el.contentEditable="false";el.style.outline="";el.style.minHeight="";}
});
}
if(e.data.t==="MOVE"){
var on2=e.data.on;
document.querySelectorAll(".__mv").forEach(function(b){b.remove()});
if(on2){
var secs=document.querySelectorAll("section");
if(!secs.length)secs=document.querySelectorAll("body>div");
secs.forEach(function(sec){
sec.style.position="relative";
sec.style.outline=on2?"2px dashed rgba(99,102,241,0.3)":"";
var d=document.createElement("div");d.className="__mv";
d.style.cssText="position:absolute;top:4px;right:4px;z-index:9999;display:flex;gap:4px;";
var u=document.createElement("button");u.textContent="\\u25B2";
u.style.cssText="width:28px;height:28px;border-radius:6px;background:#6366f1;color:#fff;border:none;cursor:pointer;font-size:13px;";
u.onclick=function(ev){ev.stopPropagation();var p=sec.previousElementSibling;if(p&&p.tagName!=="SCRIPT"&&p.tagName!=="STYLE")sec.parentNode.insertBefore(sec,p);};
var dn=document.createElement("button");dn.textContent="\\u25BC";
dn.style.cssText="width:28px;height:28px;border-radius:6px;background:#6366f1;color:#fff;border:none;cursor:pointer;font-size:13px;";
dn.onclick=function(ev){ev.stopPropagation();var n=sec.nextElementSibling;if(n&&n.tagName!=="SCRIPT")sec.parentNode.insertBefore(n,sec);};
d.appendChild(u);d.appendChild(dn);sec.insertBefore(d,sec.firstChild);
});
}
}
if(e.data.t==="GET"){
document.querySelectorAll(".__mv").forEach(function(b){b.remove()});
document.querySelectorAll("[contenteditable]").forEach(function(el){el.removeAttribute("contenteditable");el.style.outline="";});
window.parent.postMessage({__ed__:true,t:"HTML",html:"<!DOCTYPE html>\\n"+document.documentElement.outerHTML},"*");
}
});
})();<\/script>`;

  if (base.includes("</head>")) return base.replace("</head>", injected + "\n</head>");
  return injected + base;
}

interface PagePreviewProps {
  html: string;
  onBack: () => void;
  onRegenerate: () => void;
}

export default function PagePreview({ html, onBack, onRegenerate }: PagePreviewProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(false);
  const [showEditor, setShowEditor] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingSlices, setExportingSlices] = useState(false);
  const [styles, setStyles] = useState<Styles>({ ...DEFAULT });
  const [activeTab, setActiveTab] = useState<"theme" | "color" | "font">("theme");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const send = useCallback((data: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage({ __ed__: true, ...data }, "*");
  }, []);

  const updateStyle = useCallback(<K extends keyof Styles>(key: K, val: Styles[K]) => {
    setStyles(prev => {
      const next = { ...prev, [key]: val };
      setTimeout(() => send({ t: "CSS", css: buildCssVars(next) }), 0);
      return next;
    });
  }, [send]);

  const applyTheme = useCallback((theme: typeof THEMES[0]) => {
    const next: Styles = {
      ...styles,
      bgMain: theme.bg, bgDark: theme.dark, bgSection: theme.section,
      colorPrimary: theme.primary, colorAccent: theme.accent,
    };
    setStyles(next);
    setTimeout(() => send({ t: "CSS", css: buildCssVars(next) }), 0);
  }, [styles, send]);

  useEffect(() => { send({ t: "EDIT", on: editMode }); }, [editMode, send]);
  useEffect(() => { send({ t: "MOVE", on: moveMode }); }, [moveMode, send]);

  const getEditedHtml = useCallback((): Promise<string> => {
    return new Promise(resolve => {
      const handler = (e: MessageEvent) => {
        if (e.data?.__ed__ && e.data?.t === "HTML") {
          window.removeEventListener("message", handler);
          resolve(e.data.html as string);
        }
      };
      window.addEventListener("message", handler);
      send({ t: "GET" });
      setTimeout(() => { window.removeEventListener("message", handler); resolve(renderedHtml); }, 3000);
    });
  }, [send]); // eslint-disable-line

  const renderedHtml = useMemo(() => buildHtml(html, styles), [html, styles]);

  const downloadHtml = async () => {
    const h = await getEditedHtml();
    const blob = new Blob([h], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "product-page.html"; a.click();
    URL.revokeObjectURL(url);
  };

  const copyHtml = async () => {
    const h = await getEditedHtml();
    await navigator.clipboard.writeText(h);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const exportPng = async () => {
    setExporting(true);
    try {
      const h = await getEditedHtml();
      const res = await fetch("/api/export-png", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html: h }) });
      if (!res.ok) throw new Error("PNG 생성 실패");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "product-page-figma.png"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert("PNG 내보내기 실패: " + (e instanceof Error ? e.message : e)); }
    finally { setExporting(false); }
  };

  const exportSlices = async (format: "png" | "jpeg") => {
    setExportingSlices(true);
    try {
      const h = await getEditedHtml();
      const res = await fetch("/api/export-slices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: h, format }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "슬라이스 생성 실패");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `product-page-slices.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("슬라이스 내보내기 실패: " + (e instanceof Error ? e.message : e));
    } finally {
      setExportingSlices(false);
    }
  };

  const lineCount = html.split("\n").length;
  const sizeKb = Math.round(new Blob([html]).size / 1024);

  /* ────── ColorRow 서브 컴포넌트 ────── */
  const ColorRow = ({ label, k }: { label: string; k: keyof Styles }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded border border-gray-200 shadow-sm" style={{ background: styles[k] as string }} />
        <input type="color" value={styles[k] as string}
          onChange={e => updateStyle(k, e.target.value)}
          className="w-8 h-6 border-0 p-0 cursor-pointer rounded opacity-0 absolute" />
        <input type="text" value={styles[k] as string}
          onChange={e => { if (/^#[0-9a-f]{0,6}$/i.test(e.target.value)) updateStyle(k, e.target.value); }}
          className="w-20 text-xs border border-gray-200 rounded px-1.5 py-1 font-mono" />
      </div>
    </div>
  );

  return (
    <div className="flex gap-4 min-h-[85vh]">
      {/* ────── 에디터 패널 ────── */}
      {showEditor && (
        <div className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">🎨 디자인 편집</span>
              <button onClick={() => setShowEditor(false)} className="text-white/70 hover:text-white text-xs">✕</button>
            </div>
            <p className="text-xs text-white/70 mt-0.5">실시간으로 디자인을 변경하세요</p>
          </div>

          {/* 편집 모드 토글 */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 space-y-2">
            <button
              onClick={() => { setEditMode(!editMode); if (moveMode) setMoveMode(false); }}
              className={`w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${editMode ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}
            >
              ✏️ {editMode ? "텍스트 편집 ON" : "텍스트 편집"}
            </button>
            <button
              onClick={() => { setMoveMode(!moveMode); if (editMode) setEditMode(false); }}
              className={`w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${moveMode ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}
            >
              ↕️ {moveMode ? "위치 편집 ON — 섹션 ▲▼ 이동" : "섹션 위치 변경"}
            </button>
            {editMode && <p className="text-xs text-indigo-600 text-center">텍스트를 클릭해서 바로 수정하세요</p>}
            {moveMode && <p className="text-xs text-purple-600 text-center">섹션에 마우스를 올리면 ▲▼ 버튼이 나타납니다</p>}
          </div>

          {/* 탭 */}
          <div className="flex border-b border-gray-100">
            {(["theme", "color", "font"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-medium transition ${activeTab === tab ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>
                {tab === "theme" ? "🎨 테마" : tab === "color" ? "🖌 컬러" : "✍️ 폰트"}
              </button>
            ))}
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1 overflow-y-auto p-4">

            {/* 테마 프리셋 */}
            {activeTab === "theme" && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">클릭하면 전체 색상이 바뀝니다</p>
                {THEMES.map(theme => (
                  <button key={theme.name} onClick={() => applyTheme(theme)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 transition text-left group">
                    <div className="flex gap-1">
                      <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: theme.bg }} />
                      <div className="w-5 h-5 rounded-full" style={{ background: theme.dark }} />
                      <div className="w-5 h-5 rounded-full" style={{ background: theme.accent }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-700">{theme.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 컬러 커스텀 */}
            {activeTab === "color" && (
              <div className="space-y-1">
                <ColorRow label="배경 (메인)" k="bgMain" />
                <ColorRow label="배경 (다크 섹션)" k="bgDark" />
                <ColorRow label="배경 (서브 섹션)" k="bgSection" />
                <ColorRow label="주요 컬러" k="colorPrimary" />
                <ColorRow label="포인트 컬러" k="colorAccent" />
                <ColorRow label="본문 텍스트" k="colorText" />
                <ColorRow label="보조 텍스트" k="colorTextMuted" />
                <div className="pt-3">
                  <label className="text-xs text-gray-600 block mb-1">다크섹션 투명도 <span className="font-mono text-indigo-600">{Math.round(styles.overlayOpacity * 100)}%</span></label>
                  <input type="range" min="0" max="1" step="0.05" value={styles.overlayOpacity}
                    onChange={e => updateStyle("overlayOpacity", parseFloat(e.target.value))}
                    className="w-full accent-indigo-600" />
                </div>
                <div className="pt-2">
                  <label className="text-xs text-gray-600 block mb-1">카드 모서리 <span className="font-mono text-indigo-600">{styles.radiusCard}</span></label>
                  <input type="range" min="0" max="32" step="4"
                    value={parseInt(styles.radiusCard)}
                    onChange={e => updateStyle("radiusCard", `${e.target.value}px`)}
                    className="w-full accent-indigo-600" />
                </div>
              </div>
            )}

            {/* 폰트 */}
            {activeTab === "font" && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">제목 폰트</p>
                  {HEADING_FONTS.map(f => (
                    <button key={f.value} onClick={() => updateStyle("fontHeading", f.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition ${styles.fontHeading === f.value ? "bg-indigo-50 border border-indigo-300 text-indigo-700" : "hover:bg-gray-50 border border-transparent text-gray-700"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">본문 폰트</p>
                  {BODY_FONTS.map(f => (
                    <button key={f.value} onClick={() => updateStyle("fontBody", f.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition ${styles.fontBody === f.value ? "bg-indigo-50 border border-indigo-300 text-indigo-700" : "hover:bg-gray-50 border border-transparent text-gray-700"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 초기화 */}
          <div className="p-3 border-t border-gray-100">
            <button onClick={() => { setStyles({ ...DEFAULT }); setTimeout(() => send({ t: "CSS", css: buildCssVars(DEFAULT) }), 0); }}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 transition">
              ↺ 기본값으로 초기화
            </button>
          </div>
        </div>
      )}

      {/* ────── 미리보기 영역 ────── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* 상단 통계 */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
              ← 이전
            </button>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs font-medium">{lineCount}줄</span>
              <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs font-medium">{sizeKb}KB</span>
              <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 text-xs font-medium">✓ 반응형</span>
            </div>
          </div>
          {!showEditor && (
            <button onClick={() => setShowEditor(true)} className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition">
              🎨 에디터 열기
            </button>
          )}
        </div>

        {/* 툴바 */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2.5 flex-wrap gap-2">
          <div className="flex gap-2">
            {/* 뷰 전환 */}
            <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button onClick={() => setViewMode("desktop")}
                className={`px-3 py-1.5 text-xs transition ${viewMode === "desktop" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                🖥 데스크톱
              </button>
              <button onClick={() => setViewMode("mobile")}
                className={`px-3 py-1.5 text-xs transition ${viewMode === "mobile" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                📱 모바일
              </button>
            </div>
            <button onClick={() => setShowCode(!showCode)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${showCode ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
              {"</>"}
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={onRegenerate}
              className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              🔄 재생성
            </button>
            <button onClick={copyHtml}
              className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              {copied ? "✅ 복사됨" : "📋 코드 복사"}
            </button>
            <button onClick={downloadHtml}
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition">
              ⬇ HTML
            </button>
            <button onClick={exportPng} disabled={exporting}
              className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 transition disabled:opacity-50">
              {exporting ? "⏳ PNG 생성중..." : "🎯 Figma용 PNG"}
            </button>
            <button onClick={() => exportSlices("jpeg")} disabled={exportingSlices}
              className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:opacity-90 transition disabled:opacity-50">
              {exportingSlices ? "⏳ 슬라이스 생성중..." : "📦 스마트스토어 JPG"}
            </button>
            <button onClick={() => exportSlices("png")} disabled={exportingSlices}
              className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 transition disabled:opacity-50">
              {exportingSlices ? "⏳ 생성중..." : "📦 PNG 슬라이스"}
            </button>
          </div>
        </div>

        {/* 미리보기 / 코드 */}
        {showCode ? (
          <div className="bg-gray-950 rounded-xl p-5 overflow-auto flex-1 min-h-[600px]">
            <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap leading-relaxed">{html}</pre>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-xl overflow-hidden flex justify-center p-3 flex-1">
            <div className={`bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300 ${viewMode === "mobile" ? "w-[390px]" : "w-full"}`}
              style={{ height: viewMode === "mobile" ? "844px" : "900px" }}>
              <iframe
                ref={iframeRef}
                srcDoc={renderedHtml}
                className="w-full h-full border-0"
                title="상품페이지 미리보기"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
