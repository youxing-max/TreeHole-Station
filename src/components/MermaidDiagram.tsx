'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

let mermaidInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureMermaidReady(): Promise<typeof import('mermaid')['default']> {
  const mermaid = (await import('mermaid')).default;
  if (!mermaidInitialized) {
    if (!initPromise) {
      initPromise = new Promise<void>((resolve) => {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#ff6b9d',
            primaryTextColor: '#fff',
            primaryBorderColor: '#ff6b9d',
            lineColor: '#81d4fa',
            secondaryColor: '#1a1a2e',
            tertiaryColor: '#2d2d44',
            background: '#0a0a1a',
            mainBkg: '#1a1a2e',
            nodeBorder: '#ff6b9d',
            clusterBkg: '#1a1a2e',
            clusterBorder: '#ff6b9d',
            titleColor: '#fff',
            edgeLabelBackground: '#1a1a2e',
          },
          fontFamily: 'Noto Sans SC, sans-serif',
          securityLevel: 'loose',
        });
        mermaidInitialized = true;
        resolve();
      });
    }
    await initPromise;
  }
  return mermaid;
}

let renderCounter = 0;

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  const renderDiagram = useCallback(async () => {
    if (!chart.trim()) return;

    try {
      const mermaid = await ensureMermaidReady();
      const id = `mermaid-${++renderCounter}-${Date.now()}`;

      const { svg: renderedSvg } = await mermaid.render(id, chart.trim());
      setSvg(renderedSvg);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const detail = (err as { str?: string })?.str;
      setError(detail || message || 'Mermaid 渲染失败');
    }
  }, [chart]);

  useEffect(() => {
    let cancelled = false;

    renderDiagram().then(() => {
      if (cancelled) return;
    });

    return () => { cancelled = true; };
  }, [renderDiagram]);

  useEffect(() => {
    if (svg && containerRef.current) {
      containerRef.current.innerHTML = svg;
    }
  }, [svg]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-400">
        <p className="font-medium mb-1">流程图渲染失败</p>
        <pre className="text-xs overflow-x-auto whitespace-pre-wrap opacity-70">{chart}</pre>
        {error && <p className="text-xs mt-1 opacity-50">{error}</p>}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container my-4 flex justify-center overflow-x-auto rounded-xl border border-[#ff6b9d]/20 bg-[#0a0a1a]/80 p-4"
    />
  );
}
