'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Danmaku } from '@/types';
import { motion } from 'framer-motion';

interface DanmakuItem extends Danmaku {
  top: number;
  delay: number;
}

interface DanmakuLayerProps {
  enabled: boolean;
}

const ANIME_COLORS = [
  { bg: 'rgba(255, 107, 157, 0.3)', border: '#ff6b9d', color: '#ff9eb5' },
  { bg: 'rgba(156, 39, 176, 0.3)', border: '#9c27b0', color: '#ce93d8' },
  { bg: 'rgba(79, 195, 247, 0.3)', border: '#4fc3f7', color: '#81d4fa' },
  { bg: 'rgba(255, 152, 0, 0.3)', border: '#ff9800', color: '#ffb74d' },
  { bg: 'rgba(255, 235, 59, 0.3)', border: '#ffeb3b', color: '#fff59d' },
  { bg: 'rgba(63, 81, 181, 0.3)', border: '#3f51b5', color: '#9fa8da' },
];

function getStyleForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return ANIME_COLORS[Math.abs(hash) % ANIME_COLORS.length];
}

const POLL_INTERVAL = 8000;
const LANE_COUNT = 12;

export function DanmakuLayer({ enabled }: DanmakuLayerProps) {
  const [danmakuList, setDanmakuList] = useState<DanmakuItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const fetchDanmaku = useCallback(async (initial = false) => {
    try {
      const res = await fetch('/api/danmaku');
      const data = await res.json();
      if (!data.danmaku) return;

      const lanes = LANE_COUNT;
      if (initial) {
        const items: DanmakuItem[] = data.danmaku.map((d: Danmaku, i: number) => ({
          ...d,
          top: (i % lanes) * (80 / lanes) + 3,
          delay: Math.floor(i / lanes) * 4,
        }));
        setDanmakuList(items);
        knownIdsRef.current = new Set(data.danmaku.map((d: Danmaku) => d.id));
      } else {
        const newItems: DanmakuItem[] = [];
        for (const d of data.danmaku) {
          if (!knownIdsRef.current.has(d.id)) {
            newItems.push({
              ...d,
              top: Math.random() * 75 + 5,
              delay: 0,
            });
            knownIdsRef.current.add(d.id);
          }
        }
        if (newItems.length > 0) {
          setDanmakuList(prev => [...prev, ...newItems]);
        }
      }
    } catch {
      // silently ignore fetch errors
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setDanmakuList([]);
      knownIdsRef.current = new Set();
      return;
    }

    fetchDanmaku(true);

    const interval = setInterval(() => fetchDanmaku(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [enabled, fetchDanmaku]);

  const sendDanmaku = useCallback(async () => {
    if (!inputValue.trim()) return;
    const res = await fetch('/api/danmaku', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: inputValue }),
    });
    const data = await res.json();
    if (data.danmaku) {
      const item: DanmakuItem = { ...data.danmaku, top: Math.random() * 75 + 5, delay: 0 };
      setDanmakuList(prev => [...prev, item]);
      knownIdsRef.current.add(data.danmaku.id);
      setInputValue('');
    }
  }, [inputValue]);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" ref={containerRef}>
      {/* 弹幕 */}
      {danmakuList.map((danmaku) => {
        const style = getStyleForId(danmaku.id);
        const duration = 14 + danmaku.speed * 2;
        return (
          <motion.div
            key={danmaku.id}
            className="absolute whitespace-nowrap"
            style={{
              top: `${danmaku.top}%`,
            }}
            initial={{ x: '100vw' }}
            animate={{ x: '-100%' }}
            transition={{
              duration: duration,
              delay: danmaku.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <span
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-full border-2 backdrop-blur-sm"
              style={{
                backgroundColor: style.bg,
                borderColor: style.border,
                color: style.color,
                textShadow: `0 0 10px ${style.border}`,
                boxShadow: `0 0 20px ${style.border}40`,
              }}
            >
              <span className="text-[11px] opacity-80">{danmaku.visitorName || '匿名'}</span>
              <span>{danmaku.content}</span>
            </span>
          </motion.div>
        );
      })}

      {/* 输入框 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10"
        >
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.slice(0, 100))}
            onKeyDown={(e) => e.key === 'Enter' && sendDanmaku()}
            placeholder="发送弹幕..."
            maxLength={100}
            className="anime-input w-64 text-sm"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={sendDanmaku}
            className="anime-btn px-6"
          >
            发送
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
