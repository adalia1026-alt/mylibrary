import { NextRequest, NextResponse } from 'next/server';
import { bookDb, tagDb } from '@/lib/db';
import { Book, UpdateBookRequest, ApiResponse } from '@/types';

// 获取单个书籍
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = await bookDb.getById(id);

    if (!book) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '书籍不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Book>>({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error('获取书籍失败:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '获取书籍失败' },
      { status: 500 }
    );
  }
}

// 更新书籍
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateBookRequest = await request.json();

    const existing = await bookDb.getById(id);
    if (!existing) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '书籍不存在' },
        { status: 404 }
      );
    }

    // 处理标签：标签名数组 -> Tag 对象数组
    let bookTags = existing.tags;
    if (body.tags) {
      bookTags = [];
      for (const tagName of body.tags) {
        const tag = await tagDb.createIfNotExists(tagName);
        bookTags.push(tag);
      }
    }

    const updates: any = {
      ...body,
      tags: bookTags,
    };

    const updated = await bookDb.update(id, updates);

    return NextResponse.json<ApiResponse<Book>>({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('更新书籍失败:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '更新书籍失败' },
      { status: 500 }
    );
  }
}

// 删除书籍
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await bookDb.delete(id);

    if (!deleted) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '书籍不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<never>>({
      success: true,
    });
  } catch (error) {
    console.error('删除书籍失败:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '删除书籍失败' },
      { status: 500 }
    );
  }
}
