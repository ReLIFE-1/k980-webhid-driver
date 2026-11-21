import argparse
import http.server
import os
import posixpath
import urllib.parse
import webbrowser

DEFAULT_PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class ReusableThreadingHTTPServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def _has_hidden_segment(self):
        raw_path = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        unified = raw_path.replace('\\', '/')
        normalized = posixpath.normpath(unified)
        for candidate in (unified, normalized):
            for seg in candidate.split('/'):
                if seg.startswith('.'):
                    return True
        return False

    def send_head(self):
        if self._has_hidden_segment():
            self.send_error(403, 'Forbidden')
            return None
        return super().send_head()

    def end_headers(self):
        # Disable browser caching so local edits take effect immediately
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description='迈从 K980 WebHID 驱动本地服务')
    parser.add_argument('--port', type=int, default=DEFAULT_PORT, help='起始监听端口 (默认 8080)')
    parser.add_argument('--no-browser', action='store_true', help='启动时不自动打开浏览器')
    args = parser.parse_args()

    os.chdir(DIRECTORY)
    for p in range(args.port, args.port + 20):
        try:
            with ReusableThreadingHTTPServer(('127.0.0.1', p), Handler) as httpd:
                url = f'http://127.0.0.1:{p}'
                print('=====================================================')
                print('  迈从 K980 WebHID 驱动本地服务已启动!')
                print(f'  访问地址: {url}')
                print('  请在 Chrome 或 Edge 浏览器中体验')
                print('  按 Ctrl+C 即可退出服务')
                print('=====================================================')
                if not args.no_browser:
                    webbrowser.open(url)
                try:
                    httpd.serve_forever()
                except KeyboardInterrupt:
                    print('\n服务已停止。')
                return
        except OSError:
            continue
    print('未能绑定本地端口，请检查网络或端口占用情况。')


if __name__ == '__main__':
    main()
