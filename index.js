const glob = require('glob')
const {fork} = require('child_process')

const keys = require('./key.json').keys.map(key => ({key: key}))

let files = [{file: '', size: ''}]

glob('*.(png|jpg|jpeg)', (err, _files) => {
    files = _files.map(file => {
        return {
            file: '',
            size: ''
        }
    })
})

let childCount = 4

const uploaders = Array.apply(null, Array(childCount)).map(_ => {
    return fork('./uploader.js')
})

let processedCount = 0

uploaders.forEach(uploader => {
    if (files[processedCount]) {
        uploader.run(files[processedCount], findKey(keys))
        processedCount += 1

        uploader.on('end', (res) => {
            // 如果还有文件
            if (files[processedCount]) {
                // 找到有效的key
                uploader.run(files[processedCount], findKey(keys))
                processedCount += 1
            }
        })

        uploader.on('out', (key) => {
            // 标记key无效
            key.invalid = true
        })
    }
})

function findKey(keys) {
    for (let key of keys) {
        if (!key.invalid) {
            return key
        }
    }
}
