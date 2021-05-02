
// 遍历文件夹
// path: ./file/to/path
// config: {match: /reg/, exclude: /reg/ || ['node_modules', 'dist']}

const fs = require('fs')
const path = require('path')
const {promisify} = require('util')

const fsReaddir = promisify(fs.readdir)
const fsStat = promisify(fs.stat)


async function readFiles(dir, config={}) {
    if (!dir) {
        throw 'dir is required'
    }
    const type = obj => Object.prototype.toString.call(obj)
    if (config.match && !['[object RegExp]', '[object Function]'].includes(type(config.match))) {
        throw 'config.match must be RegExp or Function'
    }
    if (
        config.exclude &&
        (typeof(config.exclude) !== '[object RegExp]') &&
        !Array.isArray(config.exclude)
    ) {
        throw 'config.exclude must be RegExp or Array'
    }
    const match = config.match
    const exclude = config.exclude
    const excludeIsArray = Array.isArray(exclude)

    const files = []

    async function read(dir) {
        const items = await fsReaddir(dir)
        await Promise.all(items.map(async item => {
            const fullPath = path.join(dir, item)
            const stat = await fsStat(fullPath)
            if (stat && stat.isDirectory()) {
                if (excludeIsArray && !exclude.includes(item)) {
                    return await read(fullPath)
                }
                if (!excludeIsArray && !exclude.test(item)) {
                    return await read(fullPath)
                }
            } else {
                if (type(match) === '[object Function]') {
                    const result = match(item)
                    if (result) {
                        files.push({
                            name: item,
                            fullname: fullPath,
                            size: stat.size
                        })
                    }
                } else if (match.test(item)) {
                    files.push({
                        name: item,
                        fullname: fullPath,
                        size: stat.size
                    })
                }
            }
        }))
        return files
    }

    return await read(dir)
}


module.exports = (dir, config) => readFiles(dir, config)
