'use client';

import type { Message } from '@/types';
import { motion } from 'framer-motion';
import { MessageCard } from './MessageCard';

interface MessageTimelineProps {
  messages: Message[];
  isAdmin?: boolean;
  likedMessages?: Set<string>;
  favoritedMessages?: Set<string>;
  onDelete?: (id: string) => void;
  onReply?: (id: string) => void;
  onTogglePin?: (id: string, pinned: boolean) => void;
  onAction?: (id: string, action: 'like' | 'favorite') => void;
  onComment?: (id: string, content: string) => void;
  onCommentReply?: (messageId: string, commentId: string, content: string) => void;
}

export function MessageTimeline({
  messages,
  isAdmin,
  likedMessages,
  favoritedMessages,
  onDelete,
  onReply,
  onTogglePin,
  onAction,
  onComment,
  onCommentReply,
}: MessageTimelineProps) {
  const sortedMessages = [...messages].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (sortedMessages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="anime-card text-center py-16"
      >
        <div className="text-6xl mb-4">🌸</div>
        <p className="text-xl gradient-text mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          还没有留言
        </p>
        <p className="text-sm text-white/50">来做第一个留言的人吧~</p>
        <div className="mt-6 flex justify-center gap-2">
          {['#ff6b9d', '#9c27b0', '#4fc3f7', '#ffeb3b', '#ff9800'].map((color, i) => (
            <motion.div
              key={i}
              className="w-3 h-8 rounded-full"
              style={{ background: color, opacity: 0.6 }}
              animate={{ scaleY: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedMessages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <MessageCard
            message={message}
            isAdmin={isAdmin}
            isLiked={likedMessages?.has(message.id)}
            isFavorited={favoritedMessages?.has(message.id)}
            onDelete={onDelete}
            onReply={onReply}
            onTogglePin={onTogglePin}
            onAction={onAction}
            onComment={onComment}
            onCommentReply={onCommentReply}
          />
        </motion.div>
      ))}
    </div>
  );
}
