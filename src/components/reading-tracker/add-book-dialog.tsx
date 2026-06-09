'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCoverUrl } from '@/lib/cover-url';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarIcon, 
  Search, 
  Loader2, 
  Plus, 
  X,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Clipboard,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BookCover } from '@/types';
import { CountrySelect } from './country-select';
import { openFileDialog } from '@/lib/tauri-file-dialog';

interface AddBookDialogProps {
  trigger?: React.ReactNode;
  onBookAdded?: () => void;
}

export function AddBookDialog({ trigger, onBookAdded }: AddBookDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const epubInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'search' | 'details'>('search');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<BookCover[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsingEpub, setParsingEpub] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [addSource, setAddSource] = useState<'search' | 'epub'>('search');
  
  // 书籍信息
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [nationality, setNationality] = useState(''); // 作者国别代码
  const [nationalityName, setNationalityName] = useState(''); // 作者国别名称
  const [selectedCover, setSelectedCover] = useState<BookCover | null>(null);
  const [coverSource, setCoverSource] = useState<'url' | 'upload' | 'paste'>('url');
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [status, setStatus] = useState<'reading' | 'completed' | 'want_to_read'>('want_to_read');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  // 获取当前使用的封面URL
  const currentCoverUrl = (coverSource === 'upload' || coverSource === 'paste') ? uploadedCoverUrl : customCoverUrl || selectedCover?.cover_url || '';

  // 搜索书籍封面和信息
  const handleSearch = async () => {
    if (!title.trim()) return;
    
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    
    try {
      const response = await fetch('/api/books/search-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author }),
      });
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data);
        if (data.data.length === 0) {
          setSearchError('未找到相关书籍，请手动填写作者和封面');
        }
      } else {
        setSearchError(data.error || '搜索失败，请手动填写信息');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchError('搜索失败，请手动填写信息');
    } finally {
      setSearching(false);
    }
  };

  // 选择搜索结果
  const handleSelectCover = (cover: BookCover) => {
    const finalAuthor = cover.author?.trim() || author.trim();
    setSelectedCover({
      ...cover,
      author: finalAuthor,
    });
    setCustomCoverUrl(cover.cover_url);
    setCoverSource('url');
    setStep('details');
  };

  // 上传文件到服务器（接受 File 或 FileDialogResult）
  const uploadFile = async (file: File | { name: string; data: Uint8Array; mimeType: string }) => {
    setUploading(true);
    try {
      const formData = new FormData();
      if (file instanceof File) {
        formData.append('file', file);
      } else {
        const blob = new Blob([file.data as BlobPart], { type: file.mimeType });
        formData.append('file', blob, file.name);
      }

      const response = await fetch('/api/upload/cover', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setUploadedCoverUrl(data.data.url);
        setCoverSource('upload');
      } else {
        alert(data.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 上传本地图片（HTML input 回退）
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 封面文件选择（使用 Tauri dialog 或 HTML input 回退）
  const handleCoverDialogClick = async () => {
    const result = await openFileDialog('.jpeg,.jpg,.png,.gif,.webp');
    if (result) {
      await uploadFile(result);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 粘贴图片
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadFile(file);
        }
        break;
      }
    }
  };

  // 通过按钮点击粘贴图片
  const handlePasteFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
        if (imageTypes.length > 0) {
          const blob = await clipboardItem.getType(imageTypes[0]);
          const file = new File([blob], 'pasted-image.png', { type: blob.type });
          await uploadFile(file);
          break;
        }
      }
    } catch (error) {
      console.error('粘贴失败:', error);
      alert('无法读取剪贴板中的图片，请尝试使用 Ctrl+V 粘贴');
    }
  };

  // 手动继续（使用自定义信息）
  const handleManualContinue = () => {
    const coverUrl = coverSource === 'upload' ? uploadedCoverUrl : customCoverUrl;
    setSelectedCover({
      title: title.trim(),
      author: author.trim(),
      publisher: '',
      cover_url: coverUrl,
      isbn: '',
      source: '手动添加',
    });
    setStep('details');
  };

  // 处理 EPUB 文件（通用，接受 File 或 FileDialogResult）
  const processEpubFile = async (file: File | { name: string; data: Uint8Array; mimeType: string }) => {
    setParsingEpub(true);
    setSearchError(null);
    setDuplicateError(null);

    try {
      const formData = new FormData();
      if (file instanceof File) {
        formData.append('file', file);
      } else {
        const blob = new Blob([file.data as BlobPart], { type: file.mimeType });
        formData.append('file', blob, file.name);
      }

      const response = await fetch('/api/books/parse-epub', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data) {
        const { title: epubTitle, author: epubAuthor, nationality: epubNationality, publisher: epubPublisher, isbn: epubIsbn, cover_url: epubCoverUrl } = data.data;

        setTitle(epubTitle || '');
        setAuthor(epubAuthor || '');
        setNationality(epubNationality || '');
        if (epubCoverUrl) {
          setCustomCoverUrl(epubCoverUrl);
          setCoverSource('url');
        }

        setSelectedCover({
          title: epubTitle || '',
          author: epubAuthor || '',
          publisher: epubPublisher || '',
          cover_url: epubCoverUrl || '',
          isbn: epubIsbn || '',
          source: 'EPUB导入',
        });

        setStep('details');
      } else {
        setSearchError(data.error || 'EPUB 解析失败');
      }
    } catch (error) {
      console.error('EPUB 解析失败:', error);
      setSearchError('EPUB 解析失败，请确认文件格式正确');
    } finally {
      setParsingEpub(false);
    }
  };

  // EPUB 文件选择（直接点击隐藏的 input，绕开 Tauri dialog IPC 兼容性问题）
  const handleEpubDialogClick = async () => {
    if (epubInputRef.current) {
      // 清空旧值，确保重复选择同一文件也能触发 onChange
      epubInputRef.current.value = '';
      epubInputRef.current.click();
    }
  };

  // 处理 EPUB 上传（HTML input 回退）
  const handleEpubUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (epubInputRef.current) {
      epubInputRef.current.value = '';
    }
    await processEpubFile(file);
  };

  // 检查书籍是否重复（书名+作者相同）
  const checkDuplicate = async (bookTitle: string, bookAuthor: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/books');
      const data = await response.json();
      if (data.success && data.data) {
        const normalizedName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');
        const existingBook = data.data.find(
          (book: { title: string; author: string }) =>
            normalizedName(book.title) === normalizedName(bookTitle) &&
            normalizedName(book.author) === normalizedName(bookAuthor)
        );
        return !!existingBook;
      }
    } catch (error) {
      console.error('检查重复失败:', error);
    }
    return false;
  };

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // 移除标签
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // 保存书籍
  const handleSave = async () => {
    const bookTitle = selectedCover?.title || title;
    const bookAuthor = selectedCover?.author || author;
    const bookCover = coverSource === 'upload' ? uploadedCoverUrl : (customCoverUrl || selectedCover?.cover_url || '');
    
    if (!bookTitle.trim() || !bookAuthor.trim() || !bookCover.trim()) {
      return;
    }

    // 检查重复
    setDuplicateError(null);
    const isDuplicate = await checkDuplicate(bookTitle, bookAuthor);
    if (isDuplicate) {
      setDuplicateError(`《${bookTitle}》（作者：${bookAuthor}）已存在，不可重复添加`);
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bookTitle,
          author: bookAuthor,
          nationality: nationality,
          cover_url: bookCover,
          publisher: selectedCover?.publisher || '',
          isbn: selectedCover?.isbn || '',
          start_date: startDate?.toISOString().split('T')[0],
          status,
          tags,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success === false && result.error?.includes('已存在')) {
          setDuplicateError(result.error);
          return;
        }
        resetForm();
        setOpen(false);
        onBookAdded?.();
      }
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setNationality('');
    setNationalityName('');
    setSelectedCover(null);
    setCustomCoverUrl('');
    setUploadedCoverUrl('');
    setCoverSource('url');
    setStartDate(undefined);
    setStatus('want_to_read');
    setTags([]);
    setSearchResults([]);
    setSearchError(null);
    setDuplicateError(null);
    setStep('search');
    setAddSource('search');
  };

  // 重置对话框
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  // 状态配置
  const statusConfig = {
    want_to_read: { label: '想读', color: 'bg-gray-500' },
    reading: { label: '在读', color: 'bg-blue-500' },
    completed: { label: '读完', color: 'bg-green-500' },
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            添加书籍
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {step === 'search' ? '搜索书籍' : '添加书籍详情'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6">
          {step === 'search' ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-4">
                {/* 添加方式选择 */}
                <Tabs value={addSource} onValueChange={(v) => { setAddSource(v as 'search' | 'epub'); setSearchError(null); setDuplicateError(null); }}>
                  <TabsList className="grid w-full grid-cols-2 h-9">
                    <TabsTrigger value="search" className="gap-1">
                      <Search className="h-3.5 w-3.5" />
                      搜索添加
                    </TabsTrigger>
                    <TabsTrigger value="epub" className="gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      EPUB 导入
                    </TabsTrigger>
                  </TabsList>

                  {/* 搜索添加 */}
                  <TabsContent value="search" className="mt-4 space-y-4">
                {/* 搜索表单 */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="title" className="flex items-center gap-1">
                      书名 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="输入书名..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="author">作者（可选，帮助精确搜索）</Label>
                      <Input
                        id="author"
                        placeholder="输入作者名..."
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleSearch} disabled={searching || !title.trim()}>
                        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">搜索</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 错误提示 */}
                {searchError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{searchError}</AlertDescription>
                  </Alert>
                )}

                {/* 搜索结果 */}
                {searchResults.length > 0 && (
                  <div>
                    <Label className="mb-2 block">选择书籍（点击封面选择）</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {searchResults.slice(0, 6).map((cover, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-2 cursor-pointer hover:border-primary hover:bg-accent transition-colors group"
                          onClick={() => handleSelectCover(cover)}
                        >
                          <div className="bg-muted rounded overflow-hidden mb-1 relative" style={{ height: '100px', width: '71px' }}>
                            {cover.cover_url ? (
                              <img
                                src={getCoverUrl(cover.cover_url)}
                                alt={cover.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <h4 className="font-medium text-xs truncate">{cover.title}</h4>
                          {cover.author && (
                            <p className="text-[10px] text-muted-foreground truncate">{cover.author}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 手动添加区域 */}
                <div className="border-t pt-3 space-y-3">
                  <Label className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    没找到？手动添加
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="manual-title" className="text-xs">
                        书名 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="manual-title"
                        placeholder="书名"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="manual-author" className="text-xs">
                        作者 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="manual-author"
                        placeholder="作者"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">作者国别</Label>
                      <CountrySelect
                        value={nationality}
                        onChange={(code, name) => {
                          setNationality(code);
                          setNationalityName(name);
                        }}
                        placeholder="选择国家/地区"
                      />
                    </div>
                  </div>
                  
                  {/* 封面选择 */}
                  <div>
                    <Label className="text-xs mb-2 block">
                      封面 <span className="text-destructive">*</span>
                    </Label>
                    <Tabs value={coverSource} onValueChange={(v) => setCoverSource(v as 'url' | 'upload' | 'paste')}>
                      <TabsList className="grid w-full grid-cols-3 h-8">
                        <TabsTrigger value="url" className="text-xs gap-1">
                          <LinkIcon className="h-3 w-3" />
                          链接
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="text-xs gap-1">
                          <Upload className="h-3 w-3" />
                          上传
                        </TabsTrigger>
                        <TabsTrigger value="paste" className="text-xs gap-1">
                          <Clipboard className="h-3 w-3" />
                          粘贴
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="url" className="mt-2">
                        <Input
                          placeholder="https://example.com/cover.jpg"
                          value={customCoverUrl}
                          onChange={(e) => setCustomCoverUrl(e.target.value)}
                        />
                      </TabsContent>
                      <TabsContent value="upload" className="mt-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <div
                          className={cn(
                            "border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer",
                            uploading ? "border-muted bg-muted/50" : "border-muted-foreground/25 hover:border-primary hover:bg-accent/50"
                          )}
                          onClick={() => !uploading && handleCoverDialogClick()}
                          onPaste={handlePaste}
                          tabIndex={0}
                        >
                          {uploading ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">上传中...</span>
                            </div>
                          ) : uploadedCoverUrl ? (
                            <div className="flex items-center justify-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-xs text-muted-foreground">已上传，点击更换</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Upload className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">点击选择文件</span>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="paste" className="mt-2">
                        <div
                          className={cn(
                            "border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer",
                            uploading ? "border-muted bg-muted/50" : "border-muted-foreground/25 hover:border-primary hover:bg-accent/50"
                          )}
                          onClick={() => !uploading && handlePasteFromClipboard()}
                        >
                          {uploading ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">上传中...</span>
                            </div>
                          ) : uploadedCoverUrl ? (
                            <div className="flex items-center justify-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-xs text-muted-foreground">已粘贴，点击更换</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Clipboard className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">点击粘贴剪贴板图片</span>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={
                      !title.trim() || 
                      !author.trim() || 
                      (coverSource === 'url' && !customCoverUrl.trim()) ||
                      ((coverSource === 'upload' || coverSource === 'paste') && !uploadedCoverUrl.trim())
                    }
                    onClick={handleManualContinue}
                  >
                    继续添加
                  </Button>
                </div>
                  </TabsContent>

                  {/* EPUB 导入 */}
                  <TabsContent value="epub" className="mt-4 space-y-4">
                    <input
                      ref={epubInputRef}
                      type="file"
                      accept=".epub"
                      style={{ position: 'absolute', left: '-9999px', opacity: 0, width: 0, height: 0 }}
                      onChange={handleEpubUpload}
                    />
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                        parsingEpub ? "border-muted bg-muted/50" : "border-muted-foreground/25 hover:border-primary hover:bg-accent/50"
                      )}
                      onClick={() => !parsingEpub && handleEpubDialogClick()}
                    >
                      {parsingEpub ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">正在解析 EPUB 文件...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">点击上传 EPUB 文件</p>
                            <p className="text-xs text-muted-foreground mt-1">支持 .epub 格式，自动解析书名、作者、封面等信息</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {searchError && addSource === 'epub' && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{searchError}</AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-4">
                {/* 重复提示 */}
                {duplicateError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{duplicateError}</AlertDescription>
                  </Alert>
                )}

                {/* 必填项验证提示 */}
                {(!selectedCover?.author?.trim() || !currentCoverUrl.trim()) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {!selectedCover?.author?.trim() && '作者为必填项，'}
                      {!currentCoverUrl.trim() && '封面为必填项'}
                      ，请补充完整
                    </AlertDescription>
                  </Alert>
                )}

                {/* 封面预览 */}
                <div className="flex gap-3">
                  <div 
                    className="bg-muted rounded overflow-hidden flex-shrink-0 relative" 
                    style={{ height: '140px', width: '99px' }} // 高140磅约186px, 按标准书籍比例计算宽度
                  >
                    {currentCoverUrl ? (
                      <img
                        src={getCoverUrl(currentCoverUrl)}
                        alt={selectedCover?.title || title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        书名 <span className="text-destructive">*</span>
                      </Label>
                      <Input value={selectedCover?.title || title} disabled className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        作者 <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        value={selectedCover?.author || author}
                        onChange={(e) => {
                          if (selectedCover) {
                            setSelectedCover({ ...selectedCover, author: e.target.value });
                          } else {
                            setAuthor(e.target.value);
                          }
                        }}
                        placeholder="请输入作者"
                        className="h-8"
                      />
                    </div>
                    
                    {/* 作者国别 */}
                    <div>
                      <Label className="text-xs">作者国别</Label>
                      <CountrySelect
                        value={nationality}
                        onChange={(code, name) => {
                          setNationality(code);
                          setNationalityName(name);
                        }}
                        placeholder="选择国家/地区"
                      />
                    </div>
                    
                    {/* 封面修改 */}
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        封面 <span className="text-destructive">*</span>
                      </Label>
                      <Tabs value={coverSource} onValueChange={(v) => setCoverSource(v as 'url' | 'upload' | 'paste')}>
                        <TabsList className="grid w-full grid-cols-3 h-7">
                          <TabsTrigger value="url" className="text-xs gap-1">
                            <LinkIcon className="h-3 w-3" />
                            链接
                          </TabsTrigger>
                          <TabsTrigger value="upload" className="text-xs gap-1">
                            <Upload className="h-3 w-3" />
                            上传
                          </TabsTrigger>
                          <TabsTrigger value="paste" className="text-xs gap-1">
                            <Clipboard className="h-3 w-3" />
                            粘贴
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="url" className="mt-1">
                          <Input 
                            value={
                              (() => {
                                const url = customCoverUrl || selectedCover?.cover_url || ''
                                // data URL 太长，用占位文字替代显示
                                if (url.startsWith('data:')) return '[已从 EPUB 提取封面]'
                                return url
                              })()
                            }
                            onChange={(e) => setCustomCoverUrl(e.target.value)}
                            placeholder="请输入封面图片链接"
                            className="h-8"
                          />
                        </TabsContent>
                        <TabsContent value="upload" className="mt-1">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          <div
                            className={cn(
                              "border-2 border-dashed rounded p-2 text-center transition-colors cursor-pointer",
                              uploading ? "border-muted bg-muted/50" : "border-muted-foreground/25 hover:border-primary hover:bg-accent/50"
                            )}
                            onClick={() => !uploading && handleCoverDialogClick()}
                          >
                            {uploading ? (
                              <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                            ) : uploadedCoverUrl ? (
                              <span className="text-xs text-green-600">已上传，点击更换</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">点击选择文件</span>
                            )}
                          </div>
                        </TabsContent>
                        <TabsContent value="paste" className="mt-1">
                          <div
                            className={cn(
                              "border-2 border-dashed rounded p-2 text-center transition-colors cursor-pointer",
                              uploading ? "border-muted bg-muted/50" : "border-muted-foreground/25 hover:border-primary hover:bg-accent/50"
                            )}
                            onClick={() => !uploading && handlePasteFromClipboard()}
                          >
                            {uploading ? (
                              <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                            ) : uploadedCoverUrl ? (
                              <span className="text-xs text-green-600">已粘贴，点击更换</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">点击粘贴图片</span>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                    
                    <div>
                      <Label className="text-xs">出版社</Label>
                      <Input 
                        value={selectedCover?.publisher || ''}
                        onChange={(e) => {
                          if (selectedCover) {
                            setSelectedCover({ ...selectedCover, publisher: e.target.value });
                          }
                        }}
                        placeholder="出版社（可选）"
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* 阅读状态 */}
                <div>
                  <Label className="text-xs">阅读状态</Label>
                  <div className="flex gap-2 mt-1">
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <Button
                        key={key}
                        variant={status === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatus(key as typeof status)}
                        className="h-7 text-xs"
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full mr-1', config.color)} />
                        {config.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 开始阅读日期 */}
                <div>
                  <Label className="text-xs">开始阅读日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal mt-1 h-8">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {startDate ? format(startDate, 'PPP', { locale: zhCN }) : '选择日期'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        locale={zhCN}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 标签 */}
                <div>
                  <Label className="text-xs">标签</Label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer pointer-events-auto"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="输入标签..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="h-8"
                    />
                    <Button variant="outline" size="icon" onClick={handleAddTag} className="h-8 w-8">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* 底部按钮区域 - 固定 */}
        {step === 'details' && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-background flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setStep('search')}
            >
              返回
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={
                saving || 
                !selectedCover?.title?.trim() && !title.trim() ||
                !selectedCover?.author?.trim() && !author.trim() ||
                !currentCoverUrl.trim()
              }
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              保存
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
