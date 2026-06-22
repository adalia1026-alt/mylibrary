'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import { YearlyStats, Book } from '@/types';
import { getCoverUrl } from '@/lib/cover-url';

// 月份颜色映射（12个月）— 浅色主题下使用饱和度适中的色彩
const MONTH_COLORS = [
  '#4A90D9', // 1月 蔚蓝
  '#5BAD6F', // 2月 草绿
  '#7CB87A', // 3月 嫩绿
  '#E8A838', // 4月 琥珀
  '#E07A5F', // 5月 珊瑚红
  '#D95F3B', // 6月 橙红
  '#9B7FC7', // 7月 薰衣草紫
  '#5B9BD5', // 8月 天蓝
  '#3BAEC0', // 9月 青碧
  '#E09A30', // 10月 金橙
  '#D15454', // 11月 玫红
  '#6A7BC8', // 12月 靛蓝
];

interface YearlyExportImageProps {
  stats: YearlyStats;
  year: string;
}

export interface YearlyExportHandle {
  getElement: () => HTMLDivElement | null;
}

export const YearlyExportImage = forwardRef<YearlyExportHandle, YearlyExportImageProps>(
  function YearlyExportImage({ stats, year }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getElement: () => containerRef.current,
    }));

    // 按月分组
    const monthlyBooks = stats.monthly_stats?.filter(m => m.books.length > 0) || [];
    const allCompletedBooks = stats.books || [];
    const totalRating = allCompletedBooks.reduce(
      (sum, b) => sum + (b.rating || 0), 0
    );
    const ratedCount = allCompletedBooks.filter(b => b.rating).length;

    return (
      <div
        ref={containerRef}
        className="yearly-export-container"
        style={{
          width: '1200px',
          padding: '60px 56px 56px',
          // 浅色背景：米白 → 浅灰的细腻渐变，干净不抢眼
          background: 'linear-gradient(160deg, #FAFBFF 0%, #F3F5FB 40%, #EEF1F9 70%, #F5F3FF 100%)',
          color: '#1a1a2e',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 背景装饰光晕 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse 70% 45% at 15% 10%, rgba(99,102,241,0.07) 0%, transparent 65%), radial-gradient(ellipse 55% 40% at 85% 90%, rgba(168,85,247,0.05) 0%, transparent 65%), radial-gradient(ellipse 50% 35% at 75% 5%, rgba(59,130,246,0.04) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* 顶部淡色横纹装饰 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 80%, #6366f1 100%)',
          opacity: 0.6,
        }} />

        {/* 标题区域 */}
        <div style={{ textAlign: 'center', marginBottom: '36px', position: 'relative', zIndex: 1 }}>
          {/* 顶部标签 */}
          <div style={{
            display: 'inline-block',
            fontSize: '11px',
            color: '#6366f1',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            marginBottom: '12px',
            fontWeight: 600,
            background: 'rgba(99,102,241,0.08)',
            padding: '4px 16px',
            borderRadius: '20px',
            border: '1px solid rgba(99,102,241,0.15)',
          }}>
            Reading Summary
          </div>
          <h1 style={{
            fontSize: '44px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #3730a3 0%, #6366f1 45%, #8b5cf6 75%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 10px',
            letterSpacing: '3px',
            lineHeight: 1.15,
          }}>
            {year} 年度阅读总结
          </h1>
          <div style={{
            width: '60px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)',
            margin: '0 auto 14px',
          }} />
          <p style={{
            fontSize: '15px',
            color: '#64748b',
            letterSpacing: '1.5px',
          }}>
            共计阅读{' '}
            <span style={{ color: '#6366f1', fontWeight: 700 }}>{allCompletedBooks.length}</span>
            {' '}本书
            {ratedCount > 0 && (
              <> · 平均评分{' '}
                <span style={{ color: '#d97706', fontWeight: 700 }}>
                  {(totalRating / ratedCount).toFixed(1)}
                </span>{' '}/ 5.0
              </>
            )}
          </p>
        </div>

        {/* 书籍按月展示 */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {monthlyBooks.map((month) => {
            const monthNum = parseInt(month.month.toString());
            const color = MONTH_COLORS[(monthNum - 1) % 12];

            return (
              <div key={month.month} style={{ marginBottom: '32px' }}>
                {/* 月份标题 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '16px',
                }}>
                  <span style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: `0 3px 10px ${color}40`,
                  }}>
                    {monthNum}
                  </span>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: color,
                    letterSpacing: '1px',
                  }}>
                    {monthNum}月
                  </span>
                  <span style={{
                    fontSize: '13px',
                    color: '#94a3b8',
                  }}>
                    · {month.books.length} 本
                  </span>
                  <div style={{
                    flex: 1,
                    height: '1px',
                    background: `linear-gradient(90deg, ${color}30, transparent)`,
                  }} />
                </div>

                {/* 书籍封面网格 */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  paddingLeft: '6px',
                }}>
                  {month.books.map((book) => (
                    <BookExportCard key={book.id} book={book} accentColor={color} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* 如果没有已读书籍 */}
          {monthlyBooks.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#94a3b8',
              fontSize: '18px',
            }}>
              {year}年还没有读完的书
            </div>
          )}
        </div>

        {/* 底部 */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          color: '#c4c9d4',
          fontSize: '12px',
          letterSpacing: '2px',
          position: 'relative',
          zIndex: 1,
        }}>
          Generated by MyLibrary · {new Date().toLocaleDateString('zh-CN')}
        </div>
      </div>
    );
  }
);

