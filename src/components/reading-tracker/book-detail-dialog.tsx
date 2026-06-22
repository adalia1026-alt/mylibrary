'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCoverUrl } from '@/lib/cover-url';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Star,
  CalendarIcon,
  Loader2,
  X,
  Plus,
  BookOpen,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Book } from '@/types';
import { CountrySelect } from './country-select';
import { getCountryByCode } from '@/lib/countries';

interface BookDetailDialogProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function BookDetailDialog({
  book,
  open,
  onOpenChange,
  onUpdated,
}: BookDetailDialogProps) {
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 表单状态
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<string>('');
  const [nationality, setNationality] = useState(''); // 作者国别代码
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // 初始化表单
  useEffect(() => {
    if (book) {
      setStatus(book.status);
      setTitle(book.title || '');
      setNationality(book.nationality || ''); // 修复：初始化国别字段
      setStartDate(book.start_date ? new Date(book.start_date) : undefined);
      setEndDate(book.end_date ? new Date(book.end_date) : undefined);
      setRating(book.rating || 0);
      setReview(book.review || '');
      setTags(book.tags?.map((t) => typeof t === 'string' ? t : t.name) || []);
      setImageError(false);
    }
  }, [book]);

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // 移除标签
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // 保存更新
  const handleSave = async () => {
    if (!book) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          status,
          nationality,
          start_date: startDate?.toISOString().split('T')[0],
          end_date: endDate?.toISOString().split('T')[0],
          rating: rating || null,
          review: review || null,
          tags,
        }),
      });

      if (response.ok) {
        onUpdated?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('更新失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 状态配置
  const statusConfig = {
    want_to_read: { label: '想读', color: 'bg-gray-500' },
    reading: { label: '在读', color: 'bg-blue-500' },
    completed: { label: '读完', color: 'bg-green-500' },
  };

  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            书籍详情
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* 书籍基本信息 */}
            <div className="flex gap-6">
              {/* 封面 */}
              <div className="bg-muted rounded-lg overflow-hidden flex-shrink-0" style={{ height: '140px', width: '99px' }}>
                {book.cover_url && !imageError ? (
                  <img
                    src={getCoverUrl(book.cover_url)}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <BookOpen className="h-12 w-12 text-primary/40" />
                  </div>
                )}
              </div>

              {/* 信息 */}
              <div className="flex-1 space-y-3">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-bold h-auto py-1"
                  placeholder="书名"
                />
                {book.author && (
                  <p className="text-muted-foreground">
                    作者: {book.author}
                    {book.nationality && (() => {
                      const country = getCountryByCode(book.nationality);
                      return country ? ` (${country.flag} ${country.name})` : '';
                    })()}
                  </p>
                )}
                {book.publisher && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {book.publisher}
                  </div>
                )}
                {book.isbn && (
                  <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
                )}
              </div>
            </div>

            {/* 作者国别 */}
            <div className="space-y-2">
              <Label>作者国别</Label>
              <CountrySelect
                value={nationality}
                onChange={(code) => setNationality(code)}
                placeholder="选择国家/地区"
              />
            </div>

            {/* 阅读状态 */}
            <div className="space-y-2">
              <Label>阅读状态</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 阅读时间 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始阅读日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate
                        ? format(startDate, 'PPP', { locale: zhCN })
                        : '选择日期'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      locale={zhCN}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>完成阅读日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate
                        ? format(endDate, 'PPP', { locale: zhCN })
                        : '选择日期'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      locale={zhCN}
                      disabled={(date) => 
                        startDate ? date < startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 评分 */}
            <div className="space-y-2">
              <Label>评分</Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className="focus:outline-none"
                    onClick={() => setRating(i + 1)}
                    onMouseEnter={() => {}}
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 transition-colors',
                        i < rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-300'
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating > 0 ? `${rating} 星` : '未评分'}
                </span>
              </div>
            </div>

            {/* 评论 */}
            <div className="space-y-2">
              <Label>评论（最多5000字）</Label>
              <Textarea
                placeholder="写下你对这本书的评价..."
                value={review}
                onChange={(e) => {
                  if (e.target.value.length <= 5000) {
                    setReview(e.target.value);
                  }
                }}
                className="min-h-[150px]"
              />
              <div className="text-xs text-muted-foreground text-right">
                {review.length}/5000
              </div>
            </div>

            {/* 标签 */}
            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex gap-2 flex-wrap">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer pointer-events-auto"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="输入标签..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                保存
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
