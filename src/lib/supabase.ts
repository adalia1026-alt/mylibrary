import { createClient } from '@supabase/supabase-js';

// Supabase 配置
// 注意：在生产环境中，这些值应该从环境变量中获取
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// 创建 Supabase 客户端
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 检查 Supabase 是否配置
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

// 本地存储 Key
const LOCAL_STORAGE_KEY = 'reading_tracker_books';
const LOCAL_STORAGE_TAGS_KEY = 'reading_tracker_tags';

// 本地存储操作（作为降级方案）
export const localStorageDB = {
  // 获取所有书籍
  getBooks: (): any[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // 保存书籍
  saveBooks: (books: any[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(books));
  },

  // 获取所有标签
  getTags: (): any[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(LOCAL_STORAGE_TAGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // 保存标签
  saveTags: (tags: any[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_STORAGE_TAGS_KEY, JSON.stringify(tags));
  },

  // 生成唯一 ID
  generateId: () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};
