'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Heart, Loader2, MessageCircle, Radio, RefreshCcw, ShieldCheck, Sparkles, Eye, PencilLine, ThumbsUp, Star, Send, CornerDownRight, Feather, Edit3, X } from 'lucide-react';
import type { Message, Post, CommentReply } from '@/types';
import WelcomePage from '@/components/WelcomePage';
import { MessageForm } from '@/components/message/MessageForm';
import { MessageTimeline } from '@/components/message/MessageTimeline';
import { DanmakuLayer } from '@/components/message/DanmakuLayer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDateTime, formatDate } from '@/lib/date';
import { MermaidDiagram } from '@/components/MermaidDiagram';

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [danmakuEnabled, setDanmakuEnabled] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loadingSelectedPost, setLoadingSelectedPost] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [postCommentInputs, setPostCommentInputs] = useState<Record<string, string>>({});
  const [postReplyingTo, setPostReplyingTo] = useState<string | null>(null);
  const [postReplyInput, setPostReplyInput] = useState('');
  const [scrollToComment, setScrollToComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [visitorName, setVisitorName] = useState<string>('访客');
  const [visitorFingerprint, setVisitorFingerprint] = useState<string>('');
  const [canChangeName, setCanChangeName] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [newNameInput, setNewNameInput] = useState<string>('');
  const [nameChangeError, setNameChangeError] = useState<string | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [favoritedMessages, setFavoritedMessages] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [favoritedPosts, setFavoritedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visitorFingerprint) return;
    const fetchReactions = async () => {
      try {
        const msgIds = messages.map((m) => m.id);
        const postIds = posts.map((p) => p.id);
        const likedMsg = new Set<string>();
        const favMsg = new Set<string>();
        const likedPost = new Set<string>();
        const favPost = new Set<string>();

        const fetchBatch = async (type: 'message' | 'post', ids: string[]) => {
          if (ids.length === 0) return;
          const res = await fetch(`/api/reactions?targetType=${type}&targetIds=${ids.join(',')}`);
          if (!res.ok) return;
          const data: Record<string, { liked: boolean; favorited: boolean }> = await res.json();
          for (const [id, state] of Object.entries(data)) {
            if (type === 'message') {
              if (state.liked) likedMsg.add(id);
              if (state.favorited) favMsg.add(id);
            } else {
              if (state.liked) likedPost.add(id);
              if (state.favorited) favPost.add(id);
            }
          }
        };

        await Promise.all([fetchBatch('message', msgIds), fetchBatch('post', postIds)]);
        setLikedMessages(likedMsg);
        setFavoritedMessages(favMsg);
        setLikedPosts(likedPost);
        setFavoritedPosts(favPost);
      } catch { /* ignore */ }
    };
    fetchReactions();
  }, [visitorFingerprint, messages, posts]);

  const handleImageClick = useCallback((src: string) => {
    setLightboxSrc(src);
  }, []);

  const markdownComponents: Components = {
    img: ({ src = '', alt = '' }) => {
      if (!src) return null;
      return (
        <button type="button" className="cursor-zoom-in p-0 border-0 bg-transparent block w-full" onClick={() => handleImageClick(src)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="h-auto w-full max-w-full rounded-xl border-2 border-[#ff6b9d]/50 object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </button>
      );
    },
    a: ({ href = '', children, ...props }) => {
      if (!href) return <>{children}</>;
      const isExternal = href.startsWith('http://') || href.startsWith('https://');
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-[#81d4fa] underline decoration-[#81d4fa]/50 underline-offset-2 break-all hover:text-[#4fc3f7] hover:decoration-[#4fc3f7] transition-colors"
          {...props}
        >
          {children}
        </a>
      );
    },
    code: ({ className, children, ...props }) => {
      const language = className?.match(/language-([\w-]+)/)?.[1];
      const value = String(children).replace(/\n$/, '');
      if (language === 'mermaid') {
        return <MermaidDiagram chart={value} />;
      }
      if (!className) return <code {...props}>{children}</code>;
      return (
        <pre className="rounded-xl border border-[#ff6b9d]/30 bg-[#1a1a2e]/80 p-4 overflow-x-auto">
          {language ? <div className="text-[#ff6b9d] text-xs mb-2 font-bold">{language}</div> : null}
          <code className={`${className} text-[#81d4fa]`} {...props}>{value}</code>
        </pre>
      );
    },
  };

  const pinnedCount = useMemo(() => messages.filter((m) => m.isPinned).length, [messages]);

  const loadMessages = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoadingMessages(true);
    try {
      const response = await fetch('/api/messages', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '获取留言失败');
      setMessages(data.messages || []);
      setMessageError(null);
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : '获取留言失败');
    } finally {
      setLoadingMessages(false);
      setRefreshing(false);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const response = await fetch('/api/posts', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '获取文章失败');
      setPosts(data.posts || []);
      setPostError(null);
    } catch (error) {
      setPostError(error instanceof Error ? error.message : '获取文章失败');
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    loadPosts();
    fetch('/api/visitor', { method: 'POST' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setVisitorName(data.name);
          setVisitorFingerprint(data.fingerprint);
          setCanChangeName(data.canChangeName);
        }
      })
      .catch(() => {});
  }, [loadMessages, loadPosts]);

  useEffect(() => {
    if (scrollToComment && selectedPost && !loadingSelectedPost) {
      setTimeout(() => {
        commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        commentInputRef.current?.focus();
      }, 100);
      setScrollToComment(false);
    }
  }, [scrollToComment, selectedPost, loadingSelectedPost]);

  async function handleSubmit(content: string, type: 'message' | 'secret', images: string[]) {
    setSubmitting(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type, images }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '发布失败');
      await loadMessages();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenPost(id: string) {
    setLoadingSelectedPost(true);
    setScrollToComment(false);
    try {
      const response = await fetch(`/api/posts/${id}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '获取文章失败');
      setSelectedPost(data.post || null);
    } catch (error) {
      setPostError(error instanceof Error ? error.message : '获取文章失败');
    } finally {
      setLoadingSelectedPost(false);
    }
  }

  async function handleOpenPostForComment(id: string) {
    setLoadingSelectedPost(true);
    setScrollToComment(true);
    try {
      const response = await fetch(`/api/posts/${id}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '获取文章失败');
      setSelectedPost(data.post || null);
    } catch (error) {
      setPostError(error instanceof Error ? error.message : '获取文章失败');
    } finally {
      setLoadingSelectedPost(false);
    }
  }

  async function handlePostAction(postId: string, action: 'like' | 'favorite') {
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'post', targetId: postId, action }),
      });
      const data = await response.json();
      if (!response.ok) return;
      const updater = (p: Post) => ({ ...p, likeCount: data.likeCount, favoriteCount: data.favoriteCount });
      setPosts((current) => current.map((p) => p.id === postId ? updater(p) : p));
      setSelectedPost((current) => current?.id === postId ? updater(current) : current);
      if (action === 'like') {
        setLikedPosts((prev) => { const next = new Set(prev); if (data.liked) next.add(postId); else next.delete(postId); return next; });
      } else {
        setFavoritedPosts((prev) => { const next = new Set(prev); if (data.favorited) next.add(postId); else next.delete(postId); return next; });
      }
    } catch { /* ignore */ }
  }

  async function handlePostCommentSubmit(postId: string, content: string) {
    if (!content.trim()) return;
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) return;
      const updater = (p: Post) => ({ ...p, comments: [...(p.comments || []), data.comment] });
      setPosts((current) => current.map((p) => p.id === postId ? updater(p) : p));
      setSelectedPost((current) => current?.id === postId ? updater(current) : current);
      setPostCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch { /* ignore */ }
  }

  async function handlePostCommentReply(postId: string, commentId: string, content: string) {
    if (!content.trim()) return;
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) return;
      const newReply: CommentReply = data.reply;
      const updater = (p: Post) => ({
        ...p,
        comments: (p.comments || []).map((c) => c.id === commentId ? { ...c, replies: [...(c.replies || []), newReply] } : c),
      });
      setPosts((current) => current.map((p) => p.id === postId ? updater(p) : p));
      setSelectedPost((current) => current?.id === postId ? updater(current) : current);
    } catch { /* ignore */ }
  }

  async function handleMessageAction(messageId: string, action: 'like' | 'favorite') {
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'message', targetId: messageId, action }),
      });
      const data = await response.json();
      if (!response.ok) return;
      setMessages((current) => current.map((m) => m.id === messageId ? { ...m, likeCount: data.likeCount, favoriteCount: data.favoriteCount } : m));
      if (action === 'like') {
        setLikedMessages((prev) => { const next = new Set(prev); if (data.liked) next.add(messageId); else next.delete(messageId); return next; });
      } else {
        setFavoritedMessages((prev) => { const next = new Set(prev); if (data.favorited) next.add(messageId); else next.delete(messageId); return next; });
      }
    } catch { /* ignore */ }
  }

  async function handleMessageCommentSubmit(messageId: string, content: string) {
    if (!content.trim()) return;
    try {
      const response = await fetch(`/api/messages/${messageId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) return;
      setMessages((current) => current.map((m) => m.id === messageId ? { ...m, comments: [...(m.comments || []), data.comment] } : m));
    } catch { /* ignore */ }
  }

  async function handleMessageCommentReply(messageId: string, commentId: string, content: string) {
    if (!content.trim()) return;
    try {
      const response = await fetch(`/api/messages/${messageId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) return;
      const newReply: CommentReply = data.reply;
      setMessages((current) => current.map((m) =>
        m.id === messageId
          ? { ...m, comments: m.comments?.map((c) => c.id === commentId ? { ...c, replies: [...(c.replies || []), newReply] } : c) || [] }
          : m
      ));
    } catch { /* ignore */ }
  }

  async function handleChangeName() {
    if (!newNameInput.trim()) {
      setNameChangeError('请输入新名字');
      return;
    }
    try {
      const response = await fetch('/api/visitor/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newNameInput.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNameChangeError(data.error || '修改失败');
        return;
      }
      setVisitorName(data.name);
      setCanChangeName(false);
      setIsEditingName(false);
      setNewNameInput('');
      setNameChangeError(null);
    } catch {
      setNameChangeError('修改失败，请重试');
    }
  }

  if (!entered) {
    return <WelcomePage onEnter={() => setEntered(true)} />;
  }

  return (
    <main className="anime-bg min-h-screen relative">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* 浮动光点 */}
        <motion.div className="absolute top-20 left-20 w-2 h-2 rounded-full bg-[#ff6b9d] float-anime" />
        <motion.div className="absolute top-40 right-32 w-1 h-1 rounded-full bg-[#4fc3f7] float-anime-delay" />
        <motion.div className="absolute bottom-40 left-32 w-1.5 h-1.5 rounded-full bg-[#9c27b0] float-anime-delay-2" />
        <motion.div className="absolute bottom-32 right-20 w-2 h-2 rounded-full bg-[#ffeb3b] float-anime" />
      </div>

      <DanmakuLayer enabled={danmakuEnabled} />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* 头部区域 - 对称布局 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-[1fr_1fr]"
        >
          <div className="anime-card p-6 relative overflow-hidden">
            {/* 卡片光效 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ff6b9d]/20 to-transparent rounded-bl-full" />

            <div className="space-y-4 relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="anime-tag flex items-center gap-1">
                  <Feather className="w-3 h-3" />
                  匿名树洞
                </span>
                <span className="text-xs text-white/50">留言 / 悄悄话 / 弹幕</span>
              </div>

              <div className="space-y-3">
                <h1 className="gradient-text text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                  把想说的话留在这里
                </h1>
                <p className="text-base max-w-2xl text-white/60">
                  这里可以匿名留言、上传图片、发送悄悄话，也可以用弹幕快速表达当下心情。
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDanmakuEnabled((v) => !v)}
                  className={`anime-btn ${danmakuEnabled ? 'anime-btn-blue' : ''}`}
                >
                  <Radio className="h-4 w-4 inline mr-2" />
                  {danmakuEnabled ? '关闭弹幕' : '开启弹幕'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => loadMessages(true)}
                  disabled={refreshing}
                  className="outline-btn"
                >
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : <RefreshCcw className="h-4 w-4 inline mr-2" />}
                  刷新
                </motion.button>
              </div>
            </div>
          </div>

          {/* 右侧统计卡片 - 改为Flex横向布局更对称 */}
          <div className="flex flex-row gap-4 lg:flex-col">
            {[
              { num: messages.length, label: '留言', color: '#ff6b9d' },
              { num: pinnedCount, label: '置顶', color: '#ff9800' },
              { num: posts.length, label: '文章', color: '#4fc3f7' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="stat-card-anime flex-1"
              >
                <div className="stat-number-anime" style={{ background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}aa 100%)`, WebkitBackgroundClip: 'text' }}>
                  {stat.num}
                </div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 主内容区 - 对称布局 */}
        <section className="grid gap-8 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <Tabs defaultValue="messages" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#1a1a2e] border border-[#ff6b9d]/30 rounded-2xl p-1">
                <TabsTrigger
                  value="messages"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ff6b9d] data-[state=active]:to-[#9c27b0] data-[state=active]:text-white text-white/60 font-bold rounded-xl transition-all"
                >
                  留言墙
                </TabsTrigger>
                <TabsTrigger
                  value="posts"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4fc3f7] data-[state=active]:to-[#3f51b5] data-[state=active]:text-white text-white/60 font-bold rounded-xl transition-all"
                >
                  文章
                </TabsTrigger>
              </TabsList>

              <TabsContent value="messages" className="mt-6 space-y-6">
                <MessageForm onSubmit={handleSubmit} />

                {submitting && (
                  <div className="anime-card p-6">
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <Loader2 className="h-4 w-4 animate-spin text-[#ff6b9d]" />
                      正在发布留言...
                    </div>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="anime-card p-6">
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <Loader2 className="h-4 w-4 animate-spin text-[#ff6b9d]" />
                      正在加载留言...
                    </div>
                  </div>
                ) : messageError ? (
                  <div className="anime-card border-[#ff6b9d]/50 p-6">
                    <div className="text-sm text-[#ff6b9d]">{messageError}</div>
                  </div>
                ) : (
                  <MessageTimeline
                    messages={messages}
                    likedMessages={likedMessages}
                    favoritedMessages={favoritedMessages}
                    onAction={handleMessageAction}
                    onComment={handleMessageCommentSubmit}
                    onCommentReply={handleMessageCommentReply}
                  />
                )}
              </TabsContent>

              <TabsContent value="posts" className="mt-6">
                <div className="anime-card">
                  <div className="p-4 border-b border-[#ff6b9d]/20">
                    <div className="flex items-center gap-2 text-xl text-white">
                      <PencilLine className="h-5 w-5 text-[#4fc3f7]" />
                      最新文章
                    </div>
                    <div className="text-xs text-white/50 mt-1">这里展示最新内容与摘要。</div>
                  </div>
                  <div className="p-4 space-y-4">
                    {loadingPosts ? (
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <Loader2 className="h-4 w-4 animate-spin text-[#4fc3f7]" />
                        正在加载文章...
                      </div>
                    ) : postError ? (
                      <p className="text-sm text-[#ff6b9d]">{postError}</p>
                    ) : posts.length === 0 ? (
                      <p className="text-sm text-white/50">还没有文章。</p>
                    ) : (
                      posts.slice(0, 6).map((post) => (
                        <article key={post.id} className="anime-card p-4 hover:border-[#ff6b9d]/50">
                          {post.coverImage ? (
                            <div className="image-container-anime mb-4">
                              <img src={post.coverImage} alt={post.title} className="h-48 w-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                            </div>
                          ) : null}
                          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
                            <span>{formatDate(post.createdAt)}</span>
                            <span className="inline-flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.views}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white">{post.title}</h3>
                          <p className="mt-2 line-clamp-3 text-sm text-white/60">{post.summary}</p>
                          {post.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {post.tags.map((tag) => (
                                <span key={tag} className="anime-tag text-xs">#{tag}</span>
                              ))}
                            </div>
                          )}
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => handleOpenPost(post.id)}
                              className="anime-btn text-xs py-2 px-4"
                            >
                              查看全文
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => handlePostAction(post.id, 'like')}
                              className={`outline-btn text-xs py-2 px-4 ${likedPosts.has(post.id) ? 'bg-gradient-to-r from-[#ff6b9d] to-[#9c27b0] text-white border-transparent' : ''}`}
                            >
                              <ThumbsUp className="h-3 w-3 inline mr-1" />
                              点赞 {post.likeCount || 0}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => handlePostAction(post.id, 'favorite')}
                              className={`outline-btn text-xs py-2 px-4 ${favoritedPosts.has(post.id) ? 'bg-gradient-to-r from-[#ff9800] to-[#ff6b35] text-white border-transparent' : ''}`}
                            >
                              <Star className="h-3 w-3 inline mr-1" />
                              收藏 {post.favoriteCount || 0}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => handleOpenPostForComment(post.id)}
                              className="outline-btn text-xs py-2 px-4"
                            >
                              <MessageCircle className="h-3 w-3 inline mr-1" />
                              评论 {(post.comments || []).length}
                            </motion.button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 侧边栏 */}
          <aside className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="anime-card"
            >
              <div className="p-4 border-b border-[#ff6b9d]/20">
                <div className="flex items-center gap-2 text-xl text-white">
                  <Sparkles className="h-5 w-5 text-[#ffeb3b]" />
                  你的身份
                </div>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-[#ff6b9d]/20">
                  <span className="text-white/60">你的名字</span>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newNameInput}
                        onChange={(e) => setNewNameInput(e.target.value)}
                        placeholder="输入新名字"
                        className="anime-input w-24 py-1 px-2 text-sm"
                        maxLength={10}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleChangeName}
                        className="text-[#4fc3f7] hover:text-[#81d4fa]"
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setIsEditingName(false); setNewNameInput(''); setNameChangeError(null); }}
                        className="text-white/40 hover:text-white/60"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#ff6b9d]">{visitorName}</span>
                      {canChangeName && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsEditingName(true)}
                          className="text-white/40 hover:text-[#ff6b9d]"
                          title="修改名字（只能修改一次）"
                        >
                          <Edit3 className="w-3 h-3" />
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
                {nameChangeError && (
                  <p className="text-xs text-[#ff6b9d]">{nameChangeError}</p>
                )}
                <p className="text-xs text-white/40">
                  {canChangeName ? '系统根据你的设备生成唯一名字，点击名字旁的编辑图标可修改一次。' : '你的名字已确定，无法再次修改。'}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="anime-card"
            >
              <div className="p-4 border-b border-[#ff6b9d]/20">
                <div className="flex items-center gap-2 text-xl text-white">
                  <MessageCircle className="h-5 w-5 text-[#9c27b0]" />
                  如何使用
                </div>
              </div>
              <div className="p-4 space-y-4 text-sm text-white/70">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#ff6b9d] to-[#9c27b0] flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="text-white/90 font-medium">发布留言</p>
                    <p className="text-xs text-white/50 mt-0.5">在下方输入框写下想说的话，点击「发布」即可公开显示。勾选「悄悄话」仅管理员可见。</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#4fc3f7] to-[#3f51b5] flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className="text-white/90 font-medium">上传图片</p>
                    <p className="text-xs text-white/50 mt-0.5">每条留言最多可上传 3 张图片，单张不超过 5MB，支持 JPG、PNG、GIF 格式。</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#ff9800] to-[#ff6b35] flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="text-white/90 font-medium">互动功能</p>
                    <p className="text-xs text-white/50 mt-0.5">点击留言下方的点赞、收藏按钮进行互动，也可以在评论区留下你的想法。</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#9c27b0] to-[#673ab7] flex items-center justify-center text-xs font-bold">4</span>
                  <div>
                    <p className="text-white/90 font-medium">弹幕模式</p>
                    <p className="text-xs text-white/50 mt-0.5">点击「开启弹幕」按钮，你的留言将以弹幕形式飘过屏幕，快速表达当下心情。</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="anime-card"
            >
              <div className="p-4 border-b border-[#ff6b9d]/20">
                <div className="flex items-center gap-2 text-xl text-white">
                  <Heart className="h-5 w-5 text-[#ff6b9d]" />
                  当前状态
                </div>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-[#ff6b9d]/20">
                  <span className="text-white/60">留言互动</span>
                  <span className="anime-tag text-xs">已启用</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-[#ff6b9d]/20">
                  <span className="text-white/60">弹幕层</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${danmakuEnabled ? 'bg-[#4fc3f7] text-white' : 'bg-white/10 text-white/60'}`}>
                    {danmakuEnabled ? '开启中' : '未开启'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-[#ff6b9d]/20">
                  <span className="text-white/60">后台管理</span>
                  <span className="anime-tag-blue text-xs">已保护</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="anime-card"
            >
              <div className="p-4 border-b border-[#ff6b9d]/20">
                <div className="flex items-center gap-2 text-xl text-white">
                  <MessageCircle className="h-5 w-5 text-[#4fc3f7]" />
                  后台入口
                </div>
              </div>
              <div className="p-4 space-y-3 text-sm text-white/60">
                <p>后台可管理悄悄话、公开留言、文章与弹幕。</p>
                <Link href="/admin" className="anime-btn block text-center w-full text-sm">
                  进入后台管理
                </Link>
              </div>
            </motion.div>
          </aside>
        </section>
      </div>

      {/* 文章详情弹窗 */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto bg-[#0a0a1a] border border-[#ff6b9d]/30 text-white p-0 rounded-2xl">
          <DialogHeader className="p-4 border-b border-[#ff6b9d]/20">
            <DialogTitle className="text-white text-xl gradient-text" style={{ fontFamily: 'var(--font-display)' }}>
              {selectedPost?.title || '文章详情'}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {selectedPost ? formatDateTime(selectedPost.createdAt) : '正在加载文章内容'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            {loadingSelectedPost ? (
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Loader2 className="h-4 w-4 animate-spin text-[#ff6b9d]" />
                正在加载文章...
              </div>
            ) : selectedPost ? (
              <div className="space-y-4">
                {selectedPost.coverImage ? (
                  <div className="image-container-anime">
                    <img src={selectedPost.coverImage} alt={selectedPost.title} className="h-64 w-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                  </div>
                ) : null}
                {selectedPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag) => (
                      <span key={tag} className="anime-tag text-xs">#{tag}</span>
                    ))}
                  </div>
                )}
                <article className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{selectedPost.content}</ReactMarkdown>
                </article>

                <div className="flex flex-wrap items-center gap-3 border-t border-[#ff6b9d]/20 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handlePostAction(selectedPost.id, 'like')}
                    className={`anime-btn ${likedPosts.has(selectedPost.id) ? 'anime-btn-blue' : ''}`}
                  >
                    <ThumbsUp className="h-4 w-4 inline mr-1" />
                    点赞 {selectedPost.likeCount || 0}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handlePostAction(selectedPost.id, 'favorite')}
                    className={`anime-btn ${favoritedPosts.has(selectedPost.id) ? 'bg-gradient-to-r from-[#ff9800] to-[#ff6b35]' : ''}`}
                  >
                    <Star className="h-4 w-4 inline mr-1" />
                    收藏 {selectedPost.favoriteCount || 0}
                  </motion.button>
                  <span className="text-sm text-white/50">
                    <MessageCircle className="h-4 w-4 inline mr-1" />
                    {(selectedPost.comments || []).length} 条评论
                  </span>
                </div>

                {/* 评论 */}
                {(selectedPost.comments || []).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-[#ff6b9d]">评论</h4>
                    {(selectedPost.comments || []).map((c) => (
                      <div key={c.id} className={`p-3 rounded-xl ${c.isAdmin ? 'admin-comment-anime' : 'comment-box-anime'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {c.isAdmin ? (
                            <span className="text-xs bg-gradient-to-r from-[#ff6b9d] to-[#9c27b0] text-white px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3 inline mr-0.5" />
                              站主
                            </span>
                          ) : c.visitorName ? (
                            <span className="text-xs text-[#ff6b9d]">{c.visitorName}</span>
                          ) : null}
                          <span className="text-xs text-white/40">{formatDateTime(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-white/80">{c.content}</p>
                        <button
                          type="button"
                          onClick={() => setPostReplyingTo(postReplyingTo === c.id ? null : c.id)}
                          className="text-xs text-white/40 hover:text-[#ff6b9d] mt-1"
                        >
                          <CornerDownRight className="inline h-3 w-3 mr-0.5" />
                          回复
                        </button>
                        {(c.replies || []).length > 0 && (
                          <div className="mt-2 ml-3 space-y-2 border-l-2 border-[#ff6b9d]/20 pl-3">
                            {(c.replies || []).map((r) => (
                              <div key={r.id} className={`p-2 rounded-lg ${r.isAdmin ? 'admin-comment-anime' : 'bg-white/5'}`}>
                                <div className="flex items-center gap-2 mb-0.5">
                                  {r.isAdmin ? (
                                    <span className="text-xs bg-gradient-to-r from-[#ff6b9d] to-[#9c27b0] text-white px-1.5 py-0 rounded-full">
                                      <ShieldCheck className="w-2.5 h-2.5 inline mr-0.5" />
                                      站主
                                    </span>
                                  ) : r.visitorName ? (
                                    <span className="text-xs text-[#ff6b9d]">{r.visitorName}</span>
                                  ) : null}
                                  <span className="text-xs text-white/40">{formatDateTime(r.createdAt)}</span>
                                </div>
                                <p className="text-sm text-white/80">{r.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {postReplyingTo === c.id && (
                          <div className="flex gap-2 mt-2 ml-3">
                            <input
                              type="text"
                              placeholder="写下你的回复..."
                              className="anime-input flex-1 text-sm"
                              value={postReplyInput}
                              onChange={(e) => setPostReplyInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handlePostCommentReply(selectedPost.id, c.id, postReplyInput);
                                  setPostReplyInput('');
                                  setPostReplyingTo(null);
                                }
                              }}
                              autoFocus
                            />
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => {
                                handlePostCommentReply(selectedPost.id, c.id, postReplyInput);
                                setPostReplyInput('');
                                setPostReplyingTo(null);
                              }}
                              disabled={!postReplyInput.trim()}
                              className="anime-btn h-9 px-3"
                            >
                              <Send className="h-3 w-3" />
                            </motion.button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2" id="post-comment-input">
                  <input
                    ref={commentInputRef}
                    type="text"
                    placeholder="写下你的评论..."
                    className="anime-input flex-1 text-sm"
                    value={postCommentInputs[selectedPost.id] || ''}
                    onChange={(e) => setPostCommentInputs((prev) => ({ ...prev, [selectedPost.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePostCommentSubmit(selectedPost.id, postCommentInputs[selectedPost.id] || '');
                      }
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handlePostCommentSubmit(selectedPost.id, postCommentInputs[selectedPost.id] || '')}
                    className="anime-btn"
                  >
                    <Send className="h-4 w-4 inline mr-1" />
                    发送
                  </motion.button>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* 图片灯箱 */}
      <Dialog open={!!lightboxSrc} onOpenChange={(open) => !open && setLightboxSrc(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] bg-black/95 border border-[#ff6b9d]/30 p-0 rounded-2xl">
          {lightboxSrc && (
            <img src={lightboxSrc} alt="放大图片" className="max-h-[85vh] max-w-full mx-auto object-contain" referrerPolicy="no-referrer" />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
