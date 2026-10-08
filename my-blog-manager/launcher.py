import sys
import os

# 路径定位逻辑
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
    EXE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    EXE_DIR = BASE_DIR

import webview
import threading
import uvicorn
import time
import socket
import json
import subprocess
import shutil
import traceback
from cms_core.main import app

frontend_process = None
WINDOW_CONFIG_FILE = os.path.join(EXE_DIR, 'window_config.json')

def release_port(port):
    try:
        command = f'netstat -ano | findstr :{port}'
        result = subprocess.check_output(command, shell=True).decode()
        lines = result.strip().split('\n')
        for line in lines:
            parts = line.strip().split()
            if len(parts) >= 5 and parts[3] == 'LISTENING':
                pid = parts[-1]
                subprocess.run(f'taskkill /PID {pid} /F /T', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                time.sleep(0.5)
    except:
        pass

def load_window_size():
    try:
        if os.path.exists(WINDOW_CONFIG_FILE):
            with open(WINDOW_CONFIG_FILE, 'r') as f:
                return json.load(f)
    except:
        pass
    return {"width": 1440, "height": 900}

def save_window_size(width, height):
    try:
        with open(WINDOW_CONFIG_FILE, 'w') as f:
            json.dump({"width": int(width), "height": int(height)}, f)
    except:
        pass

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def sync_standalone_assets():
    """把静态资源同步进 .next/standalone，供生产模式直接启动。

    Next.js 的 output:'standalone' 只产出 server.js 与最小 node_modules，
    官方要求构建后手动把 .next/static 与 public 复制进去，否则页面能打开、
    但 /_next/static/* 全部 404（页面无样式、无交互）。
    这里每次启动都同步一次，重新构建后不必手动处理。
    """
    standalone = os.path.join(BASE_DIR, '.next', 'standalone')
    if not os.path.exists(standalone):
        return

    # 静态 chunk（文件名带内容哈希，必须与本次构建一致，所以用覆盖式复制）
    src_static = os.path.join(BASE_DIR, '.next', 'static')
    dst_static = os.path.join(standalone, '.next', 'static')
    if os.path.exists(src_static):
        try:
            if os.path.exists(dst_static):
                shutil.rmtree(dst_static)
            shutil.copytree(src_static, dst_static)
        except Exception as e:
            print(f"[警告] 同步 .next/static 失败：{e}")

    # public 下的静态文件（不含运行期写入的 backend_config.json，单独处理）
    src_public = os.path.join(BASE_DIR, 'public')
    dst_public = os.path.join(standalone, 'public')
    if os.path.exists(src_public):
        try:
            shutil.copytree(src_public, dst_public, dirs_exist_ok=True)
        except Exception as e:
            print(f"[警告] 同步 public 失败：{e}")



def check_standalone_artifacts():
    """校验 standalone 产物是否完整。

    返回 (是否完整, 缺失项列表)。
    构建被中断、或构建时服务正在运行（EBUSY）都可能留下残缺产物：
    server.js 在、但 .next/static 或 BUILD_ID 没了。这种状态下启动，
    页面 HTML 能返回、静态资源却全部 404，现象很像"样式丢了"，
    排查成本高，所以在启动前就拦下来。
    """
    standalone = os.path.join(BASE_DIR, '.next', 'standalone')
    checks = {
        'standalone/server.js': os.path.join(standalone, 'server.js'),
        'standalone/.next/BUILD_ID': os.path.join(standalone, '.next', 'BUILD_ID'),
        '.next/static': os.path.join(BASE_DIR, '.next', 'static'),
        '.next/BUILD_ID': os.path.join(BASE_DIR, '.next', 'BUILD_ID'),
    }
    missing = [name for name, path in checks.items() if not os.path.exists(path)]
    return (len(missing) == 0, missing)


def write_port_config(port):
    # 写入解压目录供前端读取
    public_dir = os.path.join(BASE_DIR, 'public')
    os.makedirs(public_dir, exist_ok=True)
    with open(os.path.join(public_dir, 'backend_config.json'), 'w', encoding='utf-8') as f:
        json.dump({"api_port": port}, f)

    standalone_public = os.path.join(BASE_DIR, '.next', 'standalone', 'public')
    if os.path.exists(os.path.join(BASE_DIR, '.next', 'standalone')):
        os.makedirs(standalone_public, exist_ok=True)
        with open(os.path.join(standalone_public, 'backend_config.json'), 'w', encoding='utf-8') as f:
            json.dump({"api_port": port}, f)

def wait_for_port(port, timeout=60):
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(('127.0.0.1', port), timeout=1):
                return True
        except (ConnectionRefusedError, socket.timeout, OSError):
            time.sleep(1)
    return False

class WindowAPI:
    def resize_window(self, width, height):
        save_window_size(width, height)
        webview.windows[0].resize(int(width), int(height))
        return True
    def minimize_window(self): webview.windows[0].minimize()
    def maximize_window(self): webview.windows[0].toggle_fullscreen()
    def close_window(self): on_closed()

def run_api(port):
    # 强制后端在 EXE 所在的真实目录工作，确保能读取到旁边的 data/ 等数据
    os.chdir(EXE_DIR)
    print(f"[后端] 工作路径已锁定: {EXE_DIR}")
    try:
        uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
    except Exception as e:
        print("[后端] 崩溃报错：")
        traceback.print_exc()

def on_closed():
    if frontend_process:
        subprocess.run(f"taskkill /F /T /PID {frontend_process.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    release_port(frontend_port)
    release_port(backend_port)
    os._exit(0)

def on_shown():
    win_size = load_window_size()
    webview.windows[0].resize(int(win_size["width"]), int(win_size["height"]))

if __name__ == "__main__":
    frontend_port = get_free_port()
    backend_port = get_free_port()

    env_vars = os.environ.copy()
    env_vars["PORT"] = str(frontend_port)

    standalone_dir = os.path.join(BASE_DIR, '.next', 'standalone')
    server_js = os.path.join(standalone_dir, 'server.js')

    # 核心自适应逻辑：判断是“打包运行”还是“开发运行”
    #
    # 注意：standalone 产物可能残缺（例如构建被中断、或构建时服务正在运行
    # 导致 EBUSY）。残缺时启动会「页面能开但静态资源全 404」，很难排查，
    # 所以这里先校验产物完整性，不完整就退回 dev 模式并说明原因。
    artifacts_ok, missing = check_standalone_artifacts()
    if os.path.exists(server_js) and artifacts_ok:
        print("[生产模式] 启动 standalone 服务...")
        # standalone 不自带 .next/static，缺了会让 chunk 全部 404
        sync_standalone_assets()
        env_vars["HOSTNAME"] = "127.0.0.1"
        frontend_process = subprocess.Popen(["node", "server.js"], cwd=standalone_dir, env=env_vars, shell=True)
        window_url = f"http://127.0.0.1:{frontend_port}"
    else:
        if os.path.exists(server_js):
            print(f"[提示] 生产构建产物不完整，缺少：{', '.join(missing)}")
            print("[提示] 已自动改用开发模式启动；要恢复生产模式，请在管理端关闭后重新执行一次构建。")
        else:
            print("[开发模式] 未找到生产构建产物，使用开发模式启动...")
        frontend_process = subprocess.Popen("npm run dev", shell=True, cwd=BASE_DIR, env=env_vars)
        window_url = f"http://localhost:{frontend_port}"

    write_port_config(backend_port)
    threading.Thread(target=run_api, args=(backend_port,), daemon=True).start()

    if not wait_for_port(backend_port) or not wait_for_port(frontend_port):
        print(">>> 前后端启动失败！")
        on_closed()
        sys.exit(1)

    time.sleep(1.5)

    api = WindowAPI()
    window = webview.create_window(
        title='拾光集 · 控制台',
        url=window_url,
        width=1440, height=900, min_size=(1024, 768),
        background_color='#f7f3ea', resizable=True, frameless=True, easy_drag=False, js_api=api
    )

    window.events.shown += on_shown
    window.events.closed += on_closed

    try:
        webview.start(debug=True)
    except KeyboardInterrupt:
        on_closed()