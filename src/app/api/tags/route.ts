import { NextRequest, NextResponse } from 'next/server';
import { tagDb } from '@/lib/db';
import { Tag, ApiResponse } from '@/types';

// 获取所有标签
export async function GET() {
  try {
    const tags = await tagDb.getAll();

    return NextResponse.json<ApiResponse<Tag[]>>({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '获取标签失败' },
      { status: 500 }
    );
  }
}

// 创建标签
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '标签名不能为空' },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = await tagDb.getByName(name);
    if (existing) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '标签已存在' },
        { status: 400 }
      );
    }

    const newTag = await tagDb.create({ name, color });

    return NextResponse.json<ApiResponse<Tag>>({
      success: true,
      data: newTag,
    });
  } catch (error) {
    console.error('创建标签失败:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '创建标签失败' },
      { status: 500 }
    );
  }
}
