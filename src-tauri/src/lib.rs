use std::fs;
use std::net::TcpStream;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Duration;
use tauri::Manager;

struct ServerState {
  child: Option<Child>,
}

/// 计算文件的简单 hash（文件大小 + 修改时间），避免引入额外依赖
fn file_stamp(path: &std::path::Path) -> String {
  if let Ok(meta) = fs::metadata(path) {
    let size = meta.len();
    let mtime = meta.modified()
      .ok()
      .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
      .map(|d| d.as_secs())
      .unwrap_or(0);
    format!("{}-{}", size, mtime)
  } else {
    "unknown".to_string()
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![read_file_bytes])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let is_dev = cfg!(debug_assertions);
      let server_port: u16 = if is_dev { 3001 } else { 3007 };

      // In production: extract standalone and start Next.js server
      let server_child: Option<Child> = if !is_dev {
        let resource_dir = app.path().resource_dir()
          .expect("resource_dir not found");
        let tar_path = resource_dir.join("standalone").join("standalone.tar.gz");
        let app_data_dir = app.path().app_data_dir()
          .expect("app_data_dir not found");
        let extract_dir = app_data_dir.join("standalone");

        // ---- 持久化数据目录：独立于 standalone/ 之外 ----
        // 数据目录不会随 tar 解压被覆盖，版本更新也不丢数据
        let persistent_dir = app_data_dir.join("persistent");
        let data_dir = persistent_dir.join("data");
        let uploads_dir = persistent_dir.join("uploads");
        fs::create_dir_all(&data_dir).unwrap_or(());
        fs::create_dir_all(&uploads_dir).unwrap_or(());

        // ---- 数据迁移：如果 standalone/data/library.db 存在，移动到持久化目录 ----
        let old_db = extract_dir.join("data").join("library.db");
        let new_db = data_dir.join("library.db");
        if old_db.exists() && !new_db.exists() {
          eprintln!("[MyLibrary] Migrating library.db to persistent storage...");
          if let Err(e) = fs::rename(&old_db, &new_db) {
            eprintln!("[MyLibrary] Failed to migrate library.db: {}", e);
            // fallback: try copy
            if let Err(e2) = fs::copy(&old_db, &new_db) {
              eprintln!("[MyLibrary] Failed to copy library.db: {}", e2);
            }
          }
        }

        // 迁移旧 uploads 目录中的文件
        let old_uploads = extract_dir.join("public").join("uploads");
        if old_uploads.exists() {
          if let Ok(entries) = fs::read_dir(&old_uploads) {
            for entry in entries.flatten() {
              let path = entry.path();
              if path.is_file() {
                let fname = path.file_name().unwrap();
                let dest = uploads_dir.join(fname);
                if !dest.exists() {
                  eprintln!("[MyLibrary] Migrating upload: {:?}", fname);
                  let _ = fs::rename(&path, &dest);
                }
              }
            }
          }
        }

        // Extract standalone (code only — data is now in persistent/)
        // 版本戳：记录上次解压的 tar.gz stamp，避免每次启动都重复解压
        if tar_path.exists() {
          let stamp_file = app_data_dir.join("standalone_stamp.txt");
          let current_stamp = file_stamp(&tar_path);
          let last_stamp = fs::read_to_string(&stamp_file).unwrap_or_default();

          if current_stamp != last_stamp.trim() {
            eprintln!("[MyLibrary] Extracting standalone (version updated)...");

            fs::create_dir_all(&extract_dir).unwrap_or(());

            let status = Command::new("/usr/bin/tar")
              .args(["xzf", &tar_path.to_string_lossy().to_string(), "-C", &extract_dir.to_string_lossy().to_string()])
              .status();

            match status {
              Ok(s) if s.success() => {
                eprintln!("[MyLibrary] Extraction complete");
                // 写入新戳，下次启动跳过解压
                let _ = fs::write(&stamp_file, &current_stamp);
              }
              Ok(s) => eprintln!("[MyLibrary] tar failed: {}", s),
              Err(e) => eprintln!("[MyLibrary] tar error: {}", e),
            }
          } else {
            eprintln!("[MyLibrary] Standalone is up-to-date, skipping extraction");
          }

          // 复制种子 JSON 数据到持久化目录（仅首次）
          for seed in &["reading-tracker-books.json", "reading-tracker-tags.json"] {
            let src = extract_dir.join("data").join(seed);
            let dst = data_dir.join(seed);
            if src.exists() && !dst.exists() {
              eprintln!("[MyLibrary] Seeding: {:?} -> persistent", seed);
              let _ = fs::copy(&src, &dst);
            }
          }
        }

        // Start Next.js server
        let server_js = extract_dir.join("server.js");
        if server_js.exists() {
          let node_bin = find_node_binary();
          eprintln!("[MyLibrary] Starting server: {:?}", node_bin);

          let child = Command::new(&node_bin)
            .arg(&server_js)
            .current_dir(&extract_dir)
            .env("PORT", server_port.to_string())
            .env("DATA_DIR", data_dir.to_string_lossy().to_string())
            .env("UPLOADS_DIR", uploads_dir.to_string_lossy().to_string())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .ok();

          if child.is_some() {
            eprintln!("[MyLibrary] Server spawned on port {}", server_port);
          } else {
            eprintln!("[MyLibrary] Failed to spawn server");
          }

          child
        } else {
          eprintln!("[MyLibrary] server.js not found at {}", server_js.display());
          None
        }
      } else {
        None
      };

      // Wait for server to be ready
      let addr = format!("localhost:{}", server_port);
      eprintln!("[MyLibrary] Waiting for server...");
      for _ in 0..40 {
        if TcpStream::connect(&addr).is_ok() {
          eprintln!("[MyLibrary] Server ready");
          break;
        }
        std::thread::sleep(Duration::from_millis(250));
      }

      // Store server state for cleanup
      app.manage(Mutex::new(ServerState {
        child: server_child,
      }));

      // Create the main window
      let url = format!("http://127.0.0.1:{}", server_port);
      let _window = tauri::WebviewWindowBuilder::new(
        app,
        "main",
        tauri::WebviewUrl::External(url.parse().unwrap()),
      )
      .title("My Library")
      .inner_size(1200.0, 800.0)
      .min_inner_size(900.0, 600.0)
      .resizable(true)
      .center()
      .build()?;

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|_app_handle, event| {
      match event {
        tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
          eprintln!("[MyLibrary] Stopping server...");
          let state = _app_handle.state::<Mutex<ServerState>>();
          let mut guard = state.lock().unwrap();
          if let Some(ref mut child) = guard.child {
            let _ = child.kill();
            let _ = child.wait();
            eprintln!("[MyLibrary] Server stopped");
          }
        }
        _ => {}
      }
    });
}

fn find_node_binary() -> PathBuf {
  let candidates = [
    "/usr/local/bin/node",
    "/opt/homebrew/bin/node",
    "/usr/bin/node",
  ];

  for path in &candidates {
    let p = std::path::Path::new(path);
    if p.exists() {
      return p.to_path_buf();
    }
  }

  PathBuf::from("node")
}

/// 自定义命令：从文件系统读取文件内容（仅供 Tauri dialog 选择文件后使用）
#[tauri::command]
fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
  fs::read(&path).map_err(|e| format!("读取文件失败: {}", e))
}
