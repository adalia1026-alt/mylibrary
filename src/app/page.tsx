'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BookOpen,
  Search,
  LayoutGrid,
  List,
  BarChart3,
  Loader2,
  BookMarked,
} from 'lucide-react';
import {
  AddBookDialog,
  BookCard,
  BookDetailDialog,
  YearlyStatsView,
} from '@/components/reading-tracker';
import { Book } from '@/types';
import { toast } from 'sonner';

export default function ReadingTrackerPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // 对话框状态
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  // 获取书籍列表
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/books?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setBooks(data.data);
      }
    } catch (error) {
      console.error('获取书籍失败:', error);
      toast.error('获取书籍失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [statusFilter]);

  // 搜索过滤
  const filteredBooks = books.filter((book) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.author?.toLowerCase().includes(query) ||
      book.publisher?.toLowerCase().includes(query) ||
      book.tags?.some((t) => {
        const tagName = typeof t === 'string' ? t : t.name;
        return tagName.toLowerCase().includes(query);
      })
    );
  });

  // 删除书籍
  const handleDelete = async () => {
    if (!bookToDelete) return;
    
    try {
      const response = await fetch(`/api/books/${bookToDelete.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('删除成功');
        fetchBooks();
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    } finally {
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    }
  };

  // 状态统计
  const statusCounts = {
    all: books.length,
    want_to_read: books.filter((b) => b.status === 'want_to_read').length,
    reading: books.filter((b) => b.status === 'reading').length,
    completed: books.filter((b) => b.status === 'completed').length,
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 头部 */}
      <header className="shrink-0 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookMarked className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">读书记录</h1>
                <p className="text-sm text-muted-foreground">
                  记录你的阅读旅程
                </p>
              </div>
            </div>
            <AddBookDialog onBookAdded={fetchBooks} />
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 overflow-auto mx-auto w-full max-w-7xl px-4 py-6">
        <Tabs defaultValue="books" className="h-full flex flex-col space-y-6">
          <TabsList className="shrink-0">
            <TabsTrigger value="books" className="gap-2">
              <BookOpen className="h-4 w-4" />
              我的书架
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              年度统计
            </TabsTrigger>
          </TabsList>

          {/* 书架 */}
          <TabsContent value="books" className="flex-1 flex flex-col space-y-4 data-[state=inactive]:hidden">
            {/* 工具栏 */}
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              {/* 搜索 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索书名、作者、标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 状态筛选 */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部 ({statusCounts.all})</SelectItem>
                  <SelectItem value="want_to_read">
                    想读 ({statusCounts.want_to_read})
                  </SelectItem>
                  <SelectItem value="reading">
                    在读 ({statusCounts.reading})
                  </SelectItem>
                  <SelectItem value="completed">
                    读完 ({statusCounts.completed})
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* 视图切换 */}
              <div className="flex gap-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 书籍列表 */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBooks.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="flex-1 overflow-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onClick={() => {
                          setSelectedBook(book);
                          setDetailOpen(true);
                        }}
                        onEdit={() => {
                          setSelectedBook(book);
                          setDetailOpen(true);
                        }}
                        onDelete={() => {
                          setBookToDelete(book);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <div className="space-y-2 pr-4">
                    {filteredBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onClick={() => {
                          setSelectedBook(book);
                          setDetailOpen(true);
                        }}
                        onEdit={() => {
                          setSelectedBook(book);
                          setDetailOpen(true);
                        }}
                        onDelete={() => {
                          setBookToDelete(book);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? '没有找到相关书籍' : '还没有添加书籍'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? '试试其他关键词'
                    : '点击上方按钮添加你的第一本书'}
                </p>
                {!searchQuery && (
                  <AddBookDialog onBookAdded={fetchBooks} />
                )}
              </div>
            )}
          </TabsContent>

          {/* 年度统计 */}
          <TabsContent value="stats" className="flex-1 overflow-auto data-[state=inactive]:hidden">
            <YearlyStatsView
              onSelectBook={(book) => {
                setSelectedBook(book);
                setDetailOpen(true);
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* 书籍详情对话框 */}
      <BookDetailDialog
        book={selectedBook}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={fetchBooks}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{bookToDelete?.title}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
