const http = require('http')

http.ServerResponse.prototype.json = function (obj) {
    let str = JSON.stringify(obj)
    this.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': str.length
    })

    this.end(str)
}

http.ServerResponse.prototype.error = function (details) {
    let str = details.message || 'Error'
    let ct = 'text/html'

    if (details.type && details.type == 'json') {
        str = JSON.stringify(str)
        ct = 'application/json'
    }

    this.writeHead(details.code || 500, Object.assign({
        'Content-Type': ct,
        'Content-Length': str.length
    }, details.headers || {}))

    this.end(str)
}

http.ServerResponse.prototype.redirect = function(path) {
    this.statusCode = 302
    this.setHeader('Location', path)
    this.end()
}