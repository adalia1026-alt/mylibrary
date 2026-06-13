'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import { YearlyStats, Book } from '@/types';
import { getCoverUrl } from '@/lib/cover-url';
import { Star } from 'lucide-react';

// 月份颜色映射（12个月）
const MONTH_COLORS = [
  '#4FC3F7', // 1月 冰蓝
  '#81C784', // 2月 嫩绿
  '#AED581', // 3月 春绿
  '#FFD54F', // 4月 暖黄
  '#FF8A65', // 5月 珊瑚
  '#FF7043', // 6月 红橙
  '#CE93D8', // 7月 淡紫
  '#64B5F6', // 8月 天蓝
  '#4DD0E1', // 9月 青
  '#FFAB40', // 10月 金橙
  '#EF5350', // 11月 深红
  '#7986CB', // 12月 靛蓝
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
          padding: '60px 50px 50px',
          background: 'linear-gradient(165deg, #1a1a2e 0%, #16213e 30%, #0f2027 60%, #1a1a2e 100%)',
          color: '#e0e0e0',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 背景装饰 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(168, 85, 247, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* 装饰星星点阵 */}
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={`star-${i}`}
            style={{
              position: 'absolute',
              left: `${(i * 53 + 17) % 95}%`,
              top: `${(i * 37 + 11) % 90}%`,
              width: `${i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1}px`,
              height: `${i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1}px`,
              borderRadius: '50%',
              backgroundColor: i % 4 === 0 ? 'rgba(255,255,255,0.6)' :
                              i % 4 === 1 ? 'rgba(168,216,255,0.5)' :
                              'rgba(255,215,0,0.4)',
              opacity: 0.3 + (i % 5) * 0.12,
            }}
          />
        ))}

        {/* 标题区域 */}
        <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative', zIndex: 1 }}>
          {/* 年份装饰 */}
          <div style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '8px',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Reading Summary
          </div>
          <h1 style={{
            fontSize: '42px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 40%, #818cf8 70%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 8px',
            letterSpacing: '4px',
          }}>
            {year} 年度阅读总结
          </h1>
          <div style={{
            width: '80px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
            margin: '0 auto 12px',
          }} />
          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '2px',
          }}>
            共计阅读 <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{allCompletedBooks.length}</span> 本书
            {ratedCount > 0 && (
              <> · 平均评分 <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                {(totalRating / ratedCount).toFixed(1)}
              </span> / 5.0</>
            )}
          </p>
        </div>

        {/* 书籍按月展示 */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {monthlyBooks.map((month) => {
            const monthNum = parseInt(month.month.toString());
            const color = MONTH_COLORS[(monthNum - 1) % 12];

            return (
              <div key={month.month} style={{ marginBottom: '28px' }}>
                {/* 月份标题 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                }}>
                  <span style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#111',
                    flexShrink: 0,
                  }}>
                    {monthNum}
                  </span>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: color,
                    letterSpacing: '1px',
                  }}>
                    {monthNum}月
                  </span>
                  <span style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.35)',
                  }}>
                    · {month.books.length} 本
                  </span>
                  <div style={{
                    flex: 1,
                    height: '1px',
                    background: `linear-gradient(90deg, ${color}33, transparent)`,
                  }} />
                </div>

                {/* 书籍封面网格 */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '18px',
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
              color: 'rgba(255,255,255,0.3)',
              fontSize: '18px',
            }}>
              {year}年还没有读完的书
            </div>
          )}
        </div>

        {/* 底部 */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.2)',
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
      width: '130px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 封面 */}
      <div style={{
        width: '130px',
        height: '180px',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        marginBottom: '8px',
        position: 'relative',
      }}>
        {/* 封面图片 */}
        <BookCoverImage book={book} />
        {/* 评分角标 */}
        {book.rating && (
          <div style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            background: 'rgba(0,0,0,0.75)',
            borderRadius: '4px',
            padding: '2px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            color: '#fbbf24',
            fontSize: '11px',
            fontWeight: 600,
          }}>
            <span style={{ fontSize: '10px' }}>★</span>
            {book.rating}
          </div>
        )}
      </div>
      {/* 书名 */}
      <div style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: '1.3',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
      }}>
        {book.title}
      </div>
      {/* 作者 */}
      {book.author && (
        <div style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
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
          color: 'rgba(255,255,255,0.25)',
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
function BookCoverImage({ book }: { book: Book }) {
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
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.1))',
      }}>
        <span style={{ fontSize: '24px', opacity: 0.3 }}>📖</span>
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
