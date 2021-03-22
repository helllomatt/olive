const path = require('path')
const fs = require('fs')
const event = require('./event')

let routes = {}
let middleware = []

function use(mw) {
    middleware.push(mw)
}

function parseRoute(route) {
    if (!route || route == '') {
        route = '/'
    }

    let path = route.substr(-1) === '/' ? route.slice(0, -1) : route
    let keys = []
    let rx = new RegExp(/[^-A-Za-z0-9+&@#/%?=~_|!:,.;\(\)]/, 'g')

    path = path.substr(1).split('/').map((item) => {
        item = item.replace(rx, '')
        if (item.indexOf(':') === 0) {
            let key = ':' + item.replace(/:+/g, '')
            return key
        } else {
            return item
        }
    }).filter((item) => {
        item = item.replace(/:+/g, '')
        return item !== ''
    })

    let regex = path.map((item) => {
        if (item.indexOf(':') === 0) {
            let key = ':' + item.replace(/:+/g, '')
            keys.push(key.substr(1))
            return '([^/]+?)'
        } else {
            return '/' + item
        }
    }).join('/') + '\/?$'

    if (regex.substr(0, 1) != '/') {
        regex = '^/' + regex
    } else {
        regex = '^' + regex
    }

    regex = new RegExp(regex, 'i')

    path = '/' + path.join('/')

    return { path, regex, keys }
}

function matchRoute(url, type) {
    type = type.toUpperCase()
    url = decodeURIComponent(url).replace(/[^-A-Za-z0-9+&@#/%?=~_|!:,.;\(\)]/g, '')
    let variables = {}

    if (!url || !routes[type]) {
        return false
    }

    for (let i = 0; i < routes[type].length; i++) {
        if (!routes[type][i] || !routes[type][i].regex) {
            continue
        }

        let match = routes[type][i].regex.exec(url)
        if (match !== null) {
            let keys = routes[type][i].keys

            for (let m = 1; m < match.length; m++) {
                variables[keys[m - 1]] = match[m]
            }

            return {
                route: routes[type][i],
                variables
            }
        }
    }

    return false
}

function addRoute(details, callbacks) {
    let parsed = parseRoute(details.path)

    parsed.callbacks = [].concat(middleware)
    for (let i = 1; i < callbacks.length; i++) {
        if (typeof callbacks[i] === 'function') {
            parsed.callbacks.push(callbacks[i])
        }
    }

    let method = details.method.toUpperCase()
    if (!routes[method]) {
        routes[method] = []
    }

    parsed.details = details || {}

    routes[method].push(parsed)
}

function loadController(controllerPath) {
    if (fs.existsSync(controllerPath)) {
        fs.lstat(controllerPath, (err, stats) => {
            if (err) {
                event.get('server.error').fire(`Failed to get the information for the controller file/folder item '${controllerPath}'`, err)
                return
            } else {
                if (stats.isDirectory()) {
                    event.get('server.error').fire(`loadController is for loading a controller file, use loadControllers to load a directory`)
                } else {
                    require(controllerPath)
                }
            }
        })
    } else {
        event.get('server.error').fire(`Failed to load the controller '${controllerPath}' because it doesn't exist.`)
    }
}

function loadControllers(controllerDir) {
    if (fs.existsSync(controllerDir)) {
        let stats = fs.lstatSync(controllerDir)

        if (stats.isDirectory()) {
            let inners = fs.readdirSync(controllerDir)

            for (let i = 0; i < inners.length; i++) {
                let controllerPath = path.join(controllerDir, inners[i])
                fs.lstat(controllerPath, (err, innerStats) => {
                    if (err) {
                        event.get('server.error').fire(`Failed to get the information for the controller file/folder item: ${controllerPath}`, err)
                        return
                    } else {
                        if (innerStats.isDirectory()) {
                            loadControllers(controllerPath)
                        } else {
                            loadController(controllerPath)
                        }
                    }
                })
            }
        } else {
            event.get('server.error').fire(`Cannot load controllers in directory '${controllerDir}' because it isn't a directory.`)
        }
    } else {
        event.get('server.error').fire(`Cannot load controllers in directory '${controllerDir}' because it doesn't exist.`)
    }
}

function get(details) {
    if (typeof details != 'object') {
        details = { path: details }
    }

    details.method = 'GET'
    addRoute(details, arguments)
}

function post(details) {
    if (typeof details != 'object') {
        details = { path: details }
    }

    details.method = 'POST'
    addRoute(details, arguments)
}

function put(details) {
    if (typeof details != 'object') {
        details = { path: details }
    }

    details.method = 'PUT'
    addRoute(details, arguments)
}

function del(details) {
    if (typeof details != 'object') {
        details = { path: details }
    }

    details.method = 'DELETE'
    addRoute(details, arguments)
}

function patch(details) {
    if (typeof details != 'object') {
        details = { path: details }
    }

    details.method = 'PATCH'
    addRoute(details, arguments)
}

module.exports.get = get
module.exports.post = post
module.exports.put = put
module.exports.delete = del
module.exports.patch = patch
module.exports.matchRoute = matchRoute
module.exports.parseRoute = parseRoute
module.exports.route = addRoute
module.exports.routes = routes
module.exports.loadController = loadController
module.exports.loadControllers = loadControllers
module.exports.use = use
module.exports.start = () => {
    event.get('server.request').listen(async (req, res) => {
        let found = matchRoute(req.url, req.method)
        if (found) {
            req.variables = found.variables
            event.get('server.request.routed').fire(req, res, found)

            if (found.route.callbacks.length == 1) {
                found.route.callbacks[0](req, res)
            } else {
                let i = -1
                await next()
                
                async function next() {
                    i++
                    if (found.route.callbacks[i]) {
                        await found.route.callbacks[i](req, res, next)
                    }
                }
            }

            event.get('server.request.done').fire(req, res)
        } else {
            event.get('server.request.notfound').fire(req, res)
            res.error({
                code: 404,
                message: '404 Not Found'
            })
        }
    }, 999)
}