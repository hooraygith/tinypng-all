const glob = require('glob')
const {fork} = require('child_process')

const keys = require('./key.json').key

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

let validKey = 0

const uploaders = Array.apply(null, Array(childCount)).map(_ => {
    return fork('./uploader.js')
})

let processedCount = 0

uploaders.forEach(uploader => {
    if (files[processedCount]) {

        // 找到有效的key

        uploader.run(files[processedCount], kyes[validKey].key)
        processedCount += 1

        uploader.on('end', (res) => {
            // 如果还有文件
            if (files[processedCount]) {

                // 找到有效的key
                uploader.run(files[processedCount], kyes[validKey].key)
                processedCount += 1
            }
        })

        uploader.on('out', () => {
            // 标记key无效
            kyes[validKey].invalid = true
        })
    }
})
