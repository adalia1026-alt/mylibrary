import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';
import { uploadFile } from '@/lib/upload';

// 上传封面图片
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '请选择文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '只支持 JPG、PNG、GIF、WEBP 格式的图片' },
        { status: 400 }
      );
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '图片大小不能超过 5MB' },
        { status: 400 }
      );
    }

    const coverUrl = await uploadFile(file);

    if (!coverUrl) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '上传封面失败' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ url: string }>>({
      success: true,
      data: { url: coverUrl },
    });
  } catch (error) {
    console.error('上传封面失败:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '上传封面失败' },
      { status: 500 }
    );
  }
}
