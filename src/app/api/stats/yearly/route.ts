import { NextRequest, NextResponse } from 'next/server';
import { bookDb } from '@/lib/db';
import { Book, YearlyStats, MonthlyStats, ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    const books = await bookDb.getAll();
    const yearNum = parseInt(year);

    // 筛选该年度已读完的书籍
    const completedBooks = books.filter((b: Book) => {
      if (!b.end_date || b.status !== 'completed') return false;
      return new Date(b.end_date).getFullYear() === yearNum;
    });

    // 正在阅读的书籍
    const readingBooks = books.filter((b: Book) => b.status === 'reading');

    // 计算平均评分
    const ratedBooks = completedBooks.filter((b: Book) => b.rating);
    const avgRating = ratedBooks.length > 0
      ? ratedBooks.reduce((sum: number, b: Book) => sum + (b.rating || 0), 0) / ratedBooks.length
      : 0;

    // 月度统计
    const monthlyStats: MonthlyStats[] = [];
    for (let month = 0; month < 12; month++) {
      const monthBooks = completedBooks.filter((b: Book) => {
        const endDate = new Date(b.end_date!);
        return endDate.getMonth() === month;
      });
      monthlyStats.push({
        month: month + 1,
        count: monthBooks.length,
        books: monthBooks,
      });
    }

    const stats: YearlyStats = {
      year: yearNum,
      total_books: books.length,
      completed_books: completedBooks.length,
      reading_books: readingBooks.length,
      avg_rating: Math.round(avgRating * 10) / 10,
      books: completedBooks,
      monthly_stats: monthlyStats,
    };

    return NextResponse.json<ApiResponse<YearlyStats>>({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('获取年度统计失败:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '获取年度统计失败' },
      { status: 500 }
    );
  }
}
