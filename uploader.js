const tinify = require('tinify')
const fs = require('fs')
const sharp = require('sharp')


// file: {file, index}
// key: {key, index}
// config: {proxy, limit, keepFile}
function compress(file, key, config, processTimes = 1) {

    tinify.key = key.key

    if (config.proxy) {
        tinify.proxy = config.proxy
    }

    fs.readFile(file.file, async function(err, sourceData) {
        if (err) throw err
        console.log(`resize start, ${file.file}`)

        const _buffer = await sharp(sourceData)
            .resize(1600, 1600, {fit: 'inside'})
            .toBuffer()

        console.log(`compress start, ${file.file}`)
        tinify.fromBuffer(_buffer).toBuffer(function(err, resultData) {
            if (err) {
                // 如果key不正确
                if (err.status === 401) {
                    process.send({type: 'out', value: {file, key}})
                } else if (err.status === 429) {    // 如果key次数用完了
                    process.send({type: 'out', value: {file, key}})
                } else {    // 未知错误
                    process.send({type: 'unknown', value: {file, key}}, processTimes)
                }

                // 如果其他网络错误
                console.log('err:', err.status, err.message)
                return
            }

            // 压缩超过20%
            const rate = (file.size - resultData.byteLength) / file.size
            const compressedName = file.file.replace(/(.+)(\.[^\.]+)$/i, (match, p1, p2) => {
                return p1 + '-tinified' + p2
            })

            if (rate > config.limit) {
                fs.writeFile(compressedName, resultData, 'binary', function(err) {
                    if (err) {
                        console.log(err)
                    } else {
                        if (!config.keep) {
                            fs.unlink(file.file, err => {
                                if (err) {
                                    console.log(err)
                                }
                            })
                        }

                        console.log(`compress success, ${file.file}  compress ratio ${(rate * 100).toFixed(1)}%`)
                        process.send({type: 'end', value: {file, key}})
                    }
                })
            } else {
                fs.rename(file.file, compressedName, err => {
                    if (err) {
                        console.log(err)
                    }
                    console.log(`ignore ${file.file}  compress repeat`)
                    process.send({type: 'end', value: {file, key}})
                })
            }
        })
    })
}

process.on('message', (data) => {
    compress(data.file, data.key, data.config)
})
