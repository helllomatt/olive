const fs = require('fs')
const path = require('path')

function load(file) {
    if (!file) {
        file = '.env'
    }

    let envpath = path.join(process.cwd(), file)
    if (fs.existsSync(envpath)) {
        let details = fs.readFileSync(envpath, { encoding: 'utf-8' }).split('\n').map(i => i.split('='))

        for (let i = 0; i < details.length; i++) {
            process.env[details[i][0]] = details[i].slice(1).join('=')
        }
    }
}

module.exports = load