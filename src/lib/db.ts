/**
 * SQLite 数据库模块 - 桌面应用本地数据持久化
 * 使用 sql.js (WASM-based SQLite, 无需原生编译)
 * Schema 对齐 src/types/index.ts 中的 Book 和 Tag 接口
 */

import path from 'path'
import fs from 'fs'

// 数据目录：生产模式使用 DATA_DIR 环境变量（持久化目录），开发模式使用 project/data/
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'library.db')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// ---- 数据库初始化（懒加载 + 预初始化） ----

let _db: any = null
let _initPromise: Promise<any> | null = null
let _SQL: any = null

async function initDb(): Promise<any> {
  ensureDataDir()
  
  // 使用 sql.js (纯 WASM, 无需原生编译)
  // locateFile 配置用于定位 WASM 文件
  const initSqlJs = require('sql.js')
  // 注意：在 Next.js standalone 打包后的 chunk 中：
  // - __dirname 指向源码目录（不可靠）
  // - require.resolve() 返回数字模块 ID（不可用）
  // - process.cwd() 正确指向 standalone 根目录（server.js 已 process.chdir）
  const wasmBaseDir = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist')
  _SQL = await initSqlJs({
    locateFile: (file: string) => path.join(wasmBaseDir, file),
  })

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    _db = new _SQL.Database(buffer)
  } else {
    _db = new _SQL.Database()
  }

  // 启用 WAL 模式（sql.js 不支持 WAL，但可以设置其他 pragma）
  _db.run('PRAGMA foreign_keys = ON')

  // 创建表结构
  _db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT '',
      nationality TEXT NOT NULL DEFAULT '',
      cover_url TEXT NOT NULL DEFAULT '',
      publisher TEXT NOT NULL DEFAULT '',
      isbn TEXT NOT NULL DEFAULT '',
      start_date TEXT,
      end_date TEXT,
      rating REAL,
      review TEXT,
      status TEXT NOT NULL DEFAULT 'want_to_read',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]'
    )
  `)

  _db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6366f1',
      created_at TEXT NOT NULL
    )
  `)

  _db.run('CREATE INDEX IF NOT EXISTS idx_books_status ON books(status)')
  _db.run('CREATE INDEX IF NOT EXISTS idx_books_created ON books(created_at)')
  _db.run('CREATE INDEX IF NOT EXISTS idx_books_end_date ON books(end_date)')

  saveDb()

  // 迁移 JSON 数据
  await migrateFromJson()

  return _db
}

async function getDb(): Promise<any> {
  if (_db) return _db
  if (!_initPromise) {
    _initPromise = initDb()
  }
  return _initPromise
}

function saveDb() {
  if (!_db) return
  try {
    const data = _db.export()
    fs.writeFileSync(DB_PATH, Buffer.from(data))
  } catch (err) {
    console.error('[DB] 保存数据库失败:', err)
  }
}

// ---- JSON 数据迁移 ----

