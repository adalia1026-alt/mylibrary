/**
 * Tauri 文件对话框封装
 * 在 Tauri 环境中使用原生对话框（避免 WRY WebView NSOpenPanel crash），
 * 在浏览器/开发环境中回退到 HTML <input type="file">
 */

let _isTauri: boolean | null = null

/** 检测是否在 Tauri 桌面环境中运行 */
export function isTauri(): boolean {
  if (_isTauri !== null) return _isTauri
  _isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__
  return _isTauri
}

export interface FileDialogResult {
  /** 文件名 */
  name: string
  /** 文件内容为 Uint8Array */
  data: Uint8Array
  /** MIME 类型 */
  mimeType: string
}

/**
 * 打开文件选择对话框
 * Tauri 环境 → 使用原生 NSOpenPanel（via tauri-plugin-dialog）
 * 浏览器环境 → 回退到 HTML input[type=file]
 */
export async function openFileDialog(accept: string): Promise<FileDialogResult | null> {
  if (isTauri()) {
    return openTauriDialog(accept)
  }
  return openBrowserDialog(accept)
}

async function openTauriDialog(accept: string): Promise<FileDialogResult | null> {
  try {
    const tauriInternals = (window as any).__TAURI_INTERNALS__
    if (!tauriInternals) return openBrowserDialog(accept)

    const extList = accept.split(',').map((ext: string) => ext.trim().replace(/^\./, ''))

    // 使用 Tauri 内部 IPC 调用 dialog 插件
    // ⚠️ 选项必须包裹在 { options: { ... } } 中（与 @tauri-apps/plugin-dialog 官方 API 一致）
    const selected = await tauriInternals.invoke('plugin:dialog|open', {
      options: {
        multiple: false,
        filters: extList.length > 0 ? [{ name: 'Files', extensions: extList }] : [],
      }
    })

    console.log('[Tauri Dialog] selected:', selected)

    if (!selected) return null

    // selected 可能是字符串路径，也可能是对象
    const filePath: string = typeof selected === 'string' ? selected : (selected.path || selected)

    if (!filePath) return null

    const fileName = filePath.split('/').pop() || 'unknown'

    // 通过自定义 Rust 命令读取文件内容
    const fileBytes: number[] = await tauriInternals.invoke('read_file_bytes', { path: filePath })
    const data = new Uint8Array(fileBytes)

    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const mimeMap: Record<string, string> = {
      epub: 'application/epub+zip',
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
    }
    const mimeType = mimeMap[ext] || 'application/octet-stream'

    return { name: fileName, data, mimeType }
  } catch (err) {
    console.error('[Tauri Dialog] 文件选择失败，回退到浏览器对话框:', err)
    return openBrowserDialog(accept)
  }
}

function openBrowserDialog(accept: string): Promise<FileDialogResult | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'

    let settled = false

    const cleanup = () => {
      if (input.parentNode) {
        document.body.removeChild(input)
      }
    }

    input.onchange = async () => {
      if (settled) return
      settled = true
      cleanup()

      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      try {
        const arrayBuffer = await file.arrayBuffer()
        resolve({
          name: file.name,
          data: new Uint8Array(arrayBuffer),
          mimeType: file.type || 'application/octet-stream',
        })
      } catch (err) {
        console.error('[FileDialog] 读取文件失败:', err)
        resolve(null)
      }
    }

    // 用户取消：通过 window focus 事件检测
    // 文件对话框打开时窗口失焦，关闭后窗口重新获得焦点
    const onFocus = () => {
      window.removeEventListener('focus', onFocus)
      // 延迟检查：给 input.onchange 一个执行的机会
      setTimeout(() => {
        if (!settled) {
          settled = true
          cleanup()
          resolve(null)
        }
      }, 300)
    }
    window.addEventListener('focus', onFocus)

    document.body.appendChild(input)
    input.click()
    // ⚠️ 不要在这里 removeChild — 文件对话框是异步的，
    // 立即移除 input 元素会导致对话框被取消
  })
}