// 单本书籍卡片（导出用）
function BookExportCard({ book, accentColor }: { book: Book; accentColor: string }) {
  return (
    <div style={{
      width: '120px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 封面 */}
      <div style={{
        width: '120px',
        height: '168px',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#f1f5f9',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)',
        marginBottom: '8px',
        position: 'relative',
      }}>
        {/* 封面图片 */}
        <BookCoverImage book={book} accentColor={accentColor} />
        {/* 评分角标 */}
        {book.rating && (
          <div style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: 'rgba(0,0,0,0.65)',
            borderRadius: '4px',
            padding: '2px 5px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            color: '#fbbf24',
            fontSize: '10px',
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
          }}>
            <span style={{ fontSize: '9px' }}>★</span>
            {book.rating}
          </div>
        )}
      </div>
      {/* 书名 — 最多显示2行，小字体 */}
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#1e293b',
        lineHeight: '1.4',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
        minHeight: '30px', // 保证2行高度空间
      }}>
        {book.title}
      </div>
      {/* 作者 — 单行，10px */}
      {book.author && (
        <div style={{
          fontSize: '10px',
          color: '#94a3b8',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' as const,
          marginTop: '2px',
        }}>
          {book.author}
        </div>
      )}
      {/* 完成日期 */}
      {book.end_date && (
        <div style={{
          fontSize: '10px',
          color: '#c4c9d4',
          marginTop: '2px',
        }}>
          {new Date(book.end_date).toLocaleDateString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
          })}
        </div>
      )}
    </div>
  );
}

// 封面图片组件（处理 data: 和 /uploads/ URL）
function BookCoverImage({ book, accentColor }: { book: Book; accentColor?: string }) {
  const coverUrl = book.cover_url;
  const imageSrc = coverUrl ? getCoverUrl(coverUrl) : null;

  if (!imageSrc) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${accentColor || '#6366f1'}18, ${accentColor || '#8b5cf6'}0d)`,
      }}>
        <span style={{ fontSize: '28px', opacity: 0.35 }}>📖</span>
      </div>
    );
  }

  // data: URL 直接使用；相对路径用 img（html2canvas 依赖浏览器渲染）
  return (
    <img
      src={imageSrc}
      alt={book.title}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
}
