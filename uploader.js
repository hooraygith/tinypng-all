const tinify = require('tinify')
const fs = require('fs')


// file: {file, index}
// key: {key, index}
function compress(file, key) {
    tinify.key = key.key.key

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
            if ((file.size - resultData.byteLength) / file.size > 0.2) {

                let compressedName
                if (1) {
                    compressedName = file.file
                } else {
                    compressedName = file.file.replace(/(.+)(\.[^\.]+)$/i, (match, p1, p2) => {
                        return p1 + '-comped' + p2
                    })
                }

                fs.writeFile(compressedName, resultData, 'binary', function(err) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log(`${file.file}  压缩成功`)
                        process.send({type: 'end', value: {file, key}})
                    }
                })
            } else {
                console.log(`${file.file}  重复压缩`)
            }
        })
    })

}

process.on('message', (config) => {
    compress(config.file, config.key)
})
