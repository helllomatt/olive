const http = require('http')
const server = require('./server')
const event = require('./event')
require('./req')
require('./res')

new event('server.online')
new event('server.offline')
new event('server.error')
new event('server.request')
new event('server.request.cancelled')
new event('server.request.routed')
new event('server.request.notfound')
new event('server.request.done')

server.start()

class HTTP {
    constructor(details) {
        this.details = Object.assign({
            address: 'localhost',
            port: 8000,
            autoFindPort: true,
            listenCallback: function() {}
        }, details)

        this.create()
    }

    handleServerError(err) {
        event.get('server.error').fire(err)

        if (err.code === 'EADDRINUSE' && this.details.autoFindPort) {
            this.details.port += 1
            this.stop()
            this.create()
            this.listen()
        }
    }

    create() {
        event.get('server.request.done').listen((req, res) => {
            if (!res.finished) {
                res.end()
            }
        })

        this.server = http.createServer((req, res) => {
            event.get('server.request').fire(req, res)
        })

        this.server.on('error', this.handleServerError.bind(this))
    }

    listen(options = {}) {
        if (options.port) {
            let parsed = parseInt(options.port)
            if (isNaN(parsed)) {
                throw new Error('Invalid port given, must be a number')
            } else {
                options.port = parsed
            }
        }

        if (options.callback && typeof options.callback === 'function') {
            this.details.listenCallback = options.callback
        }

        if (options.port) {
            this.details.port = options.port
        } else if (process.env.SERVER_PORT) {
            this.details.port = process.env.SERVER_PORT
        }

        if (options.address) {
            this.details.address = options.address
        } else if (process.env.SERVER_ADDRESS) {
            this.details.address = process.env.SERVER_ADDRESS
        }

        this.server.listen(this.details.port, this.details.address, () => {
            event.get('server.online').fire(this)
            this.details.listenCallback()
        })
    }

    stop() {
        if (this.server.listening) {
            this.server.close()
            event.get('server.offline').fire()
        }
    }
}

module.exports = () => {
    return new HTTP()
}