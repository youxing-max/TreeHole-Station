export interface CommentReply {
  id: string;
  content: string;
  createdAt: string;
  visitorName?: string;
  isAdmin?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  visitorName?: string;
  isAdmin?: boolean;
  replies?: CommentReply[];
}

export interface ReactionRecord {
  [visitorFingerprint: string]: string; // fingerprint -> visitor name
}

export interface Message {
  id: string;
  type: 'message' | 'secret';
  content: string;
  images?: string[];
  emojiReactions: {
    [emoji: string]: number;
  };
  likeCount: number;
  favoriteCount: number;
  likedBy: ReactionRecord;
  favoritedBy: ReactionRecord;
  comments: Comment[];
  createdAt: string;
  visitorName?: string;
  ipHash?: string;
  reply?: string;
  isPinned?: boolean;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  likeCount: number;
  favoriteCount: number;
  likedBy: ReactionRecord;
  favoritedBy: ReactionRecord;
  viewedBy?: ReactionRecord; // fingerprint -> visitor name, for view tracking
  comments: Comment[];
}

export interface Danmaku {
  id: string;
  content: string;
  color: string;
  speed: number;
  visitorName?: string;
  createdAt: string;
}

export interface MessageData {
  messages: Message[];
  lastId: number;
}

export interface PostData {
  posts: Post[];
  lastId: number;
}

export interface DanmakuData {
  danmaku: Danmaku[];
  lastId: number;
}
