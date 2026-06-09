import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';
import EPub from 'epub2';
import { uploadBuffer } from '@/lib/upload';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    // const buffer = Buffer.from(arrayBuffer);
    // const epub = await EPub.fromBuffer(buffer);
    // const metadata = epub.metadata;

    if (!file) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '请上传 EPUB 文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.name.toLowerCase().endsWith('.epub')) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '仅支持 EPUB 格式文件' },
        { status: 400 }
      );
    }

    // 验证文件大小（最大 50MB）
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '文件大小不能超过 50MB' },
        { status: 400 }
      );
    }

    // 将文件保存到临时路径
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tmpPath = `/tmp/epub-${Date.now()}.epub`;
    const fs = await import('fs');
    fs.writeFileSync(tmpPath, buffer);

    // 解析 EPUB
    const epub = await EPub.createAsync(tmpPath);

    // 提取元数据
    const metadata = epub.metadata;
    const title = typeof metadata.title === 'string' ? metadata.title : '';
    const author = typeof metadata.creator === 'string' ? metadata.creator : '';
    const publisher = typeof metadata.publisher === 'string' ? metadata.publisher : '';
    const isbn = typeof metadata.ISBN === 'string' ? metadata.ISBN : '';
    // language 可能是 string / object / array
    let language = '';
    if (typeof metadata.language === 'string') {
      language = metadata.language;
    } else if (Array.isArray(metadata.language)) {
      language = metadata.language[0] || '';
    } else if (metadata.language && typeof metadata.language === 'object') {
      language = (metadata.language as any)._ || (metadata.language as any)['#text'] || String(metadata.language);
    }
    console.log('[EPUB 解析] language:', JSON.stringify(metadata.language), '→', language);

    // 提取封面
    // let coverUrl = '';
    // try {
    //   const coverId = metadata.cover;
    //   if (coverId) {
    //     const [coverBuffer, coverMediaType] = await epub.getFileAsync(coverId);
    //     console.log('[封面提取] coverId =', coverId);
    //     if (coverBuffer && coverMediaType) {
    //       const ext = coverMediaType.includes('png') ? 'png' : 
    //                   coverMediaType.includes('gif') ? 'gif' : 
    //                   coverMediaType.includes('webp') ? 'webp' : 'jpg';
    //       const fileName = `book-covers/epub-cover-${Date.now()}.${ext}`;
    //       const result = await uploadBuffer(coverBuffer, fileName, coverMediaType);
    //       if (result) {
    //         coverUrl = result;
    //       }
    //     }
    //   }
    // } catch (coverError) {
    //   console.error('提取封面失败:', coverError);
    // }
   let coverUrl = '';
