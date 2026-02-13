/**
 * WireframeViewer - 건축 블루프린트 스타일 인터랙티브 와이어프레임 뷰어
 * 
 * Design: Blueprint (건축 도면) 미학
 * - 네이비 배경 + 시안 라인 + 어노테이션
 * - 좌측 사이드바: IA 트리 + 페이지 네비게이션
 * - 우측 메인: 선택된 페이지의 와이어프레임
 */

import { useState } from "react";
import { wireframePages, iaTree } from "@/lib/wireframeData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Layers,
  Home,
  Building2,
  Lightbulb,
  Camera,
  Bot,
  PenLine,
  Phone,
  Info,
  Menu,
  X,
} from "lucide-react";

const pageIcons: Record<string, React.ReactNode> = {
  main: <Home size={16} />,
  about: <Building2 size={16} />,
  solution: <Lightbulb size={16} />,
  portfolio: <Camera size={16} />,
  estimator: <Bot size={16} />,
  insights: <PenLine size={16} />,
  contact: <Phone size={16} />,
};

function IATreeNode({ node, depth = 0 }: { node: { title: string; children?: { title: string; children?: { title: string }[] }[] }; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors hover:bg-[oklch(0.25_0.04_250)] ${depth === 0 ? "font-semibold text-blueprint-accent" : "text-blueprint-text/80"}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? <ChevronDown size={12} className="text-blueprint-line shrink-0" /> : <ChevronRight size={12} className="text-blueprint-line shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="annotation text-[0.68rem] leading-tight">{node.title}</span>
      </div>
      {open && hasChildren && (
        <div>
          {node.children!.map((child, i) => (
            <IATreeNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnnotationBadge({ text, color = "blue" }: { text: string; color?: "blue" | "orange" | "green" | "red" }) {
  const colors = {
    blue: "border-blueprint-line/50 bg-blueprint-line/10 text-blueprint-line",
    orange: "border-blueprint-annotation/50 bg-blueprint-annotation/10 text-blueprint-annotation",
    green: "border-blueprint-green/50 bg-blueprint-green/10 text-blueprint-green",
    red: "border-blueprint-red/50 bg-blueprint-red/10 text-blueprint-red",
  };
  return (
    <div className={`annotation border rounded px-2 py-1 ${colors[color]} max-w-xs`}>
      <div className="flex items-start gap-1">
        <Info size={10} className="shrink-0 mt-0.5" />
        <span>{text}</span>
      </div>
    </div>
  );
}

function WireElement({ el }: { el: { id: string; type: string; label: string; width?: string; annotation?: string } }) {
  const baseClass = "wire-box rounded-sm flex items-center justify-center text-center transition-all";

  const renderElement = () => {
    switch (el.type) {
      case "image":
        return (
          <div className={`img-placeholder ${el.width || "w-full"} h-full rounded-sm flex items-center justify-center`}>
            <div className="flex flex-col items-center gap-1 text-blueprint-dim">
              <Layers size={20} />
              <span className="annotation text-[0.6rem]">{el.label}</span>
            </div>
          </div>
        );
      case "button":
        return (
          <div className={`wire-solid bg-blueprint-line/15 rounded-sm px-3 py-1.5 text-blueprint-accent text-xs font-medium ${el.width || ""}`}>
            {el.label}
          </div>
        );
      case "input":
        return (
          <div className={`wire-box bg-blueprint-bg/50 rounded-sm px-3 py-1.5 text-blueprint-dim text-xs ${el.width || "w-full"}`}>
            <span className="opacity-60">{el.label}</span>
          </div>
        );
      case "select":
        return (
          <div className={`wire-box bg-blueprint-bg/50 rounded-sm px-3 py-1.5 text-blueprint-dim text-xs ${el.width || "w-full"}`}>
            <span className="opacity-60">{el.label}</span>
          </div>
        );
      case "slider":
        return (
          <div className={`${el.width || "w-full"} space-y-1`}>
            <div className="text-blueprint-dim text-xs">{el.label}</div>
            <div className="h-2 bg-blueprint-dim/30 rounded-full relative">
              <div className="absolute left-[20%] right-[30%] top-0 h-full bg-blueprint-line/40 rounded-full" />
              <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-3 h-3 bg-blueprint-line rounded-full border border-blueprint-accent" />
              <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-3 h-3 bg-blueprint-line rounded-full border border-blueprint-accent" />
            </div>
          </div>
        );
      case "card":
        return (
          <div className={`wire-box rounded-sm p-3 ${el.width || "w-full"} h-full flex flex-col items-center justify-center gap-1`}>
            <div className="img-placeholder w-full h-16 rounded-sm mb-1" />
            <span className="text-blueprint-text/70 text-[0.65rem] text-center whitespace-pre-line leading-tight">{el.label}</span>
          </div>
        );
      case "logo":
        return (
          <div className="wire-box rounded-sm px-3 py-2 flex items-center justify-center">
            <span className="text-blueprint-dim text-[0.6rem]">{el.label}</span>
          </div>
        );
      case "badge":
        return (
          <div className="wire-solid rounded-sm px-3 py-2 bg-blueprint-line/10 flex items-center justify-center">
            <span className="text-blueprint-accent text-xs font-medium text-center">{el.label}</span>
          </div>
        );
      case "chart":
        return (
          <div className={`wire-box rounded-sm p-3 ${el.width || "w-full"} h-full flex flex-col items-center justify-center gap-2`}>
            <div className="flex items-end gap-1 h-16">
              {[60, 80, 45, 70, 35, 55].map((h, i) => (
                <div key={i} className="w-5 bg-blueprint-line/30 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
            <span className="text-blueprint-dim text-[0.6rem] text-center">{el.label}</span>
          </div>
        );
      case "icon":
        return (
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 wire-box rounded-full flex items-center justify-center">
                <span className="text-[0.5rem] text-blueprint-dim">●</span>
              </div>
            ))}
            <span className="text-blueprint-dim text-[0.6rem] ml-1">{el.label}</span>
          </div>
        );
      default:
        return (
          <div className={`${el.width || "w-full"} text-blueprint-text/70 text-xs`}>
            {el.label}
          </div>
        );
    }
  };

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">{renderElement()}</div>
      {el.annotation && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="shrink-0">
              <AnnotationBadge text={el.annotation} color="orange" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-[oklch(0.22_0.04_250)] border-blueprint-line/30 text-blueprint-text max-w-sm">
            <p className="text-xs">{el.annotation}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function WireSection({ section, index }: { section: typeof wireframePages[0]["sections"][0]; index: number }) {
  const sectionTypeLabels: Record<string, string> = {
    hero: "HERO",
    stats: "STATS",
    logos: "LOGOS",
    cards: "CARDS",
    form: "FORM",
    text: "TEXT",
    grid: "GRID",
    cta: "CTA",
    timeline: "TIMELINE",
    calculator: "CALCULATOR",
    tabs: "TABS",
    map: "MAP",
    filter: "FILTER",
    footer: "FOOTER",
  };

  const getChildLayout = () => {
    if (!section.children) return null;
    switch (section.type) {
      case "logos":
        return (
          <div className="flex flex-wrap gap-2 justify-center">
            {section.children.map((el) => (
              <WireElement key={el.id} el={el} />
            ))}
          </div>
        );
      case "cards":
      case "grid":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {section.children.map((el) => (
              <WireElement key={el.id} el={el} />
            ))}
          </div>
        );
      case "stats":
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {section.children.map((el) => (
              <WireElement key={el.id} el={el} />
            ))}
          </div>
        );
      case "filter":
        return (
          <div className="flex flex-wrap gap-2">
            {section.children.map((el) => (
              <WireElement key={el.id} el={el} />
            ))}
          </div>
        );
      case "tabs":
        return (
          <div className="space-y-3">
            <div className="flex gap-2 border-b border-blueprint-line/20 pb-2">
              {section.children.map((el, i) => (
                <div key={el.id} className={`annotation px-3 py-1 rounded-t-sm ${i === 0 ? "bg-blueprint-line/20 text-blueprint-accent border-b-2 border-blueprint-line" : "text-blueprint-dim"}`}>
                  {el.label.split("\n")[0]}
                </div>
              ))}
            </div>
            {section.children[0] && (
              <div className="wire-box rounded-sm p-3">
                <WireElement el={section.children[0]} />
              </div>
            )}
          </div>
        );
      case "timeline":
        return (
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-blueprint-line/30" />
            {section.children.map((el, i) => (
              <div key={el.id} className="relative mb-4 last:mb-0">
                <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-blueprint-line border-2 border-blueprint-bg" />
                <WireElement el={el} />
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="space-y-3">
            {section.children.map((el) => (
              <WireElement key={el.id} el={el} />
            ))}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative"
    >
      {/* Section container */}
      <div className="wire-solid rounded-sm bg-[oklch(0.19_0.04_250)] overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-blueprint-line/20 bg-blueprint-line/5">
          <div className="flex items-center gap-2">
            <span className="annotation text-blueprint-line/60 text-[0.6rem]">{sectionTypeLabels[section.type] || "SECTION"}</span>
            <span className="text-blueprint-accent text-xs font-medium">{section.title}</span>
          </div>
          <span className="annotation text-blueprint-dim text-[0.55rem]">h: {section.height}px</span>
        </div>

        {/* Section content */}
        <div className="p-4 space-y-3" style={{ minHeight: `${Math.min(section.height * 0.4, 200)}px` }}>
          {getChildLayout()}
        </div>

        {/* Section annotation */}
        {section.annotation && (
          <div className="px-4 pb-3">
            <AnnotationBadge text={section.annotation} color="blue" />
          </div>
        )}
      </div>

      {/* Dimension line (decorative) */}
      <div className="absolute -right-6 top-0 bottom-0 flex flex-col items-center justify-center opacity-30">
        <div className="w-px flex-1 bg-blueprint-line/40" />
        <span className="annotation text-blueprint-line text-[0.5rem] py-1 -rotate-90 whitespace-nowrap">{section.height}px</span>
        <div className="w-px flex-1 bg-blueprint-line/40" />
      </div>
    </motion.div>
  );
}

export default function WireframeViewer() {
  const [activePageId, setActivePageId] = useState("main");
  const [showIA, setShowIA] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const activePage = wireframePages.find((p) => p.id === activePageId) || wireframePages[0];

  return (
    <div className="h-screen flex overflow-hidden bg-background blueprint-grid">
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded bg-[oklch(0.20_0.04_250)] border border-blueprint-line/30 text-blueprint-line"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed lg:relative z-40 w-72 h-full bg-[oklch(0.15_0.04_250)] border-r border-blueprint-line/20 flex flex-col shrink-0"
          >
            {/* Sidebar header */}
            <div className="p-4 border-b border-blueprint-line/20">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className="text-blueprint-accent" />
                <span className="text-blueprint-accent font-semibold text-sm">(주)고감도</span>
              </div>
              <span className="annotation text-blueprint-dim">홈페이지 리뉴얼 와이어프레임 v1.0</span>
            </div>

            {/* Page navigation */}
            <div className="p-3 border-b border-blueprint-line/20">
              <span className="annotation text-blueprint-line/60 text-[0.6rem] uppercase tracking-wider mb-2 block">Pages</span>
              <div className="space-y-0.5">
                {wireframePages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => {
                      setActivePageId(page.id);
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm text-left transition-all text-xs ${
                      activePageId === page.id
                        ? "bg-blueprint-line/20 text-blueprint-accent border border-blueprint-line/30"
                        : "text-blueprint-text/70 hover:bg-[oklch(0.20_0.04_250)] hover:text-blueprint-text border border-transparent"
                    }`}
                  >
                    <span className="shrink-0">{pageIcons[page.id]}</span>
                    <span>{page.title}</span>
                    <span className="annotation text-blueprint-dim ml-auto text-[0.55rem]">{page.titleEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* IA Tree */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <button
                onClick={() => setShowIA(!showIA)}
                className="flex items-center gap-2 px-4 py-2 text-left hover:bg-[oklch(0.20_0.04_250)] transition-colors"
              >
                {showIA ? <ChevronDown size={12} className="text-blueprint-line" /> : <ChevronRight size={12} className="text-blueprint-line" />}
                <span className="annotation text-blueprint-line/60 text-[0.6rem] uppercase tracking-wider">Information Architecture</span>
              </button>
              {showIA && (
                <ScrollArea className="flex-1 px-1 pb-3">
                  <IATreeNode node={iaTree} />
                </ScrollArea>
              )}
            </div>

            {/* Sidebar footer */}
            <div className="p-3 border-t border-blueprint-line/20">
              <div className="annotation text-blueprint-dim text-[0.55rem] space-y-0.5">
                <div>작성일: 2026.02.14</div>
                <div>작성: Manus AI</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-blueprint-line inline-block" /> 링크/기능
                  <span className="w-2 h-2 rounded-full bg-blueprint-annotation inline-block ml-2" /> 어노테이션
                  <span className="w-2 h-2 rounded-full bg-blueprint-green inline-block ml-2" /> 콘텐츠
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Top bar */}
        <div className="shrink-0 px-6 py-3 border-b border-blueprint-line/20 bg-[oklch(0.16_0.04_250)] flex items-center justify-between">
          <div className="flex items-center gap-3 ml-10 lg:ml-0">
            <span className="text-blueprint-accent font-semibold text-sm">{activePage.title}</span>
            <span className="annotation text-blueprint-dim">{activePage.titleEn}</span>
          </div>
          <div className="annotation text-blueprint-dim text-[0.6rem] hidden sm:block">
            섹션 {activePage.sections.length}개 | {activePage.description}
          </div>
        </div>

        {/* Wireframe canvas */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-6 pr-12 space-y-4">
            {/* Page title card */}
            <motion.div
              key={activePage.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="wire-solid rounded-sm p-4 bg-blueprint-line/5 mb-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{wireframePages.find(p => p.id === activePage.id)?.icon}</span>
                <h1 className="text-blueprint-accent font-bold text-lg">{activePage.title}</h1>
                <span className="annotation text-blueprint-dim ml-2">{activePage.titleEn}</span>
              </div>
              <p className="text-blueprint-text/60 text-xs">{activePage.description}</p>
              <div className="mt-2 annotation text-blueprint-dim text-[0.55rem]">
                URL: /{activePage.id === "main" ? "" : activePage.id} | 섹션: {activePage.sections.length}개
              </div>
            </motion.div>

            {/* Sections */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {activePage.sections.map((section, i) => (
                  <WireSection key={section.id} section={section} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Bottom spacing */}
            <div className="h-12" />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
