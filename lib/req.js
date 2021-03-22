const http = require('http')
const formidable = require('formidable')
const event = require('./event')

http.IncomingMessage.prototype.body = function() {
    return new Promise((resolve, reject) => {
        let form = new formidable.IncomingForm()

        form.parse(this, (err, fields, files) => {
            if (err) {
                event.get('server.request.cancelled').fire(err)
                reject(err)
                return
            }
            Object.assign(this.variables, fields, files)
            resolve()
        })
    })
}