'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Loader2, LogOut, MessageCircle, Radio, RefreshCcw, ShieldCheck, Trash2, ThumbsUp, Star, Send, CornerDownRight } from 'lucide-react';
import type { Danmaku, Message, Post, CommentReply } from '@/types';
import { formatDateTime } from '@/lib/date';
import { MermaidDiagram } from '@/components/MermaidDiagram';
import { MessageTimeline } from '@/components/message/MessageTimeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Lightbox state shared via module-level so markdownComponents can access it
let _setLightboxSrc: ((src: string | null) => void) | null = null;

const messageFilters = [
  { value: 'all', label: '全部' },
  { value: 'message', label: '公开' },
  { value: 'secret', label: '悄悄话' },
  { value: 'pinned', label: '已置顶' },
] as const;

type MessageFilter = (typeof messageFilters)[number]['value'];

type PostFormState = {
  id: string | null;
  title: string;
  summary: string;
  content: string;
  tags: string;
  coverImage: string;
};

const emptyPostForm: PostFormState = {
  id: null,
  title: '',
  summary: '',
  content: '',
  tags: '',
  coverImage: '',
};

export default function AdminPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [danmaku, setDanmaku] = useState<Danmaku[]>([]);
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('all');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingDanmaku, setLoadingDanmaku] = useState(true);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [danmakuError, setDanmakuError] = useState<string | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [postForm, setPostForm] = useState<PostFormState>(emptyPostForm);
  const [savingPost, setSavingPost] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loadingSelectedPost, setLoadingSelectedPost] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [postCommentInputs, setPostCommentInputs] = useState<Record<string, string>>({});
  const [postReplyingTo, setPostReplyingTo] = useState<string | null>(null);
  const [postReplyInput, setPostReplyInput] = useState('');

  _setLightboxSrc = setLightboxSrc;

  const markdownComponents: Components = {
    img: ({ src = '', alt = '' }) => {
      if (!src) {
        return null;
      }

      return (
        <button
          type="button"
          className="cursor-zoom-in p-0 border-0 bg-transparent block w-full"
          onClick={() => _setLightboxSrc?.(src)}
        >
          <img
            src={src}
            alt={alt}
            className="h-auto w-full max-w-full rounded-2xl object-contain"
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
          className="text-blue-400 underline break-all hover:text-blue-300 transition-colors"
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

      if (!className) {
        return (
          <code {...props}>
            {children}
          </code>
        );
      }

      return (
        <pre>
          {language ? <div className="markdown-code-language">{language}</div> : null}
          <code className={className} {...props}>
            {value}
          </code>
        </pre>
      );
    },
  };

  const filteredMessages = useMemo(() => {
    if (messageFilter === 'message') {
      return messages.filter((message) => message.type === 'message');
    }

    if (messageFilter === 'secret') {
      return messages.filter((message) => message.type === 'secret');
    }

    if (messageFilter === 'pinned') {
      return messages.filter((message) => message.isPinned);
    }

    return messages;
  }, [messageFilter, messages]);

  const readJson = useCallback(async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }
    return data;
  }, []);

  const loadMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const response = await fetch('/api/messages?includeSecret=true', { cache: 'no-store' });
      const data = await readJson(response);
      setMessages(data.messages || []);
      setMessageError(null);
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : '获取留言失败');
    } finally {
      setLoadingMessages(false);
    }
  }, [readJson]);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const response = await fetch('/api/posts', { cache: 'no-store' });
      const data = await readJson(response);
      setPosts(data.posts || []);
      setPostError(null);
    } catch (error) {
      setPostError(error instanceof Error ? error.message : '获取文章失败');
    } finally {
      setLoadingPosts(false);
    }
  }, [readJson]);

  const loadDanmaku = useCallback(async () => {
    setLoadingDanmaku(true);
    try {
      const response = await fetch('/api/danmaku?admin=true', { cache: 'no-store' });
      const data = await readJson(response);
      setDanmaku(data.danmaku || []);
      setDanmakuError(null);
    } catch (error) {
      setDanmakuError(error instanceof Error ? error.message : '获取弹幕失败');
    } finally {
      setLoadingDanmaku(false);
    }
  }, [readJson]);

  useEffect(() => {
    loadMessages();
    loadPosts();
    loadDanmaku();
  }, [loadDanmaku, loadMessages, loadPosts]);

  async function handleDeleteMessage(id: string) {
    const response = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      return;
    }
    setMessages((current) => current.filter((message) => message.id !== id));
  }

  async function handleTogglePin(id: string, pinned: boolean) {
    const response = await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: pinned }),
    });
    const data = await response.json();

    if (!response.ok) {
      return;
    }

    setMessages((current) =>
      current.map((message) => (message.id === id ? data.message : message))
    );
  }

  function handleReplyOpen(id: string) {
    const target = messages.find((message) => message.id === id) || null;
    setReplyingMessage(target);
    setReplyContent(target?.reply || '');
  }

  async function handleReplySave() {
    if (!replyingMessage || !replyContent.trim()) {
      return;
    }

    setSavingReply(true);
    try {
      const response = await fetch(`/api/messages/${replyingMessage.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });
      const data = await readJson(response);
      setMessages((current) =>
        current.map((message) =>
          message.id === replyingMessage.id ? data.message : message
        )
      );
      setReplyingMessage(null);
      setReplyContent('');
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : '保存回复失败');
    } finally {
      setSavingReply(false);
    }
  }

  async function handleEditPost(id: string) {
    try {
      const response = await fetch(`/api/posts/${id}?trackView=false`, { cache: 'no-store' });
      const data = await readJson(response);
      const post = data.post as Post;
      setPostForm({
        id: post.id,
        title: post.title,
        summary: post.summary,
        content: post.content,
        tags: post.tags.join(', '),
        coverImage: post.coverImage || '',
      });
    } catch (error) {
      setPostError(error instanceof Error ? error.message : '加载文章失败');
    }
  }

  async function handleOpenPostPreview(id: string) {
    setLoadingSelectedPost(true);
    try {
      const response = await fetch(`/api/posts/${id}?trackView=false`, { cache: 'no-store' });
      const data = await readJson(response);
      setSelectedPost(data.post || null);
    } catch (error) {
      setPostError(error instanceof Error ? error.message : '获取文章失败');
    } finally {
      setLoadingSelectedPost(false);
    }
  }

  async function handleDeletePost(id: string) {
    const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      return;
    }

    setPosts((current) => current.filter((post) => post.id !== id));
    setPostForm((current) => (current.id === id ? emptyPostForm : current));
  }

  async function handleSavePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPost(true);

    try {
      const payload = {
        title: postForm.title,
        summary: postForm.summary,
        content: postForm.content,
        tags: postForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        coverImage: postForm.coverImage || undefined,
      };
      const url = postForm.id ? `/api/posts/${postForm.id}` : '/api/posts';
      const method = postForm.id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await readJson(response);

      setPosts((current) => {
        if (postForm.id) {
          return current.map((post) => (post.id === postForm.id ? data.post : post));
        }
        return [data.post, ...current];
      });
      setPostForm(emptyPostForm);
      setPostError(null);
    } catch (error) {
      setPostError(error instanceof Error ? error.message : '保存文章失败');
    } finally {
      setSavingPost(false);
    }
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await readJson(response);
      setPostForm((current) => ({ ...current, coverImage: data.url }));
    } catch (error) {
      setPostError(error instanceof Error ? error.message : '上传封面失败');
    } finally {
      setUploadingCover(false);
      event.target.value = '';
    }
  }

  async function handleDeleteDanmaku(id: string) {
    const response = await fetch(`/api/danmaku/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      return;
    }
    setDanmaku((current) => current.filter((item) => item.id !== id));
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } finally {
      setLoggingOut(false);
    }
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

      setMessages((current) =>
        current.map((m) =>
          m.id === messageId
            ? { ...m, likeCount: data.likeCount, favoriteCount: data.favoriteCount }
            : m
        )
      );
    } catch { /* ignore */ }
  }

  async function handleMessageCommentSubmit(messageId: string, content: string) {
    if (!content.trim()) return;
    try {
      const response = await fetch(`/api/messages/${messageId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-From-Admin': 'true' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) return;

      setMessages((current) =>
        current.map((m) =>
          m.id === messageId
            ? { ...m, comments: [...(m.comments || []), data.comment] }
            : m
        )
      );
    } catch { /* ignore */ }
  }

  async function handleMessageCommentReply(messageId: string, commentId: string, content: string) {
    if (!content.trim()) return;
    try {
      const response = await fetch(`/api/messages/${messageId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-From-Admin': 'true' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) return;

      const newReply: CommentReply = data.reply;
      setMessages((current) =>
        current.map((m) =>
          m.id === messageId
            ? {
                ...m,
                comments: (m.comments || []).map((c) =>
                  c.id === commentId
                    ? { ...c, replies: [...(c.replies || []), newReply] }
                    : c
                ),
              }
            : m
        )
      );
    } catch { /* ignore */ }
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

      setPosts((current) => current.map((p) =>
        p.id === postId ? { ...p, likeCount: data.likeCount, favoriteCount: data.favoriteCount } : p
      ));
      setSelectedPost((current) =>
        current?.id === postId ? { ...current, likeCount: data.likeCount, favoriteCount: data.favoriteCount } : current
      );
    } catch { /* ignore */ }
  }

  async function handlePostCommentSubmit(postId: string, content: string) {
    if (!content.trim()) return;
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-From-Admin': 'true' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) return;

      const newComment = data.comment;
      setPosts((current) => current.map((p) =>
        p.id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p
      ));
      setSelectedPost((current) =>
        current?.id === postId ? { ...current, comments: [...(current.comments || []), newComment] } : current
      );
    } catch { /* ignore */ }
  }

  async function handlePostCommentReply(postId: string, commentId: string, content: string) {
    if (!content.trim()) return;
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-From-Admin': 'true' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) return;

      const newReply: CommentReply = data.reply;
      const updater = (p: Post) => ({
        ...p,
        comments: (p.comments || []).map((c) =>
          c.id === commentId
            ? { ...c, replies: [...(c.replies || []), newReply] }
            : c
        ),
      });
      setPosts((current) => current.map((p) => p.id === postId ? updater(p) : p));
      setSelectedPost((current) => current?.id === postId ? updater(current) : current);
    } catch { /* ignore */ }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-slate-800 bg-slate-900 shadow-xl">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-pink-300">
                <Badge className="bg-pink-500 text-white hover:bg-pink-500">后台管理</Badge>
                <Badge variant="secondary" className="bg-slate-800 text-slate-200">留言 / 文章 / 弹幕</Badge>
              </div>
              <div className="space-y-3">
                <CardTitle className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-white">
                  <ShieldCheck className="h-8 w-8 text-emerald-400" />
                  树洞小站后台
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7 text-slate-300">
                  统一管理公开留言、悄悄话、文章内容与弹幕数据，后台入口已启用登录口令保护。
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" className="border-slate-700 bg-slate-900 text-slate-100" onClick={() => {
                  loadMessages();
                  loadPosts();
                  loadDanmaku();
                }}>
                  <RefreshCcw className="h-4 w-4" />
                  刷新后台数据
                </Button>
                <Button type="button" variant="outline" className="border-slate-700 bg-slate-900 text-slate-100" asChild>
                  <Link href="/">返回前台</Link>
                </Button>
                <Button type="button" className="bg-slate-100 text-slate-900 hover:bg-white" onClick={handleLogout} disabled={loggingOut}>
                  {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  退出登录
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="border-slate-800 bg-slate-900 shadow-lg">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">留言总数</CardDescription>
                <CardTitle className="text-3xl text-white">{messages.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-800 bg-slate-900 shadow-lg">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">文章总数</CardDescription>
                <CardTitle className="text-3xl text-white">{posts.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-800 bg-slate-900 shadow-lg">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">弹幕总数</CardDescription>
                <CardTitle className="text-3xl text-white">{danmaku.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </section>

        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-900 p-1">
            <TabsTrigger value="messages">留言管理</TabsTrigger>
            <TabsTrigger value="posts">文章管理</TabsTrigger>
            <TabsTrigger value="danmaku">弹幕管理</TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-6 space-y-6">
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageCircle className="h-5 w-5 text-pink-400" />
                  留言筛选
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {messageFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    type="button"
                    variant={messageFilter === filter.value ? 'default' : 'outline'}
                    className={messageFilter === filter.value ? 'bg-pink-500 text-white' : 'border-slate-700 bg-slate-900 text-slate-200'}
                    onClick={() => setMessageFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {loadingMessages ? (
              <Card className="border-slate-800 bg-slate-900"><CardContent className="flex items-center gap-3 p-6 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />正在加载留言...</CardContent></Card>
            ) : messageError ? (
              <Card className="border-red-500/40 bg-slate-900"><CardContent className="p-6 text-sm text-red-400">{messageError}</CardContent></Card>
            ) : (
              <MessageTimeline
                messages={filteredMessages}
                isAdmin
                onDelete={handleDeleteMessage}
                onReply={handleReplyOpen}
                onTogglePin={handleTogglePin}
                onAction={handleMessageAction}
                onComment={handleMessageCommentSubmit}
                onCommentReply={handleMessageCommentReply}
              />
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white"><FileText className="h-5 w-5 text-pink-400" />文章列表</CardTitle>
                <CardDescription className="text-slate-400">点击编辑可加载文章详情且不会增加浏览量。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPosts ? (
                  <div className="flex items-center gap-3 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />正在加载文章...</div>
                ) : postError ? (
                  <p className="text-sm text-red-400">{postError}</p>
                ) : posts.length === 0 ? (
                  <p className="text-sm text-slate-400">还没有文章，右侧可直接新建。</p>
                ) : (
                  posts.map((post) => (
                    <article key={post.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-sm">
                      {post.coverImage ? (
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          width={1200}
                          height={720}
                          className="mb-4 h-48 w-full rounded-2xl object-cover"
                          unoptimized
                        />
                      ) : null}
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-white">{post.title}</h3>
                        <Badge variant="secondary" className="bg-slate-800 text-slate-200">{post.views} 阅读</Badge>
                      </div>
                      <p className="line-clamp-3 text-sm leading-6 text-slate-400">{post.summary}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {post.likeCount || 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {post.favoriteCount || 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {(post.comments || []).length}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-100" onClick={() => handleOpenPostPreview(post.id)}>预览</Button>
                        <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-100" onClick={() => handleEditPost(post.id)}>编辑</Button>
                        <Button type="button" size="sm" variant="outline" className="border-red-500/40 bg-slate-900 text-red-300" onClick={() => handleDeletePost(post.id)}>删除</Button>
                      </div>
                    </article>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="text-white">{postForm.id ? '编辑文章' : '新建文章'}</CardTitle>
                <CardDescription className="text-slate-400">支持标题、摘要、正文、标签和封面图管理。</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSavePost}>
                  <div className="space-y-2">
                    <Label htmlFor="post-title">标题</Label>
                    <Input id="post-title" value={postForm.title} onChange={(event) => setPostForm((current) => ({ ...current, title: event.target.value }))} placeholder="输入文章标题" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="post-summary">摘要</Label>
                    <Textarea id="post-summary" value={postForm.summary} onChange={(event) => setPostForm((current) => ({ ...current, summary: event.target.value }))} placeholder="输入文章摘要" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="post-content">正文</Label>
                    <Textarea id="post-content" value={postForm.content} onChange={(event) => setPostForm((current) => ({ ...current, content: event.target.value }))} placeholder="输入文章正文" rows={10} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="post-tags">标签</Label>
                    <Input id="post-tags" value={postForm.tags} onChange={(event) => setPostForm((current) => ({ ...current, tags: event.target.value }))} placeholder="多个标签用逗号分隔" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="post-cover">封面图</Label>
                    <Input id="post-cover" value={postForm.coverImage} onChange={(event) => setPostForm((current) => ({ ...current, coverImage: event.target.value }))} placeholder="封面图 URL" />
                    <Input type="file" accept="image/*" onChange={handleCoverUpload} />
                    {uploadingCover ? <p className="text-sm text-slate-400">正在上传封面...</p> : null}
                    {postForm.coverImage ? (
                      <Image
                        src={postForm.coverImage}
                        alt="封面预览"
                        width={1200}
                        height={720}
                        className="h-48 w-full rounded-2xl object-cover"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" className="bg-pink-500 text-white hover:bg-pink-400" disabled={savingPost || uploadingCover || !postForm.title.trim() || !postForm.content.trim()}>
                      {savingPost ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {postForm.id ? '保存文章' : '创建文章'}
                    </Button>
                    <Button type="button" variant="outline" className="border-slate-700 bg-slate-900 text-slate-100" onClick={() => setPostForm(emptyPostForm)}>
                      重置表单
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danmaku" className="mt-6">
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white"><Radio className="h-5 w-5 text-pink-400" />弹幕管理</CardTitle>
                <CardDescription className="text-slate-400">当前提供后台查看与删除能力。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingDanmaku ? (
                  <div className="flex items-center gap-3 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />正在加载弹幕...</div>
                ) : danmakuError ? (
                  <p className="text-sm text-red-400">{danmakuError}</p>
                ) : danmaku.length === 0 ? (
                  <p className="text-sm text-slate-400">当前没有弹幕数据。</p>
                ) : (
                  danmaku.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.visitorName && <span className="text-xs font-medium text-pink-400">{item.visitorName}</span>}
                          <span className="text-sm font-medium text-white">{item.content}</span>
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        </div>
                        <p className="text-xs text-slate-400">{formatDateTime(item.createdAt)} · speed {item.speed.toFixed(1)}</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" className="border-red-500/40 bg-slate-900 text-red-300" onClick={() => handleDeleteDanmaku(item.id)}>
                        <Trash2 className="h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto border-slate-800 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title || '文章预览'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedPost ? formatDateTime(selectedPost.createdAt) : '正在加载文章内容'}
            </DialogDescription>
          </DialogHeader>
          {loadingSelectedPost ? (
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在加载文章...
            </div>
          ) : selectedPost ? (
            <div className="space-y-4">
              {selectedPost.coverImage ? (
                <Image
                  src={selectedPost.coverImage}
                  alt={selectedPost.title}
                  width={1200}
                  height={720}
                  className="h-64 w-full rounded-2xl object-cover"
                  unoptimized
                />
              ) : null}
              {selectedPost.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedPost.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-slate-800 text-slate-200">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <article className="markdown-body text-slate-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{selectedPost.content}</ReactMarkdown>
              </article>

              {/* Post action buttons */}
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-700 pt-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-pink-900/30 hover:text-pink-400"
                  onClick={() => handlePostAction(selectedPost.id, 'like')}
                >
                  <ThumbsUp className="h-4 w-4" />
                  点赞 {selectedPost.likeCount || 0}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-amber-900/30 hover:text-amber-400"
                  onClick={() => handlePostAction(selectedPost.id, 'favorite')}
                >
                  <Star className="h-4 w-4" />
                  收藏 {selectedPost.favoriteCount || 0}
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-slate-400">
                  <MessageCircle className="h-4 w-4" />
                  评论 {(selectedPost.comments || []).length}
                </span>
              </div>

              {/* Post comments */}
              {(selectedPost.comments || []).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">评论</h4>
                  {(selectedPost.comments || []).map((c) => (
                    <div key={c.id} className={`rounded-xl p-3 ${c.isAdmin ? 'bg-gradient-to-r from-pink-950/50 to-purple-950/50 border border-pink-800/30' : 'bg-slate-800/50'}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        {c.isAdmin ? (
                          <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] px-1.5 py-0 h-4 hover:bg-gradient-to-r">
                            <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                            站主
                          </Badge>
                        ) : c.visitorName ? (
                          <span className="text-xs font-medium text-pink-400">{c.visitorName}</span>
                        ) : null}
                        <span className="text-xs text-slate-500">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-300">{c.content}</p>
                      <button
                        type="button"
                        className="text-xs text-slate-500 hover:text-pink-400 transition-colors mt-1"
                        onClick={() => setPostReplyingTo(postReplyingTo === c.id ? null : c.id)}
                      >
                        <CornerDownRight className="inline h-3 w-3 mr-0.5" />
                        回复
                      </button>
                      {/* Nested replies */}
                      {(c.replies || []).length > 0 && (
                        <div className="mt-2 ml-3 space-y-2 border-l-2 border-slate-700 pl-3">
                          {(c.replies || []).map((r) => (
                            <div key={r.id} className={`rounded-md px-2.5 py-1.5 ${r.isAdmin ? 'bg-gradient-to-r from-pink-950/50 to-purple-950/50 border border-pink-800/30' : 'bg-slate-900/50'}`}>
                              <div className="flex items-center gap-2 mb-0.5">
                                {r.isAdmin ? (
                                  <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] px-1.5 py-0 h-4 hover:bg-gradient-to-r">
                                    <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                                    站主
                                  </Badge>
                                ) : r.visitorName ? (
                                  <span className="text-[11px] font-medium text-pink-400">{r.visitorName}</span>
                                ) : null}
                                <span className="text-[10px] text-slate-500">{formatDateTime(r.createdAt)}</span>
                              </div>
                              <p className="text-sm text-slate-300">{r.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Reply input */}
                      {postReplyingTo === c.id && (
                        <div className="flex gap-2 mt-2 ml-3">
                          <input
                            type="text"
                            placeholder="写下你的回复..."
                            className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-sm text-slate-200 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 placeholder:text-slate-500"
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
                          <Button
                            type="button"
                            size="sm"
                            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white h-7"
                            onClick={() => {
                              handlePostCommentReply(selectedPost.id, c.id, postReplyInput);
                              setPostReplyInput('');
                              setPostReplyingTo(null);
                            }}
                            disabled={!postReplyInput.trim()}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Post comment input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="写下你的评论..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 placeholder:text-slate-500"
                  value={postCommentInputs[selectedPost.id] || ''}
                  onChange={(e) => setPostCommentInputs((prev) => ({ ...prev, [selectedPost.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePostCommentSubmit(selectedPost.id, postCommentInputs[selectedPost.id] || '');
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                  onClick={() => handlePostCommentSubmit(selectedPost.id, postCommentInputs[selectedPost.id] || '')}
                >
                  <Send className="h-4 w-4" />
                  发送
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!replyingMessage} onOpenChange={(open) => !open && setReplyingMessage(null)}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>回复留言</DialogTitle>
            <DialogDescription className="text-slate-400">保存后会立即显示在该留言卡片中。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reply-content">回复内容</Label>
            <Textarea
              id="reply-content"
              value={replyContent}
              onChange={(event) => setReplyContent(event.target.value)}
              placeholder="写下回复内容..."
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-slate-700 bg-slate-900 text-slate-100" onClick={() => setReplyingMessage(null)}>
              取消
            </Button>
            <Button type="button" className="bg-pink-500 text-white hover:bg-pink-400" onClick={handleReplySave} disabled={!replyContent.trim() || savingReply}>
              {savingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              保存回复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image lightbox */}
      <Dialog open={!!lightboxSrc} onOpenChange={(open) => !open && setLightboxSrc(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] border-0 bg-black/90 p-0 overflow-hidden">
          {lightboxSrc && (
            <img
              src={lightboxSrc}
              alt="放大图片"
              className="max-h-[85vh] max-w-full mx-auto object-contain"
              referrerPolicy="no-referrer"
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
