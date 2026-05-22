'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Message, Comment, CommentReply } from '@/types';
import { formatDateTime } from '@/lib/date';
import { MessageCircle, Pin, Trash2, EyeOff, ThumbsUp, Star, Send, ShieldCheck, CornerDownRight } from 'lucide-react';

interface MessageCardProps {
  message: Message;
  isAdmin?: boolean;
  isLiked?: boolean;
  isFavorited?: boolean;
  onDelete?: (id: string) => void;
  onReply?: (id: string) => void;
  onTogglePin?: (id: string, pinned: boolean) => void;
  onAction?: (id: string, action: 'like' | 'favorite') => void;
  onComment?: (id: string, content: string) => void;
  onCommentReply?: (messageId: string, commentId: string, content: string) => void;
}

export function MessageCard({
  message,
  isAdmin,
  isLiked,
  isFavorited,
  onDelete,
  onReply,
  onTogglePin,
  onAction,
  onComment,
  onCommentReply,
}: MessageCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  const handleCommentSubmit = () => {
    if (!commentInput.trim()) return;
    onComment?.(message.id, commentInput);
    setCommentInput('');
  };

  const handleReplySubmit = (commentId: string) => {
    if (!replyInput.trim()) return;
    onCommentReply?.(message.id, commentId, replyInput);
    setReplyInput('');
    setReplyingTo(null);
  };

  const comments = message.comments || [];

  const renderComment = (c: Comment) => (
    <motion.div
      key={c.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-3 rounded-xl ${c.isAdmin ? 'admin-comment-anime' : 'comment-box-anime'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {c.isAdmin ? (
          <span className="text-xs bg-gradient-to-r from-[#ff6b9d] to-[#9c27b0] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            站主
          </span>
        ) : c.visitorName ? (
          <span className="text-xs text-[#ff6b9d]">{c.visitorName}</span>
        ) : null}
        <span className="text-xs text-white/40">{formatDateTime(c.createdAt)}</span>
      </div>
      <p className="text-sm text-white/80">{c.content}</p>
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          className="text-xs text-white/40 hover:text-[#ff6b9d] transition-colors flex items-center gap-1"
          onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
        >
          <CornerDownRight className="inline h-3 w-3" />
          回复
        </button>
      </div>
      {(c.replies || []).length > 0 && (
        <div className="mt-2 ml-3 space-y-2 border-l-2 border-[#ff6b9d]/20 pl-3">
          {(c.replies || []).map((r: CommentReply) => (
            <div key={r.id} className={`p-2 rounded-lg ${r.isAdmin ? 'admin-comment-anime' : 'bg-white/5'}`}>
              <div className="flex items-center gap-2 mb-0.5">
                {r.isAdmin ? (
                  <span className="text-xs bg-gradient-to-r from-[#ff6b9d] to-[#9c27b0] text-white px-1.5 py-0 rounded-full flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    站主
                  </span>
                ) : r.visitorName ? (
                  <span className="text-[11px] text-[#ff6b9d]">{r.visitorName}</span>
                ) : null}
                <span className="text-[10px] text-white/40">{formatDateTime(r.createdAt)}</span>
              </div>
              <p className="text-sm text-white/80">{r.content}</p>
            </div>
          ))}
        </div>
      )}
      {replyingTo === c.id && (
        <div className="flex gap-2 mt-2 ml-3">
          <input
            type="text"
            placeholder="写下你的回复..."
            className="anime-input flex-1 text-sm py-2"
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleReplySubmit(c.id);
              }
            }}
            autoFocus
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="anime-btn h-9 px-3"
            onClick={() => handleReplySubmit(c.id)}
            disabled={!replyInput.trim()}
          >
            <Send className="h-3 w-3" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <div className={`anime-card p-5 ${message.isPinned ? 'border-[#ff9800]/50' : ''} relative overflow-hidden`}>
        {/* 置顶标识 */}
        {message.isPinned && (
          <div className="absolute -top-0 -right-0">
            <div className="pin-badge-anime flex items-center gap-1 rounded-bl-xl rounded-tr-xl">
              <Pin className="w-3 h-3" />
              置顶
            </div>
          </div>
        )}

        {/* 悄悄话标识 */}
        {isAdmin && message.type === 'secret' && (
          <div className="absolute top-4 right-4">
            <div className="secret-badge-anime flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              悄悄话
            </div>
          </div>
        )}

        {/* 顶部渐变条 */}
        <div className={`absolute top-0 left-0 w-full h-1 ${message.isPinned ? 'bg-gradient-to-r from-[#ff9800] to-[#ff6b35]' : 'bg-gradient-to-r from-[#ff6b9d] to-[#9c27b0]'}`} />

        <div className="space-y-3 relative z-10">
          {/* 头部信息 */}
          <div className="flex items-center gap-2">
            {message.visitorName && (
              <span className="text-xs font-bold text-[#ff6b9d]">
                {message.visitorName}
              </span>
            )}
            <span className="text-xs text-white/40">
              {formatDateTime(message.createdAt)}
            </span>
          </div>

          {/* 内容 */}
          <p className="whitespace-pre-wrap leading-relaxed text-white/80">
            {message.content}
          </p>

          {/* 图片 */}
          {message.images && message.images.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {message.images.map((img, i) => (
                <motion.button
                  key={i}
                  type="button"
                  className="image-container-anime"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => window.open(img, '_blank', 'noopener,noreferrer')}
                >
                  <img
                    src={img}
                    alt="留言图片"
                    className="max-h-[200px] max-w-[200px] object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </motion.button>
              ))}
            </div>
          )}

          {/* 站主回复 */}
          {message.reply && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#ff6b9d]/10 to-[#9c27b0]/10 border border-[#ff6b9d]/30">
              <div className="flex items-center gap-2 text-sm mb-1 text-[#ff6b9d]">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-bold">站主回复</span>
              </div>
              <p className="text-sm text-white/80">{message.reply}</p>
            </div>
          )}

          {/* 评论预览 */}
          {comments.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                className="text-xs text-[#ff6b9d] hover:text-[#ff9eb5] transition-colors flex items-center gap-1"
                onClick={() => {
                  setShowComments(!showComments);
                  if (showComments) setReplyingTo(null);
                }}
              >
                {showComments ? '收起评论' : `查看评论 (${comments.length})`}
              </button>
              {showComments && (
                <div className="space-y-2 pl-3 border-l-2 border-[#ff6b9d]/20">
                  {comments.map(renderComment)}
                </div>
              )}
            </div>
          )}

          {/* 操作栏 */}
          <div className="flex items-center justify-between pt-3 border-t border-[#ff6b9d]/20">
            <span className="text-xs text-white/40">{formatDateTime(message.createdAt)}</span>

            <div className="flex items-center gap-2">
              {/* 点赞 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onAction?.(message.id, 'like')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full transition-all ${
                  isLiked
                    ? 'bg-gradient-to-r from-[#ff6b9d] to-[#9c27b0] text-white shadow-lg shadow-[#ff6b9d]/30'
                    : 'text-white/60 hover:text-[#ff6b9d] hover:bg-[#ff6b9d]/10'
                }`}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                点赞 {message.likeCount || 0}
              </motion.button>

              {/* 收藏 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onAction?.(message.id, 'favorite')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full transition-all ${
                  isFavorited
                    ? 'bg-gradient-to-r from-[#ff9800] to-[#ff6b35] text-white shadow-lg shadow-[#ff9800]/30'
                    : 'text-white/60 hover:text-[#ff9800] hover:bg-[#ff9800]/10'
                }`}
              >
                <Star className="h-3.5 w-3.5" />
                收藏 {message.favoriteCount || 0}
              </motion.button>

              {/* 评论 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white/60 hover:text-[#4fc3f7] hover:bg-[#4fc3f7]/10 rounded-full transition-all"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                评论 {comments.length}
              </motion.button>

              {/* 管理员操作 */}
              {isAdmin && (
                <div className="flex items-center gap-1 ml-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => onTogglePin?.(message.id, !message.isPinned)}
                    className={`p-2 rounded-full transition-all ${message.isPinned ? 'text-[#ff9800] bg-[#ff9800]/20' : 'text-white/40 hover:text-[#ff9800]'}`}
                  >
                    <Pin className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => onReply?.(message.id)}
                    className="p-2 rounded-full text-white/40 hover:text-[#4fc3f7] hover:bg-[#4fc3f7]/20 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => onDelete?.(message.id)}
                    className="p-2 rounded-full text-white/40 hover:text-[#ff6b9d] hover:bg-[#ff6b9d]/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* 评论输入 */}
          {showComments && (
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="写下你的评论..."
                className="anime-input flex-1 text-sm"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCommentSubmit();
                  }
                }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="anime-btn"
                onClick={handleCommentSubmit}
                disabled={!commentInput.trim()}
              >
                <Send className="h-3.5 w-3.5 inline mr-1" />
                发送
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