try {
  // 使用 JSZip 加载原始 buffer
  const zip = await JSZip.loadAsync(buffer);
  const manifest = epub.manifest;
  let coverHref = null;
  let coverMediaType = null;

  // 方法1：从 metadata.cover 获取封面 id
  // epub2 的 metadata.cover 可能是对象 {id: "xxx"} 或字符串 "xxx"
  let coverId: string | null = null;
  const rawCover = (epub.metadata as any).cover;
  if (rawCover) {
    if (typeof rawCover === 'string') {
      coverId = rawCover;
    } else if (typeof rawCover === 'object' && rawCover.id) {
      coverId = rawCover.id;
    } else if (typeof rawCover === 'object' && rawCover['@_id']) {
      coverId = rawCover['@_id'];
    }
    console.log('[封面] rawCover:', JSON.stringify(rawCover), '→ coverId:', coverId);
  }
  if (coverId && manifest[coverId]) {
    coverHref = manifest[coverId].href;
    coverMediaType = manifest[coverId].mediaType;
    console.log(`方法1 命中: coverId=${coverId}, href=${coverHref}`);
  }

  // 方法2：查找 properties 包含 'cover-image' 的条目
  if (!coverHref) {
    for (const id in manifest) {
      const item = manifest[id];
      if (item.properties && item.properties.includes('cover-image')) {
        coverHref = item.href;
        coverMediaType = item.mediaType;
        console.log(`方法2 命中: id=${id}, href=${coverHref}`);
        break;
      }
    }
  }

  // 方法3：查找 id 为 'cover' 或 'Cover' 的条目
  if (!coverHref) {
    const lowerIdMatch = Object.keys(manifest).find(id => id.toLowerCase() === 'cover');
    if (lowerIdMatch) {
      coverHref = manifest[lowerIdMatch].href;
      coverMediaType = manifest[lowerIdMatch].mediaType;
      console.log(`方法3 命中: id=${lowerIdMatch}, href=${coverHref}`);
    }
  }

  // 方法4：遍历所有图片，选择最可能是封面的
  if (!coverHref) {
    // 获取所有图片条目，明确类型
    const imageItems: Array<{ href: string; mediaType: string }> = [];
    for (const id in manifest) {
      const item = manifest[id];
      if (item.mediaType && item.mediaType.startsWith('image/')) {
        imageItems.push({ href: item.href, mediaType: item.mediaType });
      }
    }
    console.log('所有图片条目:', imageItems);

    let bestMatch = imageItems.find(item => {
      const href = (item.href || '').toLowerCase();
      return href.includes('cover') || href.includes('front');
    });
    if (!bestMatch && imageItems.length > 0) {
      bestMatch = imageItems[0];
      console.log('未找到明确封面，使用第一张图片');
    }
    if (bestMatch) {
      coverHref = bestMatch.href;
      coverMediaType = bestMatch.mediaType;
      console.log(`方法4 命中: href=${coverHref}`);
    }
  }

  if (coverHref) {
    // 从 ZIP 中直接读取文件
    const zipFile = zip.file(coverHref);
    if (zipFile) {
      const coverBuffer = Buffer.from(await zipFile.async('nodebuffer'));
      if (coverBuffer && coverBuffer.length > 0) {
        // 根据 buffer 头判断实际扩展名
        let ext = coverHref.split('.').pop()?.toLowerCase() || 'jpg';
        if (coverBuffer[0] === 0x89 && coverBuffer[1] === 0x50 && coverBuffer[2] === 0x4E) ext = 'png';
        else if (coverBuffer[0] === 0xFF && coverBuffer[1] === 0xD8) ext = 'jpg';
        else if (coverBuffer[0] === 0x47 && coverBuffer[1] === 0x49 && coverBuffer[2] === 0x46) ext = 'gif';
        else if (coverBuffer[0] === 0x52 && coverBuffer[1] === 0x49 && coverBuffer[2] === 0x46 && coverBuffer[3] === 0x46) ext = 'webp';
        
        const fileName = `book-covers/epub-cover-${Date.now()}.${ext}`;
        const mimeType = coverMediaType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        // 同时保存到磁盘（用于数据恢复/备份）+ 生成 data URL（绕过服务端 308 问题）
        const uploadResult = await uploadBuffer(coverBuffer, fileName, mimeType);
        // 优先使用 data URL：直接嵌入图片数据，不依赖 HTTP 服务端
        const dataUrl = `data:${mimeType};base64,${coverBuffer.toString('base64')}`;
        coverUrl = dataUrl;
        console.log('封面上传成功:', uploadResult, 'dataURL 长度:', dataUrl.length);
      } else {
        console.error('封面文件为空');
      }
    } else {
      console.error(`ZIP 中找不到文件: ${coverHref}`);
    }
  } else {
    console.warn('未找到任何可能的封面图片');
  }
} catch (err) {
  console.error('提取封面失败:', err);
}
    



    // 尝试从语言推断国别
    let nationality = '';
    const langCountryMap: Record<string, string> = {
      'zh': 'CN', 'zh-cn': 'CN', 'zh-tw': 'TW', 'zh-hk': 'HK',
      'en': 'GB', 'en-us': 'US', 'en-gb': 'GB',
      'ja': 'JP', 'ko': 'KR', 'fr': 'FR', 'de': 'DE',
      'es': 'ES', 'it': 'IT', 'ru': 'RU', 'pt': 'PT',
      'ar': 'SA', 'hi': 'IN', 'th': 'TH', 'vi': 'VN',
    };
    if (language) {
      const langPrefix = language.toLowerCase().split('-')[0];
      nationality = langCountryMap[language.toLowerCase()] || langCountryMap[langPrefix] || '';
    }

    // 清理临时文件
    try {
      fs.unlinkSync(tmpPath);
    } catch (_e) {
      // 忽略清理失败
    }

    return NextResponse.json<ApiResponse<{
      title: string;
      author: string;
      nationality: string;
      publisher: string;
      isbn: string;
      cover_url: string;
    }>>({
      success: true,
      data: {
        title,
        author,
        nationality,
        publisher,
        isbn,
        cover_url: coverUrl,
      },
    });
  } catch (error) {
    console.error('解析 EPUB 失败:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'EPUB 解析失败，请确认文件格式正确' },
      { status: 500 }
    );
  }
}
