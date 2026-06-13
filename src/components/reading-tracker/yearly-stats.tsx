'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { getCoverUrl } from '@/lib/cover-url';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Star, Clock, BookMarked, Download } from 'lucide-react';
import { toast } from 'sonner';
import { YearlyStats, Book } from '@/types';
import { YearlyExportImage, YearlyExportHandle } from './yearly-export-image';

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
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<YearlyExportHandle>(null);

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

  // 导出年度阅读总结为 PNG
  const handleExportPNG = useCallback(async () => {
    if (!stats || isExporting) return;
    console.log('[导出] 开始导出年度图片...');

    setIsExporting(true);

    try {
      // 动态导入 html2canvas（避免 SSR 问题）
      const html2canvas = (await import('html2canvas')).default;
      console.log('[导出] html2canvas 加载成功');

      const element = exportRef.current?.getElement();
      if (!element) {
        console.error('[导出] 导出元素未找到');
        toast.error('导出失败：未找到导出元素');
        return;
      }
      console.log('[导出] 导出元素已获取, 尺寸:', element.offsetWidth, 'x', element.offsetHeight);

      // ──── 关键：在真实 DOM 中预加载所有封面图片为 data URL ────
      // html2canvas 的 onclone 运行在沙箱 iframe 中，fetch 不可用
      // 必须在主页面上下文中预加载，然后直接替换真实 DOM 中的 img src
      const imgs = element.querySelectorAll('img');
      const originalSrcs = new Map<HTMLImageElement, string>();
      const preloadTasks: Promise<void>[] = [];

      imgs.forEach((img) => {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('data:') || src === '/placeholder.svg') return;

        // 保存原始 src，稍后恢复
        originalSrcs.set(img, src);

        preloadTasks.push(
          fetch(src)
            .then((res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.blob();
            })
            .then((blob) => {
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            })
            .then((dataUrl) => {
              img.setAttribute('src', dataUrl);
              console.log('[导出] 预加载封面:', src.substring(0, 60), '→ data URL');
            })
            .catch((e) => {
              console.warn('[导出] 封面预加载失败 (保留原始URL):', src, e);
            })
        );
      });

      await Promise.all(preloadTasks);
      console.log('[导出] 所有封面预加载完成, 共', originalSrcs.size, '张');

      // 等待一帧，确保 DOM 更新
      await new Promise((r) => requestAnimationFrame(r));

      // html2canvas 导出（所有图片已是 data URL，无跨域问题）
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
        useCORS: false,
        allowTaint: false,
        logging: false,
        onclone: (clonedDoc) => {
          // 修复 oklch()/lab() 颜色函数
          clonedDoc.querySelectorAll('style').forEach((el) => {
            if (el.textContent) {
              el.textContent = el.textContent
                .replace(/oklch\([^)]+\)/g, '#ffffff')
                .replace(/lab\([^)]+\)/g, '#ffffff');
            }
          });

          const safeStyle = clonedDoc.createElement('style');
          safeStyle.textContent = `
            :root, :host, html, body, .yearly-export-container, .yearly-export-container * {
              --background: #ffffff; --foreground: #0a0a0a;
              --card: #ffffff; --card-foreground: #0a0a0a;
              --popover: #ffffff; --popover-foreground: #0a0a0a;
              --primary: #171717; --primary-foreground: #fafafa;
              --secondary: #f5f5f5; --secondary-foreground: #171717;
              --muted: #f5f5f5; --muted-foreground: #737373;
              --accent: #f5f5f5; --accent-foreground: #171717;
              --destructive: #ef4444; --border: #e5e5e5;
              --input: #e5e5e5; --ring: #a3a3a3;
              --chart-1: #e76e50; --chart-2: #2a9d8f;
              --chart-3: #274754; --chart-4: #e9c46a;
              --chart-5: #f4a261; --sidebar: #fafafa;
              --sidebar-foreground: #0a0a0a; --sidebar-primary: #171717;
              --sidebar-primary-foreground: #fafafa; --sidebar-accent: #f5f5f5;
              --sidebar-accent-foreground: #171717; --sidebar-border: #e5e5e5;
              --sidebar-ring: #a3a3a3; --radius: 0.5rem;
            }
          `;
          clonedDoc.head.appendChild(safeStyle);

          clonedDoc.querySelectorAll('*').forEach((el) => {
            const style = (el as HTMLElement).style;
            if (!style) return;
            for (let i = style.length - 1; i >= 0; i--) {
              const val = style.getPropertyValue(style[i]);
              if (val && (val.includes('oklch(') || val.includes('lab('))) {
                style.removeProperty(style[i]);
              }
            }
          });
        },
      });

      // 恢复原始 img src（避免影响页面显示）
      originalSrcs.forEach((src, img) => {
        img.setAttribute('src', src);
      });
      console.log('[导出] Canvas 生成成功, 尺寸:', canvas.width, 'x', canvas.height);

      // Tauri WKWebView 不支持 link.click() 下载
      // 改为在新窗口打开图片，用户可右键保存
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('导出失败：无法生成图片数据');
          return;
        }
        const url = URL.createObjectURL(blob);
        console.log('[导出] Blob URL 已创建, 大小:', (blob.size / 1024).toFixed(1), 'KB');

        // 尝试多种下载方式
        const link = document.createElement('a');
        link.download = `MyLibrary_${year}年度阅读总结.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 如果 link.click() 无效（Tauri），延迟打开新窗口作为后备
        setTimeout(() => {
          window.open(url, '_blank');
        }, 100);

        // 清理 blob URL（延迟以确保下载/打开完成）
        setTimeout(() => URL.revokeObjectURL(url), 30000);

        toast.success('年度图片已导出！');
      }, 'image/png');
    } catch (error) {
      console.error('[导出] 导出失败:', error);
      toast.error(`导出失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsExporting(false);
    }
  }, [stats, year, isExporting]);

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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {year}年已读完的书 ({stats?.books?.length || 0}本)
            </CardTitle>
            {stats?.books && stats.books.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPNG}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? '导出中...' : '导出年度图片'}
              </Button>
            )}
          </div>
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

      {/* 隐藏的导出组件（html2canvas 捕获用） */}
      {stats && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '1200px',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -1,
            overflow: 'hidden',
          }}
        >
          <YearlyExportImage ref={exportRef} stats={stats} year={year} />
        </div>
      )}
    </div>
  );
}
