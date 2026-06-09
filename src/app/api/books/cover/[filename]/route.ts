import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

function getMimeType(filename: string): string {
  const ext = '.' + filename.split('.').pop()?.toLowerCase()
  return MIME_MAP[ext] || 'image/jpeg'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Security: prevent path traversal
  const safeName = filename.replace(/\.\./g, '').replace(/[\/\\]/g, '')
  // 生产模式使用 UPLOADS_DIR 环境变量，开发模式使用 project/public/uploads/
  const uploadsDir = process.env.UPLOADS_DIR
    || join(process.cwd(), 'public', 'uploads')
  const filePath = join(uploadsDir, safeName)

  if (!existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const buffer = readFileSync(filePath)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': getMimeType(safeName),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
