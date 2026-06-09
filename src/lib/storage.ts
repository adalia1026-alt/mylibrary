import fs from 'fs';
import path from 'path';


// 数据目录：生产模式使用 DATA_DIR 环境变量（持久化目录），开发模式使用 project/data/
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// 数据文件路径
// const DATA_DIR = process.env.COZE_PROJECT_ENV === 'PROD' 
//   ? '/tmp' 
//   : process.env.COZE_WORKSPACE_PATH || '/workspace/projects';
const BOOKS_FILE = path.join(DATA_DIR, 'reading-tracker-books.json');
const TAGS_FILE = path.join(DATA_DIR, 'reading-tracker-tags.json');

// 确保数据目录存在
function ensureDataDir() {
  const dir = DATA_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 生成唯一 ID
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 本地存储操作（服务端）
export const serverStorage = {
  // 获取所有书籍
  getBooks: (): any[] => {
    try {
      ensureDataDir();
      if (!fs.existsSync(BOOKS_FILE)) {
        return [];
      }
      const data = fs.readFileSync(BOOKS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('读取书籍数据失败:', error);
      return [];
    }
  },

  // 保存书籍
  saveBooks: (books: any[]) => {
    try {
      ensureDataDir();
      fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存书籍数据失败:', error);
    }
  },

  // 获取所有标签
  getTags: (): any[] => {
    try {
      ensureDataDir();
      if (!fs.existsSync(TAGS_FILE)) {
        return [];
      }
      const data = fs.readFileSync(TAGS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('读取标签数据失败:', error);
      return [];
    }
  },

  // 保存标签
  saveTags: (tags: any[]) => {
    try {
      ensureDataDir();
      fs.writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存标签数据失败:', error);
    }
  },
};
