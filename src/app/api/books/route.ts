import { NextRequest, NextResponse } from 'next/server';
import { bookDb, tagDb, generateId } from '@/lib/db';
import { Book, CreateBookRequest, ApiResponse } from '@/types';

// 获取所有书籍
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const year = searchParams.get('year') || undefined;
    const tag = searchParams.get('tag') || undefined;

    const books = await bookDb.query({ status, year, tag });

    return NextResponse.json<ApiResponse<Book[]>>({
      success: true,
      data: books,
    });
  } catch (error) {
    console.error('获取书籍失败:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '获取书籍失败' },
      { status: 500 }
    );
  }
}

// 创建书籍
export async function POST(request: NextRequest) {
  try {
    const body: CreateBookRequest = await request.json();
    const { title, author, nationality, cover_url, publisher, isbn, start_date, status, tags } = body;

    if (!title || !title.trim()) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '书名不能为空' },
        { status: 400 }
      );
    }

    if (!author || !author.trim()) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '作者不能为空' },
        { status: 400 }
      );
    }

    if (!cover_url || !cover_url.trim()) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '封面不能为空' },
        { status: 400 }
      );
    }

    // 检查重复（书名+作者）
    const allBooks = await bookDb.getAll();
    const normalizedName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');
    const isDuplicate = allBooks.some((b: Book) =>
      normalizedName(b.title) === normalizedName(title) &&
      normalizedName(b.author) === normalizedName(author)
    );
    if (isDuplicate) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: `《${title}》（作者：${author}）已存在，不可重复添加` },
        { status: 409 }
      );
    }

    // 处理标签：确保标签在数据库中存在
    const bookTags: any[] = [];
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const tag = await tagDb.createIfNotExists(tagName);
        bookTags.push(tag);
      }
    }

    const now = new Date().toISOString();
    const newBook = {
      id: generateId(),
      title,
      author: author || '',
      nationality: nationality || '',
      cover_url: cover_url || '',
      publisher: publisher || '',
      isbn: isbn || '',
      start_date: start_date || null,
      end_date: null,
      rating: null,
      review: null,
      status: status || 'want_to_read',
      created_at: now,
      updated_at: now,
      tags: bookTags,
    };

    const created = await bookDb.create(newBook);

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: created,
    });
  } catch (error) {
    console.error('创建书籍失败:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '创建书籍失败' },
      { status: 500 }
    );
  }
}
