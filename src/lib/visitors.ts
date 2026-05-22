import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');

export interface Visitor {
  fingerprint: string;
  name: string;
  createdAt: string;
  nameChangedAt?: string;
  originalName?: string;
}

export interface VisitorData {
  visitors: Visitor[];
  usedNames: string[];
}

// Character pools for generating random 1-10 char Chinese names
const SURNAMES = [
  '李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
  '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
  '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
  '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎',
  '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜',
  '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆',
  '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史',
  '顾', '侯', '邵', '孟', '龙', '万', '段', '雷', '钱', '汤',
  '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文',
];

const NAME_CHARS = [
  '风', '花', '雪', '月', '星', '云', '雨', '露', '霜', '雾',
  '山', '水', '林', '石', '竹', '松', '梅', '兰', '菊', '荷',
  '清', '明', '静', '幽', '远', '深', '浅', '淡', '柔', '刚',
  '晨', '暮', '春', '夏', '秋', '冬', '阳', '光', '影', '梦',
  '青', '白', '紫', '红', '碧', '翠', '素', '素', '苍', '玄',
  '飞', '落', '归', '望', '听', '寻', '忆', '念', '思', '叹',
  '溪', '湖', '海', '河', '泉', '潮', '波', '澜', '涛', '浪',
  '鹤', '鹿', '燕', '蝶', '莺', '鱼', '鹰', '雁', '凤', '龙',
  '琴', '棋', '书', '画', '诗', '酒', '茶', '香', '墨', '砚',
  '北', '南', '东', '西', '天', '地', '宇', '宙', '辰', '霄',
  '安', '宁', '和', '乐', '怡', '然', '悠', '闲', '雅', '韵',
  '锦', '华', '辉', '耀', '灵', '慧', '妙', '奇', '珍', '宝',
];

function getFingerprint(ip: string, ua: string): string {
  const raw = `${ip}|${ua}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

async function getVisitorData(): Promise<VisitorData> {
  const filePath = path.join(DATA_DIR, 'visitors.json');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    const data: VisitorData = { visitors: [], usedNames: [] };
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return data;
  }
}

async function saveVisitorData(data: VisitorData): Promise<void> {
  const filePath = path.join(DATA_DIR, 'visitors.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

function generateName(usedNames: Set<string>): string {
  // Try up to 500 random combinations
  for (let i = 0; i < 500; i++) {
    const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    const extraLen = Math.floor(Math.random() * 9) + 0; // 0-9 extra chars, total 1-10
    let name = surname;
    for (let j = 0; j < extraLen; j++) {
      name += NAME_CHARS[Math.floor(Math.random() * NAME_CHARS.length)];
    }
    // Clamp to max 10 chars
    name = name.slice(0, 10);
    if (!usedNames.has(name)) return name;
  }
  // Fallback
  const id = usedNames.size + 1;
  return `旅人${id}`;
}

export async function getOrCreateVisitor(ip: string, ua: string): Promise<Visitor> {
  const fingerprint = getFingerprint(ip, ua);
  const data = await getVisitorData();

  const existing = data.visitors.find(v => v.fingerprint === fingerprint);
  if (existing) return existing;

  const usedNames = new Set(data.usedNames);
  const name = generateName(usedNames);

  const visitor: Visitor = {
    fingerprint,
    name,
    createdAt: new Date().toISOString(),
  };

  data.visitors.push(visitor);
  data.usedNames.push(name);
  await saveVisitorData(data);

  return visitor;
}

export async function getVisitorByFingerprint(fingerprint: string): Promise<Visitor | null> {
  const data = await getVisitorData();
  return data.visitors.find(v => v.fingerprint === fingerprint) || null;
}

export async function changeVisitorName(fingerprint: string, newName: string): Promise<{ success: boolean; error?: string; visitor?: Visitor }> {
  const data = await getVisitorData();
  const visitor = data.visitors.find(v => v.fingerprint === fingerprint);

  if (!visitor) {
    return { success: false, error: '用户不存在' };
  }

  // Check if name was already changed
  if (visitor.nameChangedAt) {
    return { success: false, error: '名字只能修改一次' };
  }

  // Check if name is already used
  if (data.usedNames.includes(newName)) {
    return { success: false, error: '该名字已被使用' };
  }

  // Validate name length
  if (newName.length < 1 || newName.length > 10) {
    return { success: false, error: '名字长度需在1-10个字符之间' };
  }

  // Save original name and update
  visitor.originalName = visitor.name;
  visitor.name = newName;
  visitor.nameChangedAt = new Date().toISOString();
  data.usedNames.push(newName);

  await saveVisitorData(data);
  return { success: true, visitor };
}

export function getFingerprintFromRequest(request: Request): string {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  return getFingerprint(ip, ua);
}

export function getClientInfoFromRequest(request: Request): { ip: string; ua: string } {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  return { ip, ua };
}

export { getVisitorData, saveVisitorData };
