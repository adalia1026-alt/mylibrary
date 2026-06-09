// 书籍类型定义
export interface Book {
  id: string;
  title: string;
  author: string;
  nationality?: string; // 作者国别
  cover_url: string;
  publisher: string;
  isbn: string;
  start_date: string | null;
  end_date: string | null;
  rating: number | null;
  review: string | null;
  status: 'reading' | 'completed' | 'want_to_read';
  created_at: string;
  updated_at: string;
  tags: TagType[];
}

// 标签类型定义
export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

// 兼容字符串和对象两种格式的标签类型
export type TagType = Tag | string;

// 书籍封面搜索结果
export interface BookCover {
  title: string;
  author: string;
  publisher: string;
  cover_url: string;
  isbn: string;
  source: string;
}

// 年度统计数据
export interface YearlyStats {
  year: number;
  total_books: number;
  completed_books: number;
  reading_books: number;
  avg_rating: number;
  books: Book[];
  monthly_stats: MonthlyStats[];
}

// 月度统计
export interface MonthlyStats {
  month: number;
  count: number;
  books: Book[];
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 创建书籍请求
export interface CreateBookRequest {
  title: string;
  author: string; // 必填
  cover_url: string; // 必填
  nationality?: string; // 作者国别
  publisher?: string;
  isbn?: string;
  start_date?: string;
  status?: 'reading' | 'completed' | 'want_to_read';
  tags?: string[];
}

// 更新书籍请求
export interface UpdateBookRequest {
  title?: string;
  author?: string;
  nationality?: string; // 作者国别
  cover_url?: string;
  publisher?: string;
  isbn?: string;
  start_date?: string | null;
  end_date?: string | null;
  rating?: number | null;
  review?: string | null;
  status?: 'reading' | 'completed' | 'want_to_read';
  tags?: string[];
}
