#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Zero-dependency local server for AMASA production build
Run with: python3 serve.py [port]
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", 3000))

class SPARequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            self.path = "/index.html"
        return super().do_GET()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = HTTPServer(("0.0.0.0", PORT), SPARequestHandler)
    print("\n" + "=" * 50)
    print(f"  AMASA - Production Build Running Successfully!")
    print(f"  URL: http://localhost:{PORT}")
    print(f"  (Zero dependencies - No npm install required)")
    print("=" * 50 + "\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
