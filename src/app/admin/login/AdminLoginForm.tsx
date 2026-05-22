'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, LockKeyhole, Sparkles, ShieldCheck } from 'lucide-react';

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = useMemo(() => searchParams.get('redirect') || '/admin', [searchParams]);
  const [secret, setSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      router.replace(redirect);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="anime-welcome-bg min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* 背景星星 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: ['#ff6b9d', '#9c27b0', '#4fc3f7', '#ffeb3b', '#fff'][i % 5],
            }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      {/* 魔法阵装饰 */}
      <div className="magic-circle w-[600px] h-[600px] -top-60 -left-60 opacity-20" />
      <div className="magic-circle w-[500px] h-[500px] -bottom-40 -right-40 opacity-15" style={{ animationDirection: 'reverse' }} />

      {/* 流光线条 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[2px] h-[200px] bg-gradient-to-b from-transparent via-[#ff6b9d] to-transparent opacity-30"
          style={{ left: '15%' }}
          animate={{ y: ['-100%', '100vh'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-[2px] h-[300px] bg-gradient-to-b from-transparent via-[#4fc3f7] to-transparent opacity-20"
          style={{ left: '85%' }}
          animate={{ y: ['-100%', '100vh'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear', delay: 2 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* 流光边框卡片 */}
        <div className="flow-border p-8 md:p-10">
          <div className="text-center space-y-8">
            {/* 图标 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff6b9d] via-[#9c27b0] to-[#4fc3f7] flex items-center justify-center shadow-lg shadow-[#ff6b9d]/30 pulse-glow"
            >
              <ShieldCheck className="h-10 w-10 text-white" />
            </motion.div>

            {/* 标题 */}
            <div className="space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="gradient-text text-3xl md:text-4xl font-bold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                管理员登录
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/50 text-sm"
              >
                请输入后台管理口令以继续
              </motion.p>
            </div>

            {/* 表单 */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
              onSubmit={handleSubmit}
            >
              <div className="space-y-3 text-left">
                <label className="text-sm text-white/70 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ff6b9d]" />
                  管理口令
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    id="secret"
                    type="password"
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                    placeholder="请输入口令"
                    autoComplete="current-password"
                    className="anime-input w-full pl-12"
                  />
                </div>
              </div>

              {error ? (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-[#ff6b9d] bg-[#ff6b9d]/10 py-3 px-4 rounded-xl border border-[#ff6b9d]/30"
                >
                  {error}
                </motion.p>
              ) : null}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="anime-btn w-full flex items-center justify-center gap-2 text-base py-4"
                disabled={submitting || !secret.trim()}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                进入后台
              </motion.button>
            </motion.form>

            {/* 返回首页 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <a
                href="/"
                className="anime-link text-sm inline-flex items-center gap-1"
              >
                ← 返回首页
              </a>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 角落装饰 */}
      <div className="absolute top-8 left-8 w-10 h-10 border-l-2 border-t-2 border-[#ff6b9d]/30 rounded-tl-lg" />
      <div className="absolute top-8 right-8 w-10 h-10 border-r-2 border-t-2 border-[#4fc3f7]/30 rounded-tr-lg" />
      <div className="absolute bottom-8 left-8 w-10 h-10 border-l-2 border-b-2 border-[#9c27b0]/30 rounded-bl-lg" />
      <div className="absolute bottom-8 right-8 w-10 h-10 border-r-2 border-b-2 border-[#ff9800]/30 rounded-br-lg" />
    </main>
  );
}
