import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Allow cross-origin isolation and avoid caching issues
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def main():
    os.chdir(DIRECTORY)
    # Find available port if 8080 is busy
    port = PORT
    for p in range(PORT, PORT + 20):
        try:
            with socketserver.TCPServer(("", p), Handler) as httpd:
                print(f"=====================================================")
                print(f"  迈从 K980 WebHID 驱动本地服务已启动!")
                print(f"  访问地址: http://localhost:{p}")
                print(f"  请在 Chrome 或 Edge 浏览器中体验")
                print(f"  按 Ctrl+C 即可退出服务")
                print(f"=====================================================")
                webbrowser.open(f"http://localhost:{p}")
                try:
                    httpd.serve_forever()
                except KeyboardInterrupt:
                    print("\n服务已停止。")
                return
        except OSError:
            continue
    print("未能绑定端口，请检查网络设置。")

if __name__ == '__main__':
    main()