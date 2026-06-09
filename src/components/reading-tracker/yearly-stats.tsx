'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCoverUrl } from '@/lib/cover-url';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Star, Clock, BookMarked } from 'lucide-react';
import { YearlyStats, Book } from '@/types';

const BOOK_COLORS = [
  '#3B82F6', '#06B6D4', '#10B981', '#84CC16',
  '#EAB308', '#F97316', '#EF4444', '#EC4899',
  '#8B5CF6', '#6366F1', '#14B8A6', '#F59E0B',
];

interface YearlyStatsViewProps {
  onSelectBook?: (book: Book) => void;
}

export function YearlyStatsView({ onSelectBook }: YearlyStatsViewProps) {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [stats, setStats] = useState<YearlyStats | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // 生成年份选项
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 10; y--) {
    years.push(y.toString());
  }

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/stats/yearly?year=${year}`);
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('获取统计失败:', error);
      }
    };
    fetchStats();
  }, [year]);

  // 月份数据（包含书籍信息用于分色显示）
  const monthlyData = stats?.monthly_stats?.map((m) => ({
    name: `${m.month}月`,
    count: m.count,
    books: m.books,
  })) || [];

  const maxCount = Math.max(...monthlyData.map((m) => m.books.length), 1);

  // 设置图片错误
  const handleImageError = (bookId: string) => {
    setImageErrors(prev => new Set(prev).add(bookId));
  };

  return (
    <div className="space-y-6">
      {/* 年份选择 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">年度统计</h2>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookMarked className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总书籍</p>
                <p className="text-2xl font-bold">{stats?.total_books || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已读完</p>
                <p className="text-2xl font-bold">{stats?.completed_books || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">正在读</p>
                <p className="text-2xl font-bold">{stats?.reading_books || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">平均评分</p>
                <p className="text-2xl font-bold">{stats?.avg_rating?.toFixed(1) || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 月度图表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">月度阅读量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            {monthlyData.length > 0 ? (
              <div className="flex h-full">
                {/* Y 轴刻度 */}
                <div className="flex flex-col justify-between pr-2 text-xs text-muted-foreground h-full pb-5">
                  {Array.from({ length: maxCount + 1 }, (_, i) => (
                    <span key={i} className="leading-none">{i}</span>
                  ))}
                </div>
                {/* 柱形图 */}
                <div className="flex-1 flex items-end gap-[2px]">
                  {monthlyData.map((month) => {
                    const barHeight = month.books.length > 0
                      ? `${(month.books.length / maxCount) * 100}%`
                      : '0';
                    return (
                      <div
                        key={month.name}
                        className="flex-1 flex flex-col items-center justify-end h-full"
                      >
                        <div
                          className="w-full rounded-t-sm overflow-hidden flex flex-col-reverse transition-all"
                          style={{ height: barHeight, minHeight: month.books.length > 0 ? '4px' : '0' }}
                        >
                          {month.books.map((book, i) => (
                            <div
                              key={book.id}
                              className="w-full transition-opacity hover:opacity-80 cursor-pointer"
                              style={{
                                height: `${100 / month.books.length}%`,
                                backgroundColor: BOOK_COLORS[i % BOOK_COLORS.length],
                              }}
                              title={`${book.title}${book.author ? ` - ${book.author}` : ''}`}
                              onClick={() => onSelectBook?.(book)}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 leading-none">
                          {month.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 书籍列表（按月度分块排序） */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {year}年已读完的书 ({stats?.books?.length || 0}本)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.books && stats.books.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-6 pr-4">
                {monthlyData
                  .filter((m) => m.books.length > 0)
                  .map((month) => (
                    <div key={month.name}>
                      {/* 月度分隔标题 */}
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: BOOK_COLORS[(parseInt(month.name) - 1) % BOOK_COLORS.length],
                          }}
                        />
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          {month.name} · {month.books.length} 本
                        </h3>
                      </div>
                      {/* 当月书籍网格 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {month.books.map((book) => (
                          <div
                            key={book.id}
                            className="group cursor-pointer"
                            onClick={() => onSelectBook?.(book)}
                          >
                            <div className="bg-muted rounded-lg overflow-hidden mb-2 relative" style={{ height: '140px', width: '99px' }}>
                              {book.cover_url && !imageErrors.has(book.id) ? (
                                <img
                                  src={getCoverUrl(book.cover_url)}
                                  alt={book.title}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  onError={() => handleImageError(book.id)}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                  <BookOpen className="h-8 w-8 text-primary/40" />
                                </div>
                              )}
                              {book.rating && (
                                <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {book.rating}
                                </div>
                              )}
                            </div>
                            <h4 className="font-medium text-sm line-clamp-1">{book.title}</h4>
                            {book.author && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {book.author}
                              </p>
                            )}
                            {book.end_date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(book.end_date).toLocaleDateString('zh-CN', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {year}年还没有读完的书
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
