# Copyright (c) 2019 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.
# -*- coding: utf-8 -*-
#test on python 3.4 ,python of lower version  has different module organization.
import http.server
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver

PORT = 8080

Handler = http.server.SimpleHTTPRequestHandler

Handler.extensions_map={
    '.manifest': 'text/cache-manifest',
    '.html': 'text/html',
        '.png': 'image/png',
'.jpg': 'image/jpg',
    '.svg':    'image/svg+xml',
    '.css':    'text/css',
    '.js':    'application/x-javascript',
    '': 'text/html', # Default
}

httpd = socketserver.TCPServer(("", PORT), Handler)

print("serving at port", PORT)
httpd.serve_forever()
