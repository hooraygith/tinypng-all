const glob = require('glob')
const {fork} = require('child_process')

const readdir = require('./readdir.js')
const keys = require('./key.json').keys.map(key => ({key: key}))

let files
(async () => {
    files = await readdir('img', {
        match: /\.(png|jpe?g)$/i,
        exclude: ['node_modules']
    })
})()

const childCount = require('os').cpus().length

const uploaders = Array.apply(null, Array(childCount)).map(_ => {
    return fork('./uploader.js')
})

let processedCount = 0

uploaders.forEach(uploader => {
    if (files[processedCount]) {
        const file = {
            file: files[processedCount],
            index: processedCount
        }
        uploader.send({file, findKey(keys)})
        processedCount += 1

        uploader.on('message', val => {
            // 结束，分配下一个
            if (val.type === 'end') {
                // 如果还有文件
                if (files[processedCount]) {
                    const file = {
                        file: files[processedCount],
                        index: processedCount
                    }
                    uploader.send({file, findKey(keys)})
                    processedCount += 1
                }
            }
            // key额度用光，换下一个key，重试
            if (val.type === 'out') {
                const keyIndex = val.value.key.index
                keys[keyIndex].invalid = true

            }
            // 请求出错，重试
            if (val.type === 'error') {

            }
        })
    }
})

function findKey(keys) {
    for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        if (!key.invalid) {
            return {
                key,
                index
            }
        }
    }
}
