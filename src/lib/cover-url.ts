/**
 * 封面 URL 规范化
 *
 * Next.js standalone 模式在 Tauri WKWebView 中偶发无法伺服 public/ 静态文件。
 * 通过 API 路由 /api/books/cover/ 中转图片数据，确保所有封面都能正常显示。
 *
 * 转换规则：
 *   /uploads/xxx.jpg → /api/books/cover/xxx.jpg
 *   /api/books/cover/xxx.jpg → 保持不变
 *   https://covers.openlibrary.org/... → 保持不变（外部链接，不走 API）
 *   /placeholder.svg → 保持不变
 */
export function getCoverUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder.svg'
  // data: URL 直接返回（base64 编码图片，不依赖 HTTP 服务端）
  if (url.startsWith('data:')) return url
  if (url.startsWith('http')) return url
  if (url.startsWith('/api/books/cover/')) return url
  if (url.startsWith('/uploads/')) {
    const filename = url.split('/').pop() || ''
    return `/api/books/cover/${filename}`
  }
  return url
}