async function migrateFromJson() {
  const booksJsonPath = path.join(DATA_DIR, 'reading-tracker-books.json')
  const tagsJsonPath = path.join(DATA_DIR, 'reading-tracker-tags.json')

  if (!fs.existsSync(booksJsonPath) && !fs.existsSync(tagsJsonPath)) return

  const db = _db!

  // 检查是否已迁移
  const bookCount = db.exec('SELECT COUNT(*) as count FROM books')
  const tagCount = db.exec('SELECT COUNT(*) as count FROM tags')

  const booksExist = bookCount.length > 0 && bookCount[0].values[0][0] > 0
  const tagsExist = tagCount.length > 0 && tagCount[0].values[0][0] > 0

  if (!booksExist && fs.existsSync(booksJsonPath)) {
    try {
      const booksData = JSON.parse(fs.readFileSync(booksJsonPath, 'utf-8'))
      if (Array.isArray(booksData) && booksData.length > 0) {
        for (const book of booksData) {
          db.run(
            `INSERT OR IGNORE INTO books
             (id, title, author, nationality, cover_url, publisher, isbn,
              start_date, end_date, rating, review, status, created_at, updated_at, tags)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              book.id || generateId(),
              book.title || '',
              book.author || '',
              book.nationality || '',
              book.cover_url || book.cover || '',
              book.publisher || '',
              book.isbn || '',
              book.start_date || null,
              book.end_date || null,
              book.rating || null,
              book.review || null,
              book.status || 'want_to_read',
              book.created_at || new Date().toISOString(),
              book.updated_at || new Date().toISOString(),
              JSON.stringify(book.tags || []),
            ]
          )
        }
        saveDb()
        console.log(`[DB] 已从 JSON 迁移 ${booksData.length} 本书籍`)
      }
    } catch (err) {
      console.error('[DB] 书籍数据迁移失败:', err)
    }
  }

  if (!tagsExist && fs.existsSync(tagsJsonPath)) {
    try {
      const tagsData = JSON.parse(fs.readFileSync(tagsJsonPath, 'utf-8'))
      if (Array.isArray(tagsData) && tagsData.length > 0) {
        for (const tag of tagsData) {
          db.run(
            'INSERT OR IGNORE INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)',
            [
              tag.id || generateId(),
              tag.name || '',
              tag.color || '#6366f1',
              tag.created_at || new Date().toISOString(),
            ]
          )
        }
        saveDb()
        console.log(`[DB] 已从 JSON 迁移 ${tagsData.length} 个标签`)
      }
    } catch (err) {
      console.error('[DB] 标签数据迁移失败:', err)
    }
  }
}

// ---- 辅助函数 ----

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 执行 SELECT 查询，返回对象数组
function queryAll(sql: string, params: any[] = []): any[] {
  const db = _db!
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const results: any[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results.map(deserializeRow)
}

// 执行 SELECT 查询，返回单个对象
function queryOne(sql: string, params: any[] = []): any | null {
  const db = _db!
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  let result: any = null
  if (stmt.step()) {
    result = stmt.getAsObject()
  }
  stmt.free()
  return result ? deserializeRow(result) : null
}

// 执行 INSERT/UPDATE/DELETE
function execute(sql: string, params: any[] = []): void {
  _db!.run(sql, params)
  saveDb()
}

function serializeTags(tags: any): string {
  if (!tags) return '[]'
  if (typeof tags === 'string') {
    try { JSON.parse(tags); return tags } catch { return '[]' }
  }
  return JSON.stringify(tags)
}

function deserializeRow(row: any): any {
  if (row && typeof row.tags === 'string') {
    try { row.tags = JSON.parse(row.tags) } catch { row.tags = [] }
  }
  if (row && row.rating !== null && row.rating !== undefined) {
    row.rating = Number(row.rating)
  }
  return row
}

const TAG_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E',
]

function getRandomColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
}

// ---- 书籍操作（异步） ----

export const bookDb = {
  async getAll(): Promise<any[]> {
    await getDb()
    return queryAll('SELECT * FROM books ORDER BY updated_at DESC')
  },

  async getById(id: string): Promise<any | null> {
    await getDb()
    return queryOne('SELECT * FROM books WHERE id = ?', [id])
  },

  async create(book: any): Promise<any> {
    await getDb()
    const now = new Date().toISOString()
    const id = book.id || generateId()

    execute(
      `INSERT INTO books (id, title, author, nationality, cover_url, publisher, isbn,
        start_date, end_date, rating, review, status, created_at, updated_at, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, book.title || '', book.author || '', book.nationality || '',
        book.cover_url || book.cover || '', book.publisher || '', book.isbn || '',
        book.start_date || null, book.end_date || null, book.rating || null,
        book.review || null, book.status || 'want_to_read',
        now, now, serializeTags(book.tags),
      ]
    )

    return this.getById(id)
  },

  async update(id: string, updates: any): Promise<any | null> {
    await getDb()
    const existing = await this.getById(id)
    if (!existing) return null

    const now = new Date().toISOString()
    const merged = { ...existing, ...updates, updated_at: now }

    execute(
      `UPDATE books SET
        title = ?, author = ?, nationality = ?, cover_url = ?, publisher = ?,
        isbn = ?, start_date = ?, end_date = ?, rating = ?, review = ?,
        status = ?, updated_at = ?, tags = ?
       WHERE id = ?`,
      [
        merged.title, merged.author, merged.nationality || '',
        merged.cover_url || '', merged.publisher || '', merged.isbn || '',
        merged.start_date || null, merged.end_date || null,
        merged.rating || null, merged.review || null,
        merged.status || 'want_to_read', now, serializeTags(merged.tags), id,
      ]
    )

    return this.getById(id)
  },

  async delete(id: string): Promise<boolean> {
    await getDb()
    const countBefore = queryAll('SELECT COUNT(*) as c FROM books WHERE id = ?', [id])
    execute('DELETE FROM books WHERE id = ?', [id])
    return countBefore.length > 0 && (countBefore[0] as any).c > 0
  },

  async query(filters: { status?: string; year?: string; tag?: string }): Promise<any[]> {
    await getDb()
    let sql = 'SELECT * FROM books WHERE 1=1'
    const params: any[] = []

    if (filters.status && filters.status !== 'all') {
      sql += ' AND status = ?'
      params.push(filters.status)
    }

    if (filters.year) {
      sql += ' AND end_date LIKE ?'
      params.push(`${filters.year}%`)
    }

    if (filters.tag) {
      sql += ' AND tags LIKE ?'
      params.push(`%"id":"${filters.tag}"%`)
    }

    sql += ' ORDER BY updated_at DESC'
    return queryAll(sql, params)
  },
}

// ---- 标签操作（异步） ----

export const tagDb = {
  async getAll(): Promise<any[]> {
    await getDb()
    return queryAll('SELECT * FROM tags ORDER BY created_at DESC')
  },

  async getByName(name: string): Promise<any | null> {
    await getDb()
    return queryOne('SELECT * FROM tags WHERE name = ?', [name])
  },

  async create(tag: any): Promise<any> {
    await getDb()
    const now = new Date().toISOString()
    const id = tag.id || generateId()

    execute(
      'INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)',
      [id, tag.name || '', tag.color || '#6366f1', now]
    )

    return queryOne('SELECT * FROM tags WHERE id = ?', [id])
  },

  async createIfNotExists(name: string, color?: string): Promise<any> {
    await getDb()
    const existing = await this.getByName(name)
    if (existing) return existing

    return this.create({ name, color: color || getRandomColor() })
  },

  async delete(id: string): Promise<boolean> {
    await getDb()
    const countBefore = queryAll('SELECT COUNT(*) as c FROM tags WHERE id = ?', [id])
    execute('DELETE FROM tags WHERE id = ?', [id])
    return countBefore.length > 0 && (countBefore[0] as any).c > 0
  },
}
