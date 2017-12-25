const tinify = require('tinify')
const fs = require('fs')


// file: {file, index}
// key: {key, index}
// config: {proxy, limit, keepFile}
function compress(file, key, config) {

    tinify.key = key.key.key

    if (config.proxy) {
        tinify.proxy = config.proxy
    }

    fs.readFile(file.file, function(err, sourceData) {
        if (err) throw err
        tinify.fromBuffer(sourceData).toBuffer(function(err, resultData) {
            if (err) throw err

            // 如果key额度用光了
            // uprocess.send({type: 'out', value: {file, key}})
            // return

            // 如果出错了
            // process.send({type: 'error', value: {file, key}})

            // 压缩超过20%
            const rate = (file.size - resultData.byteLength) / file.size
            if (rate > config.limit) {

                let compressedName
                if (config.keep) {
                    compressedName = file.file.replace(/(.+)(\.[^\.]+)$/i, (match, p1, p2) => {
                        return p1 + '-tinified' + p2
                    })
                } else {
                    compressedName = file.file
                }

                fs.writeFile(compressedName, resultData, 'binary', function(err) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log(`compress success, ${file.file}  compress ratio ${(rate * 100).toFixed(1)}%`)
                        process.send({type: 'end', value: {file, key}})
                    }
                })
            } else {
                console.log(`ignore ${file.file}  compress repeat`)
                process.send({type: 'end', value: {file, key}})
            }
        })
    })

}

process.on('message', (data) => {
    compress(data.file, data.key, data.config)
})
