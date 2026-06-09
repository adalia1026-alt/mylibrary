// import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化存储
// const storage = new S3Storage({
//   endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
//   accessKey: '',
//   secretKey: '',
//   bucketName: process.env.COZE_BUCKET_NAME,
//   region: 'cn-beijing',
// });

// /**
//  * 上传 Buffer 到对象存储，返回签名 URL
//  */
// export async function uploadBuffer(
//   buffer: Buffer,
//   fileName: string,
//   contentType: string,
// ): Promise<string | null> {
//   try {
//     const key = await storage.uploadFile({
//       fileContent: buffer,
//       fileName,
//       contentType,
//     });

//     const url = await storage.generatePresignedUrl({
//       key,
//       expireTime: 30 * 24 * 60 * 60, // 30 天
//     });

//     return url;
//   } catch (error) {
//     console.error('上传文件失败:', error);
//     return null;
//   }
// }

// /**
//  * 上传 File 对象到对象存储，返回签名 URL
//  */
// export async function uploadFile(file: File): Promise<string | null> {
//   const arrayBuffer = await file.arrayBuffer();
//   const buffer = Buffer.from(arrayBuffer);

//   const timestamp = Date.now();
//   const ext = file.name.split('.').pop() || 'jpg';
//   const fileName = `book-covers/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

//   return uploadBuffer(buffer, fileName, file.type);
// }
import fs from 'fs/promises';
import path from 'path';

/**
 * 将 Buffer 保存到本地 public/uploads 目录，返回可访问的 URL 路径
 */
export async function uploadBuffer(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string | null> {
  try {
    // 生产模式使用 UPLOADS_DIR 环境变量（持久化目录），开发模式使用 project/public/uploads/
    const uploadDir = process.env.UPLOADS_DIR
      || path.join(process.cwd(), 'public', 'uploads');
    // 确保目录存在
    await fs.mkdir(uploadDir, { recursive: true });

    // 生成唯一文件名（时间戳 + 原文件名，去除特殊字符）
    const timestamp = Date.now();
    const safeName = `${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeName);

    // 写入文件
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/api/books/cover/${safeName}`;
    console.log('文件已保存:', filePath, 'URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('本地保存文件失败:', error);
    return null;
  }
}

export async function uploadFile(file: File): Promise<string | null> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `book-covers/${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}.${ext}`;

  return uploadBuffer(buffer, fileName, file.type);
}