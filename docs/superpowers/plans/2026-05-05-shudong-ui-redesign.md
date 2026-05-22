# 树洞小站界面美化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将树洞小站从粉紫AI风格转变为温暖、人文、非AI感的现代编辑式杂志风格

**Architecture:** 保持所有后端API接口不变，仅修改前端视觉系统。采用温暖的暖色调配色、衬线字体、编辑式排版和精致的动效。

**Tech Stack:** Next.js 14 + Tailwind CSS + shadcn/ui + Framer Motion

**设计方向:** 编辑式杂志风格 (Editorial/Magazine)
- 温暖的纸质质感背景
- 暖色调：琥珀、陶土、奶油色
- 衬线字体用于标题，无衬线用于正文
- 大量留白和呼吸感
- 精致的悬停和交互动效

---

## 文件结构映射

| 文件 | 职责 | 修改类型 |
|------|------|----------|
| `src/app/globals.css` | 全局CSS变量、颜色系统、字体、动画 | 重写 |
| `src/app/layout.tsx` | 根布局、字体配置 | 修改 |
| `src/app/page.tsx` | 主页面结构、布局 | 修改 |
| `src/components/WelcomePage.tsx` | 欢迎页面 | 重写 |
| `src/components/message/MessageForm.tsx` | 留言表单 | 修改 |
| `src/components/message/MessageCard.tsx` | 留言卡片 | 修改 |
| `src/components/message/MessageTimeline.tsx` | 留言列表 | 轻微修改 |
| `src/components/message/DanmakuLayer.tsx` | 弹幕层 | 轻微修改 |
| `src/components/ui/card.tsx` | 卡片组件 | 修改 |
| `src/components/ui/button.tsx` | 按钮组件 | 修改 |

---

## Task 1: 建立新的设计系统 (globals.css)

**Files:**
- Modify: `src/app/globals.css:1-325`

