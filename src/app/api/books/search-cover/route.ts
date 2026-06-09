import { NextRequest, NextResponse } from 'next/server';
import { SearchClient, Config, HeaderUtils, APIError } from 'coze-coding-dev-sdk';
import { BookCover, ApiResponse } from '@/types';

// 搜索书籍封面和信息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, author } = body;

    if (!title) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '请输入书名' },
        { status: 400 }
      );
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new SearchClient(config, customHeaders);

    // 构建更精确的搜索查询
    const searchQuery = author 
      ? `《${title}》${author} 作者` 
      : `《${title}》作者`;

    // 并行搜索网页信息和图片
    const [webResponse, imageResponse] = await Promise.all([
      client.webSearch(searchQuery, 10, true),
      client.imageSearch(`${title} 书籍封面`, 10),
    ]);

    // 从网页搜索结果中提取作者信息
    let extractedAuthor = author || '';
    let extractedPublisher = '';
    
    if (webResponse.web_items) {
      for (const item of webResponse.web_items) {
        const snippet = item.snippet || '';
        const itemTitle = item.title || '';
        
        // 跳过购物网站
        const title_lower = itemTitle.toLowerCase();
        if (title_lower.includes('京东') || title_lower.includes('淘宝') || 
            title_lower.includes('天猫') || title_lower.includes('购买') ||
            title_lower.includes('价格') || title_lower.includes('报价') ||
            title_lower.includes('当当') || title_lower.includes('亚马逊')) {
          continue;
        }

        // 如果还没找到作者，尝试提取
        if (!extractedAuthor) {
          // 组合标题和摘要进行匹配
          const fullContent = itemTitle + ' ' + snippet;
          
          // 更精确的作者匹配模式
          const patterns = [
            // 《书名》是xxx创作的/xxx著
            /《[^》]+》(?:是|由)?([^\s,，。；;《》\[\]【】\n]{2,10})(?:创作|著|编写|撰写)/,
            // 《书名》，xxx著
            /《[^》]+》[，,]?\s*([^\s,，。；;《》\[\]【】\n]{2,10})著/,
            // xxx创作的《书名》
            /([^\s,，。；;《》\[\]【】\n]{2,10})创作(?:的)?《[^》]+》/,
            // 作者：xxx（在摘要中）
            /作者[是为][：:]?\s*([^\s,，。；;\n]{2,10})/,
          ];
          
          for (const pattern of patterns) {
            const match = fullContent.match(pattern);
            if (match && match[1]) {
              const potentialAuthor = match[1].trim();
              // 过滤掉不正确的匹配
              const invalidKeywords = ['出版社', '出版', '公司', '责任', '编辑', '翻译', '译', '责编'];
              const isValid = !invalidKeywords.some(kw => potentialAuthor.includes(kw));
              
              if (isValid && potentialAuthor.length >= 2 && potentialAuthor.length <= 10) {
                extractedAuthor = potentialAuthor;
                break;
              }
            }
          }
        }

        // 如果还没找到出版社，尝试提取
        if (!extractedPublisher) {
          const publisherMatch = snippet.match(/(?:出版社)[：:]?\s*([^\s,，。；;\n]{2,15})/);
          if (publisherMatch) {
            extractedPublisher = publisherMatch[1].trim();
          }
        }
      }

      // 从AI Summary中提取（通常更准确）
      if (webResponse.summary) {
        const summary = webResponse.summary;
        
        if (!extractedAuthor) {
          // 常见格式：《书名》是作家xxx创作的...
          const summaryMatch = summary.match(/《[^》]+》(?:是|由)?(?:作家|作者)?([^\s,，。；;\n]{2,10})(?:创作|著|编写|撰写)/);
          if (summaryMatch) {
            extractedAuthor = summaryMatch[1].trim();
          }
        }
      }
    }

    // 处理图片搜索结果
    const finalResults: BookCover[] = [];
    const seenCovers = new Set<string>();

    if (imageResponse.image_items) {
      for (const item of imageResponse.image_items) {
        if (item.image?.url && !seenCovers.has(item.image.url)) {
          seenCovers.add(item.image.url);
          
          // 清理标题
          let bookTitle = item.title || title;
          bookTitle = bookTitle
            .replace(/封面/gi, '')
            .replace(/书籍/gi, '')
            .replace(/book cover/gi, '')
            .replace(/《/g, '')
            .replace(/》/g, '')
            .trim() || title;

          finalResults.push({
            title: bookTitle,
            author: extractedAuthor,
            publisher: extractedPublisher,
            cover_url: item.image.url,
            isbn: '',
            source: item.url || '',
          });
        }
      }
    }

    // 如果没有图片结果，返回一个基本信息
    if (finalResults.length === 0) {
      finalResults.push({
        title,
        author: extractedAuthor,
        publisher: extractedPublisher,
        cover_url: '',
        isbn: '',
        source: '手动添加',
      });
    }

    return NextResponse.json<ApiResponse<BookCover[]>>({
      success: true,
      data: finalResults.slice(0, 10),
    });
  } catch (error) {
    console.error('搜索书籍失败:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: `搜索失败: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '搜索书籍失败' },
      { status: 500 }
    );
  }
}
