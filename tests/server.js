const expect = require('chai').expect
require('chai').should()
const server = require('../lib/server')

const fn = function() {}

describe('Server', function() {
    it('add an empty get route', function() {
        server.route('get')

        server.routes['GET'].should.lengthOf(1)
    })

    it('should parse a strings into routes', function() {
        expect(server.parseRoute('/')).to.deep.equal({path: '/', regex: /^\/?$/i, keys: []})
        expect(server.parseRoute('/test')).to.deep.equal({path: '/test', regex: /^\/test\/?$/i, keys: []})
        expect(server.parseRoute('/test/:name')).to.deep.equal({path: '/test/:name', regex: /^\/test\/([^/]+?)\/?$/i, keys: ['name']})
        expect(server.parseRoute('/test/:::::name')).to.deep.equal({path: '/test/:name', regex: /^\/test\/([^/]+?)\/?$/i, keys: ['name']})
        expect(server.parseRoute('/test/:::::name/:/:as:df::')).to.deep.equal({path: '/test/:name/:asdf', regex: /^\/test\/([^/]+?)\/([^/]+?)\/?$/i, keys: ['name', 'asdf']})
        expect(server.parseRoute('/broken/^{}<>')).to.deep.equal({path: '/broken', regex: /^\/broken\/?$/i, keys: []})
        expect(server.parseRoute('/:name')).to.deep.equal({path: '/:name', regex: /^\/([^/]+?)\/?$/i, keys: ['name']})
    })

    it('should match the url string to a route', function() {
        server.get('/hello', fn)
        let matched = server.matchRoute('/hello', 'get')
        matched.route.callback = fn

        expect(matched.route).to.deep.equal(server.routes['GET'][1])
    })

    it('match the url string to a route with variables', function() {
        server.get('/hello/:name', fn)
        let matched = server.matchRoute('/hello/matt', 'get')
        matched.route.callback = fn

        expect(matched.route).to.deep.equal(server.routes['GET'][2])
        expect(matched.variables.name).to.equal('matt')
    })

    it('fail to match the url string', function() {
        let matched = server.matchRoute('/asdflmnop', 'get')

        expect(matched).to.equal(false)
    })

    it('fail to match the url string to a route with too many', function() {
        let matched = server.matchRoute('/hello/matt/27', 'get')

        expect(matched).to.equal(false)
    })

    it('sanitize javascript: in url', function() {
        let matched = server.matchRoute('/hello/javascript:alert("Hello")', 'get')
        matched.route.callback = fn

        expect(matched.route).to.equal(server.routes['GET'][2])
        expect(matched.variables.name).to.equal('javascript:alert(Hello)')
    })

    it('fail because of html in the url', function() {
        let matched = server.matchRoute('/hello/<script>alert(123)</script>', 'get')

        expect(matched).to.equal(false)
    })

    it('sanitize html in the url', function() {
        let matched = server.matchRoute('/hello/<script>alert(123)', 'get')
        matched.route.callback = fn

        expect(matched.route).to.equal(server.routes['GET'][2])
        expect(matched.variables.name).to.equal('scriptalert(123)')
    })

    it('sanitize encoded html in the url', function() {
        let matched = server.matchRoute('/hello/%3Cscript%3Ealert(123)', 'get')
        matched.route.callback = fn

        expect(matched.route).to.equal(server.routes['GET'][2])
        expect(matched.variables.name).to.equal('scriptalert(123)')
    })
})