**设计系统规格:**
- 背景：暖奶油色渐变 (#fefcf8 → #fdf9f3)
- 主色：琥珀/陶土 (#d4863c, #c4732f)
- 文字：深墨色 (#2c2416, #3d3225, #5c4d3c)
- 强调色：暖珊瑚 (#e07a5f)
- 字体：标题使用衬线字体，正文使用无衬线
- 圆角：更克制 (8-12px)
- 阴影：柔和、温暖的方向性阴影

- [ ] **Step 1.1: 重写CSS变量系统**

```css
:root {
  /* Warm Editorial Color System */
  --paper: #fefcf8;
  --paper-warm: #fdf9f3;
  --paper-deep: #f5f0e8;
  --ink: #2c2416;
  --ink-light: #3d3225;
  --ink-muted: #5c4d3c;
  --ink-subtle: #8b7355;
  
  /* Accent Colors */
  --amber: #d4863c;
  --amber-deep: #b87333;
  --amber-light: #e8a87c;
  --terracotta: #c4732f;
  --coral: #e07a5f;
  --coral-soft: #e8a090;
  --sage: #7a9e7e;
  --sage-muted: #9fb4a2;
  
  /* Surface Colors */
  --surface-elevated: #ffffff;
  --surface-card: rgba(255, 255, 255, 0.8);
  --surface-muted: rgba(245, 240, 232, 0.6);
  
  /* Border Colors */
  --border-subtle: rgba(139, 115, 85, 0.12);
  --border-light: rgba(139, 115, 85, 0.2);
  --border-medium: rgba(139, 115, 85, 0.3);
  
  /* Shadow System */
  --shadow-soft: 0 2px 8px rgba(44, 36, 22, 0.06);
  --shadow-medium: 0 4px 16px rgba(44, 36, 22, 0.08);
  --shadow-elevated: 0 8px 32px rgba(44, 36, 22, 0.12);
  
  /* Animation Timing */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* Spacing Rhythm */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```

- [ ] **Step 1.2: 重写基础样式**

```css
@layer base {
  * {
    @apply border-[var(--border-subtle)];
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    min-height: 100vh;
    color: var(--ink);
    background: 
      radial-gradient(ellipse at 20% 0%, rgba(212, 134, 60, 0.03) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(192, 115, 47, 0.02) 0%, transparent 40%),
      linear-gradient(180deg, var(--paper) 0%, var(--paper-warm) 50%, var(--paper-deep) 100%);
    font-family: var(--font-sans), system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  ::selection {
    background: rgba(212, 134, 60, 0.2);
    color: var(--ink);
  }
}
```

- [ ] **Step 1.3: 添加组件工具类**

```css
@layer components {
  /* Editorial Card Styles */
  .card-editorial {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-soft);
    backdrop-filter: blur(12px);
    transition: 
      transform var(--duration-normal) var(--ease-out),
      box-shadow var(--duration-normal) var(--ease-out);
  }

  .card-editorial:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
  }

  /* Warm Button Styles */
  .btn-warm {
    background: linear-gradient(135deg, var(--amber) 0%, var(--terracotta) 100%);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    font-weight: 500;
    transition: 
      transform var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);
  }

  .btn-warm:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(196, 115, 47, 0.3);
  }

  .btn-warm:active {
    transform: translateY(0);
  }

  /* Secondary Button */
  .btn-secondary {
    background: var(--surface-muted);
    color: var(--ink-light);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
    transition: all var(--duration-fast) var(--ease-out);
  }

  .btn-secondary:hover {
    background: var(--paper-deep);
    border-color: var(--border-medium);
  }

  /* Typography */
  .heading-editorial {
    font-family: var(--font-serif), Georgia, serif;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: var(--ink);
  }

  .text-body {
    color: var(--ink-light);
    line-height: 1.7;
  }

  .text-muted {
    color: var(--ink-muted);
  }

  /* Pin Badge */
  .badge-pin {
    background: linear-gradient(135deg, var(--amber-light) 0%, var(--amber) 100%);
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    box-shadow: 0 2px 8px rgba(212, 134, 60, 0.25);
  }

  /* Input Styles */
  .input-warm {
    background: var(--surface-elevated);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    transition: all var(--duration-fast) var(--ease-out);
  }

  .input-warm:focus {
    border-color: var(--amber);
    box-shadow: 0 0 0 3px rgba(212, 134, 60, 0.1);
    outline: none;
  }

  /* Tag/Badge */
  .tag-warm {
    background: var(--surface-muted);
    color: var(--ink-muted);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 12px;
    padding: 4px 10px;
    transition: all var(--duration-fast) var(--ease-out);
  }

  .tag-warm:hover {
    background: var(--paper-deep);
    color: var(--ink-light);
  }

  /* Section Divider */
  .divider-warm {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border-light), transparent);
  }

  /* Stats Card */
  .stat-card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1.25rem;
    text-align: center;
  }

  .stat-number {
    font-family: var(--font-serif), Georgia, serif;
    font-size: 2rem;
    font-weight: 600;
    color: var(--amber);
    line-height: 1;
  }

  .stat-label {
    font-size: 13px;
    color: var(--ink-muted);
    margin-top: 0.5rem;
  }
}
```

- [ ] **Step 1.4: 添加动画关键帧**

```css
@layer utilities {
  /* Fade In Up Animation */
  .animate-fade-in-up {
    animation: fadeInUp 0.6s var(--ease-out) forwards;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Gentle Pulse */
  .animate-pulse-gentle {
    animation: pulseGentle 2s ease-in-out infinite;
  }

  @keyframes pulseGentle {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  /* Stagger Animation Delays */
  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
  .stagger-3 { animation-delay: 0.3s; }
  .stagger-4 { animation-delay: 0.4s; }
  .stagger-5 { animation-delay: 0.5s; }

  /* Text Balance */
  .text-balance {
    text-wrap: balance;
  }
}
```

- [ ] **Step 1.5: Commit**

```bash
cd /root/shudong/my-app
git add src/app/globals.css
git commit -m "feat: implement warm editorial design system"
```

---

## Task 2: 更新布局字体配置 (layout.tsx)

**Files:**
- Modify: `src/app/layout.tsx:1-35`

- [ ] **Step 2.1: 替换字体配置**

```typescript
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "树洞小站",
  description: "一个温暖的地方，留下你想说的话。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${serif.variable} ${sans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2.2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: update font configuration for editorial style"
```

---

## Task 3: 重写欢迎页面 (WelcomePage.tsx)

**Files:**
- Modify: `src/components/WelcomePage.tsx:1-210`

- [ ] **Step 3.1: 重写欢迎页面组件**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomePage() {
  const [entered, setEntered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const visited = sessionStorage.getItem('shudong-visited');
    if (visited) {
      setEntered(true);
    }
  }, []);

  const handleEnter = useCallback(() => {
    sessionStorage.setItem('shudong-visited', '1');
    setEntered(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {!entered && (
        <motion.div
          key="welcome"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #fefcf8 0%, #fdf9f3 50%, #f5f0e8 100%)'
          }}
        >
          {/* Subtle Paper Texture */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.06, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[15%] right-[10%] w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, #d4863c, transparent 70%)' }}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.04, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[20%] left-[8%] w-48 h-48 rounded-full"
            style={{ background: 'radial-gradient(circle, #c4732f, transparent 70%)' }}
          />

          {/* Horizontal Lines */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[20%] left-[15%] right-[15%] h-px"
            style={{ 
              background: 'linear-gradient(90deg, transparent, rgba(139, 115, 85, 0.2), transparent)',
              transformOrigin: 'center'
            }}
          />

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl">
            {/* Small Label */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-xs uppercase tracking-[0.3em] mb-6"
              style={{ color: 'var(--ink-muted)' }}
            >
              匿名留言空间
            </motion.p>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="heading-editorial text-5xl sm:text-6xl mb-4"
              style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
            >
              树洞小站
            </motion.h1>

            {/* Decorative Line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-16 h-px my-6"
              style={{ 
                background: 'linear-gradient(90deg, transparent, var(--amber), transparent)',
                transformOrigin: 'center'
              }}
            />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg leading-relaxed mb-8 max-w-md"
              style={{ color: 'var(--ink-light)' }}
            >
              在这里，你可以留下匿名留言、<br />
              发射弹幕表达心情，<br />
              或者静静地读一篇文章。
            </motion.p>

            {/* Feature Tags */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-4 mb-12"
            >
              {['匿名留言', '实时弹幕', '文章阅读'].map((tag, i) => (
                <span 
                  key={tag}
                  className="tag-warm"
                >
                  {tag}
                </span>
              ))}
            </motion.div>

            {/* Enter Button */}
            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEnter}
              className="btn-warm px-10 py-3.5 text-base font-medium"
              style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
            >
              进入树洞
            </motion.button>

            {/* Bottom Hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="mt-10 text-xs"
              style={{ color: 'var(--ink-subtle)' }}
            >
              你的声音，只有你自己知道
            </motion.p>
          </div>

          {/* Corner Decorations */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="absolute top-8 left-8 text-xs tracking-[0.2em]"
            style={{ color: 'var(--ink-subtle)' }}
          >
            EST. 2024
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="absolute bottom-8 right-8 text-xs tracking-[0.15em]"
            style={{ color: 'var(--ink-subtle)' }}
          >
            温暖 · 自由 · 倾听
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3.2: Commit**

```bash
git add src/components/WelcomePage.tsx
git commit -m "feat: redesign welcome page with warm editorial style"
```

---

## Task 4-8: (略，详见完整计划文档)

由于篇幅限制，Task 4-8 的详细步骤在完整文档中。主要修改包括：
- Task 4: 更新主页面 (page.tsx)
- Task 5: 更新留言表单 (MessageForm.tsx)
- Task 6: 更新留言卡片 (MessageCard.tsx)
- Task 7: 更新UI组件 (card.tsx, button.tsx)
- Task 8: 最终验证

---

## 设计系统速查

### 颜色
| 变量 | 值 | 用途 |
|------|-----|------|
| --paper | #fefcf8 | 主背景 |
| --paper-warm | #fdf9f3 | 渐变背景 |
| --ink | #2c2416 | 主文字 |
| --ink-light | #3d3225 | 正文 |
| --ink-muted | #5c4d3c | 次要文字 |
| --amber | #d4863c | 主强调色 |
| --terracotta | #c4732f | 深强调色 |
| --coral | #e07a5f | 次强调色 |

### 字体
| 变量 | 字体 | 用途 |
|------|------|------|
| --font-serif | Cormorant Garamond | 标题 |
| --font-sans | Inter | 正文/UI |
