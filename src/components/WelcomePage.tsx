'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomePageProps {
  onEnter: () => void;
}

// 时间阶段文案 - 二次元风格
const timePhases = [
  { hour: 5, name: '黎明', greeting: '新的一天，新的冒险开始', icon: '🌅' },
  { hour: 8, name: '清晨', greeting: '元气满满的一天', icon: '🌄' },
  { hour: 12, name: '正午', greeting: '阳光正好，最适合摸鱼', icon: '☀️' },
  { hour: 15, name: '午后', greeting: '下午茶时间到~', icon: '🌤️' },
  { hour: 18, name: '黄昏', greeting: '夕阳无限好，只是近黄昏', icon: '🌇' },
  { hour: 21, name: '夜晚', greeting: '月色温柔，星光璀璨', icon: '🌙' },
  { hour: 24, name: '深夜', greeting: '夜深人静，正是倾诉时', icon: '✨' },
];

// 轮播诗句 - 二次元浪漫风
const poems = [
  { text: '在这片星空下，说出你的心声', sub: 'Under this starry sky' },
  { text: '每一个秘密，都会被温柔守护', sub: 'Every secret is protected' },
  { text: '你的故事，值得被倾听', sub: 'Your story deserves to be heard' },
  { text: '在这里，你可以做真实的自己', sub: 'Be your true self here' },
  { text: '把烦恼留在风里，让快乐留在心里', sub: 'Leave worries in the wind' },
  { text: '有些心情，只适合说给树洞听', sub: 'Some feelings are for the tree hole' },
  { text: '星光不问赶路人，时光不负有心人', sub: 'Stars don\'t ask travelers' },
];

// 生成星星
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 5,
    color: ['#fff', '#ff9eb5', '#81d4fa', '#ce93d8'][Math.floor(Math.random() * 4)],
  }));
};

// 生成流星
const generateShootingStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 50,
    delay: Math.random() * 10,
    duration: Math.random() * 2 + 2,
  }));
};

// 生成花瓣
const generatePetals = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 10,
    duration: Math.random() * 8 + 8,
    size: Math.random() * 0.6 + 0.7,
    color: ['#ffb7c5', '#ffc0cb', '#ff9eb5', '#ffd1dc'][Math.floor(Math.random() * 4)],
  }));
};

