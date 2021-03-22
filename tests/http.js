const assert = require('assert')

describe('HTTP Server', function() {
    it('should start a server, listening on port 8000', function(done) {
        let http = require('../lib/http')()

        http.listen({
            callback: () => {
                assert.equal(http.server.listening, true)
                http.stop()
                done()
            }
        })
    })

    it('should start a server, listening on port 3000', function(done) {
        let http = require('../lib/http')()

        http.listen({
            port: 3000,
            callback: () => {
                assert.equal(http.server.listening, true)
                assert.equal(http.details.port, 3000)
                http.stop()
                done()
            }
        })
    })

    it('should throw an error for an invalid port', function() {
        let http = require('../lib/http')()

        assert.throws(() => {
            http.listen({
                port: 'yo what up'
            })
        }, Error, 'Invalid port given, must be a number')
    })

    it('should find the next available port', function(done) {
        let http = require('../lib/http')()
        http.listen({
            callback: () => {
                let http2 = require('../lib/http')()
                http2.listen({
                    callback: () => {
                        assert.equal(http2.details.port, http.details.port + 1)
                        http.stop()
                        http2.stop()
                        done()
                    }
                })
            }
        })
    })
})