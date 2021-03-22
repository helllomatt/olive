const fs = require('fs')
const path = require('path')

let all = {}
const ACTION = {
    STOP: 1
}

class Event {
    constructor(name) {
        all[name] = this
        this.listeners = []
    }

    listen(cb, priority = 0) {
        this.listeners.push({
            callback: cb,
            priority
        })

        this.listeners.sort((a, b) => a.priority > b.priority)
    }

    removeListener(cb) {
        let index = this.listeners.indexOf(cb)

        if (index > -1) {
            this.listeners.splice(index, 1)
        }
    }

    fire() {
        if (this.listeners.length > 0) {
            for (let i = 0; i < this.listeners.length; i++) {
                if (this.listeners[i].callback.apply(this, arguments) === ACTION.STOP) {
                    break
                }
            }
        }
    }
}

function loadSubscriber(subscriberPath) {
    if (fs.existsSync(subscriberPath)) {
        fs.lstat(subscriberPath, (err, stats) => {
            if (err) {
                event.get('server.error').fire(`Failed to get the information for the controller file/folder item '${subscriberPath}'`, err)
                return
            } else {
                if (stats.isDirectory()) {
                    event.get('server.error').fire(`loadSubscriber is for loading a controller file, use loadSubscribers to load a directory`)
                } else {
                    require(subscriberPath)
                }
            }
        })
    } else {
        event.get('server.error').fire(`Failed to load the controller '${subscriberPath}' because it doesn't exist.`)
    }
}

function loadSubscribers(dirPath) {
    if (fs.existsSync(dirPath)) {
        let stats = fs.lstatSync(dirPath)

        if (stats.isDirectory()) {
            let inners = fs.readdirSync(dirPath)

            for (let i = 0; i < inners.length; i++) {
                let subscriberPath = path.join(dirPath, inners[i])
                fs.lstat(subscriberPath, (err, innerStats) => {
                    if (err) {
                        event.get('server.error').fire(`Failed to get the information for the controller file/folder item: ${subscriberPath}`, err)
                        return
                    } else {
                        if (innerStats.isDirectory()) {
                            loadSubscribers(subscriberPath)
                        } else {
                            loadSubscriber(subscriberPath)
                        }
                    }
                })
            }
        } else {
            event.get('server.error').fire(`Cannot load subscribers in directory '${dirPath}' because it isn't a directory.`)
        }
    } else {
        event.get('server.error').fire(`Cannot load subscribers in directory '${dirPath}' because it doesn't exist.`)
    }
}

module.exports = Event
module.exports.ACTION = ACTION
module.exports.all = all
module.exports.loadSubscriber = loadSubscriber
module.exports.loadSubscribers = loadSubscribers
module.exports.get = function(key) {
    if (!all[key]) {
        throw new Error(`Event '${key}' hasn't been instantiated yet.`)
    }

    return all[key]
}