export default function WelcomePage({ onEnter }: WelcomePageProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPoemIndex, setCurrentPoemIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const stars = useMemo(() => generateStars(80), []);
  const shootingStars = useMemo(() => generateShootingStars(5), []);
  const petals = useMemo(() => generatePetals(15), []);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const poemTimer = setInterval(() => {
      setCurrentPoemIndex((prev) => (prev + 1) % poems.length);
    }, 4000);
    return () => {
      clearInterval(timer);
      clearInterval(poemTimer);
    };
  }, []);

  const handleEnter = useCallback(() => {
    setIsExiting(true);
    setTimeout(onEnter, 1000);
  }, [onEnter]);

  const getCurrentPhase = () => {
    const hour = currentTime.getHours();
    for (const phase of timePhases) {
      if (hour < phase.hour) return phase;
    }
    return timePhases[timePhases.length - 1];
  };

  const phase = getCurrentPhase();
  const timeString = currentTime.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="anime-welcome-bg fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{ minHeight: '100dvh' }}
        >
          {/* ===== 星空背景效果 ===== */}
          {/* 普通星星 */}
          {stars.map((star) => (
            <motion.div
              key={star.id}
              className="star"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                background: star.color,
                '--duration': `${star.duration}s`,
              } as React.CSSProperties}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: star.delay * 0.2, duration: 0.5 }}
            />
          ))}

          {/* 流星 */}
          {shootingStars.map((meteor) => (
            <div
              key={meteor.id}
              className="shooting-star"
              style={{
                left: `${meteor.x}%`,
                top: `${meteor.y}%`,
                animationDelay: `${meteor.delay}s`,
                animationDuration: `${meteor.duration}s`,
              }}
            />
          ))}

          {/* 樱花花瓣飘落 */}
          {petals.map((petal) => (
            <div
              key={petal.id}
              className="petal"
              style={{
                left: `${petal.x}%`,
                animationDelay: `${petal.delay}s`,
                animationDuration: `${petal.duration}s`,
                transform: `scale(${petal.size})`,
                background: `linear-gradient(135deg, ${petal.color} 0%, #fff 50%, ${petal.color} 100%)`,
              }}
            />
          ))}

          {/* 魔法阵装饰 */}
          <div className="magic-circle w-[600px] h-[600px] -top-60 -left-60 opacity-30" />
          <div className="magic-circle w-[400px] h-[400px] -bottom-40 -right-40 opacity-20" style={{ animationDirection: 'reverse' }} />

          {/* 流光线条背景 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-[2px] h-[200px] bg-gradient-to-b from-transparent via-[#ff6b9d] to-transparent opacity-30"
              style={{ left: '10%' }}
              animate={{ y: ['-100%', '100vh'] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute w-[2px] h-[300px] bg-gradient-to-b from-transparent via-[#4fc3f7] to-transparent opacity-20"
              style={{ left: '30%', animationDelay: '-2s' }}
              animate={{ y: ['-100%', '100vh'] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear', delay: 2 }}
            />
            <motion.div
              className="absolute w-[2px] h-[150px] bg-gradient-to-b from-transparent via-[#9c27b0] to-transparent opacity-25"
              style={{ left: '70%', animationDelay: '-5s' }}
              animate={{ y: ['-100%', '100vh'] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'linear', delay: 5 }}
            />
            <motion.div
              className="absolute w-[2px] h-[250px] bg-gradient-to-b from-transparent via-[#ffeb3b] to-transparent opacity-20"
              style={{ left: '85%', animationDelay: '-3s' }}
              animate={{ y: ['-100%', '100vh'] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'linear', delay: 3 }}
            />
          </div>

          {/* ===== 主内容区 ===== */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, type: 'spring' }}
            className="relative z-10 text-center px-4 sm:px-6 max-w-2xl w-full"
          >
            {/* 装饰性流光边框 */}
            <div className="flow-border p-6 sm:p-8 md:p-10 mb-6">
              {/* 时间显示 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mb-4 sm:mb-6"
              >
                <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                  <span className="text-xl sm:text-2xl">{phase.icon}</span>
                  <span className="text-[#ff9eb5] text-base sm:text-lg font-medium">{phase.name}</span>
                </div>
                <motion.div
                  className="glow-text text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider"
                  style={{ fontFamily: 'var(--font-display)' }}
                  animate={{ textShadow: [
                    '0 0 10px rgba(255,107,157,0.8), 0 0 20px rgba(255,107,157,0.5)',
                    '0 0 20px rgba(255,107,157,1), 0 0 40px rgba(255,107,157,0.8), 0 0 60px rgba(255,107,157,0.5)',
                    '0 0 10px rgba(255,107,157,0.8), 0 0 20px rgba(255,107,157,0.5)',
                  ]}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {timeString}
                </motion.div>
                <div className="text-white/60 text-xs sm:text-sm mt-1 sm:mt-2">{phase.greeting}</div>
              </motion.div>

              {/* 站点名称 - 炫酷渐变 */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="gradient-text text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                树洞小站
              </motion.h1>

              {/* 诗句轮播 - 发光效果 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="h-14 sm:h-16 mb-2 flex flex-col items-center justify-center"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPoemIndex}
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                  >
                    <p className="glow-text-blue text-base sm:text-lg md:text-xl font-medium mb-1">
                      {poems[currentPoemIndex].text}
                    </p>
                    <p className="text-white/40 text-xs sm:text-sm tracking-widest">
                      {poems[currentPoemIndex].sub}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* 进入按钮 - 炫酷动漫风 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="relative"
            >
              {/* 按钮光晕背景 */}
              <motion.div
                className="absolute inset-0 blur-xl opacity-50"
                style={{
                  background: 'linear-gradient(90deg, #ff6b9d, #9c27b0, #4fc3f7, #ff6b9d)',
                  backgroundSize: '300% 100%',
                }}
                animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEnter}
                className="anime-btn relative shine-effect text-base sm:text-lg px-10 sm:px-16 py-4 sm:py-5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  >
                    ✨
                  </motion.span>
                  开启冒险
                  <motion.span
                    animate={{ rotate: [360, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  >
                    ✨
                  </motion.span>
                </span>
              </motion.button>

              {/* 装饰性光点 */}
              <motion.div
                className="absolute -left-6 sm:-left-8 top-1/2 -translate-y-1/2 w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-[#ff6b9d]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute -right-6 sm:-right-8 top-1/2 -translate-y-1/2 w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-[#4fc3f7]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
            </motion.div>
          </motion.div>

          {/* 底部装饰文字 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-4 sm:bottom-8 left-0 right-0 text-center"
          >
            <p className="text-white/40 text-xs sm:text-sm tracking-widest">
              Here, your secrets are safe with the stars
            </p>
          </motion.div>

          {/* 角落装饰 - 发光角标 */}
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 w-8 sm:w-12 h-8 sm:h-12 border-l-2 border-t-2 border-[#ff6b9d]/50 rounded-tl-xl" />
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 w-8 sm:w-12 h-8 sm:h-12 border-r-2 border-t-2 border-[#4fc3f7]/50 rounded-tr-xl" />
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 w-8 sm:w-12 h-8 sm:h-12 border-l-2 border-b-2 border-[#9c27b0]/50 rounded-bl-xl" />
          <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 w-8 sm:w-12 h-8 sm:h-12 border-r-2 border-b-2 border-[#ff9800]/50 rounded-br-xl" />

          {/* 浮动装饰元素 */}
          <motion.div
            className="absolute top-16 sm:top-20 left-8 sm:left-20 text-2xl sm:text-4xl float-anime"
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🌸
          </motion.div>
          <motion.div
            className="absolute top-32 sm:top-40 right-8 sm:right-32 text-xl sm:text-3xl float-anime-delay"
            animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            ⭐
          </motion.div>
          <motion.div
            className="absolute bottom-32 sm:bottom-40 left-8 sm:left-32 text-xl sm:text-3xl float-anime-delay-2"
            animate={{ y: [0, -25, 0], rotate: [0, 8, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            🦋
          </motion.div>
          <motion.div
            className="absolute bottom-24 sm:bottom-32 right-8 sm:right-20 text-2xl sm:text-4xl float-anime"
            animate={{ y: [0, -18, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity }}
          >
            💫
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
