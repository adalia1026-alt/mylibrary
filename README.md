MyLibrary 📚
一款在本地管理几千本电子书的桌面工具——封面自动匹配、读书记录、年度总结，告别混乱的 Excel。 A local desktop app for managing thousands of e-books — auto cover matching, reading logs, and yearly summaries, no more messy spreadsheets.

✨ 功能特性 / Features
📖 本地电子书收录整理 — 支持批量导入和统一管理本地电子书文件 / Local e-book cataloging — bulk import and unified management of local e-book files
🎨 封面自动展示 — 自动匹配书籍封面，告别手动复制粘贴 / Auto cover display — automatically matches book covers, no more manual copy-paste
📝 读书记录与评价管理 — 随时记录阅读进度、打分和书评 / Reading log & rating — track your reading progress, rate and review books anytime
📊 年度读书总结 — 一键生成年度阅读报告，看看这一年读了哪些好书 / Yearly reading report — generate your annual reading recap with one click
🖥️ 原生桌面体验 — 基于 Tauri 打包为 macOS 原生应用，离线可用 / Native desktop experience — packaged as macOS app via Tauri, works offline
🛠 技术栈 / Tech Stack
Next.js — 前端框架 / Frontend framework
Tauri v2 — 桌面应用打包 / Desktop app bundling
React — UI 构建 / UI library
TypeScript — 类型安全 / Type safety
📸 截图 / Screenshots
截图待补充 / Screenshots coming soon

📦 安装使用 / Installation
前往 Releases 页面下载最新版本的 .dmg 文件
双击打开并拖入 Applications 文件夹
首次打开如遇安全提示，请在「系统设置 → 隐私与安全性」中允许运行
目前仅支持 macOS。Windows 版本敬请期待。

Go to Releases and download the latest .dmg file
Open and drag to your Applications folder
If prompted by macOS security, allow it in System Settings → Privacy & Security
Currently macOS only. Windows support coming soon.

💡 开发背景 / Background
作为一个存了几千本电子书的读书人，我一直用 Excel 维护读书记录，但找封面、去重、做年终总结都极其痛苦。于是决定自己动手，用 AI 写代码，两周做出了这个工具。

As someone with thousands of e-books on disk, I was tired of maintaining reading logs in Excel — copying covers, deduplicating entries, and doing year-end summaries by hand. So I built this tool myself, with AI assistance, in just two weeks.

👤 作者 / Adalia（木爻）
一个产品经理，零编程基础，靠 vibe coding + AI 做出了这款工具。
公众号：[木爻说]

A product manager with zero coding background, built this tool through vibe coding with AI.
WeChat Official Account: [木爻说]



## 项目结构

```
src/
├── app/                      # Next.js App Router 目录
│   ├── layout.tsx           # 根布局组件
│   ├── page.tsx             # 首页
│   ├── globals.css          # 全局样式（包含 shadcn 主题变量）
│   └── [route]/             # 其他路由页面
├── components/              # React 组件目录
│   └── ui/                  # shadcn/ui 基础组件（优先使用）
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── lib/                     # 工具函数库
│   └── utils.ts            # cn() 等工具函数
└── hooks/                   # 自定义 React Hooks（可选）

server/
├── index.ts                 # 自定义服务器入口
├── tsconfig.json           # Server TypeScript 配置
└── dist/                    # 编译输出目录（自动生成）
```

