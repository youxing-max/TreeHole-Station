'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, X, Send, Loader2 } from 'lucide-react';

interface MessageFormProps {
  onSubmit: (content: string, type: 'message' | 'secret', images: string[]) => Promise<void>;
}

export function MessageForm({ onSubmit }: MessageFormProps) {
  const [content, setContent] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= 3) {
      alert('最多上传3张图片');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setImages([...images, data.url]);
      } else {
        alert(data.error || '上传失败');
      }
    } catch {
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(content, isSecret ? 'secret' : 'message', images);
      setContent('');
      setImages([]);
      setIsSecret(false);
    } catch {
      alert('发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="anime-card p-6 relative overflow-hidden"
      onSubmit={handleSubmit}
    >
      {/* 装饰光效 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff6b9d] via-[#9c27b0] to-[#4fc3f7]" />

      <div className="space-y-4 relative z-10">
        <textarea
          placeholder="写下你的心声..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="anime-input w-full min-h-[120px] resize-none"
          maxLength={1000}
        />

        {images.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {images.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <div className="image-container-anime">
                  <img src={img} alt="上传图片预览" className="h-20 w-20 object-cover" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-[#ff6b9d] to-[#9c27b0] text-white flex items-center justify-center shadow-lg"
                >
                  <X className="w-3 h-3" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= 3}
              className="flex items-center gap-2 text-[#ff6b9d] hover:text-[#ff9eb5] transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
              <span className="text-sm">{images.length}/3</span>
            </motion.button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSecret ? 'bg-[#9c27b0] border-[#9c27b0]' : 'border-[#ff6b9d]/50'}`}>
                {isSecret && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2.5 h-2.5 bg-white rounded-sm"
                  />
                )}
              </div>
              <input
                type="checkbox"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="hidden"
              />
              <span className="text-sm text-white/60 group-hover:text-[#9c27b0] transition-colors">悄悄话</span>
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!content.trim() || submitting}
            className="anime-btn disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            发布
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
}
