'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCoverUrl } from '@/lib/cover-url';
import { 
  BookOpen, 
  MoreVertical, 
  Star, 
  Calendar, 
  Trash2, 
  Edit,
  Clock
} from 'lucide-react';
import { Book } from '@/types';
import { getCountryByCode } from '@/lib/countries';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BookCardProps {
  book: Book;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

export function BookCard({ book, onEdit, onDelete, onClick }: BookCardProps) {
  const [imageError, setImageError] = useState(false);

  // 状态配置
  const statusConfig = {
    want_to_read: { label: '想读', color: 'secondary' },
    reading: { label: '在读', color: 'default' },
    completed: { label: '读完', color: 'success' },
  };

  const status = statusConfig[book.status] || statusConfig.want_to_read;

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-4 p-4">
        {/* 封面 */}
        <div className="bg-muted rounded overflow-hidden flex-shrink-0 relative" style={{ height: '120px', width: '85px' }}>
          {book.cover_url && !imageError ? (
            <img
              src={getCoverUrl(book.cover_url)}
              alt={book.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <BookOpen className="h-8 w-8 text-primary/40" />
            </div>
          )}
          <Badge 
            variant={status.color as 'secondary' | 'default'}
            className="absolute top-1 left-1 text-[10px] px-1.5"
          >
            {status.label}
          </Badge>
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-1">{book.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {book.author && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {book.author}
              {book.nationality && (() => {
                const country = getCountryByCode(book.nationality);
                return country ? ` (${country.flag})` : '';
              })()}
            </p>
          )}

          {/* 时间信息 */}
          <div className="mt-2 space-y-1">
            {book.start_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>开始: {format(new Date(book.start_date), 'yyyy-MM-dd')}</span>
              </div>
            )}
            {book.end_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>完成: {format(new Date(book.end_date), 'yyyy-MM-dd')}</span>
              </div>
            )}
          </div>

          {/* 评分 */}
          {book.rating && (
            <div className="flex items-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < book.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          )}

          {/* 标签 */}
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {book.tags.slice(0, 3).map((tag, index) => {
                const tagName = typeof tag === 'string' ? tag : tag.name;
                const tagColor = typeof tag === 'string' ? '#6366F1' : tag.color;
                const tagId = typeof tag === 'string' ? `tag-${index}` : tag.id;
                return (
                  <Badge
                    key={tagId}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                    style={{ borderColor: tagColor, color: tagColor }}
                  >
                    {tagName}
                  </Badge>
                );
              })}
              {book.tags.length > 3 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  +{book.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
