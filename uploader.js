const tinify = require('tinify')
const fs = require('fs')


// file: {file, index}
// key: {key, index}
function compress(file, key) {
    tinify.key = key.key

    fs.readFile(file.file, function(err, sourceData) {
        if (err) throw err
        tinify.fromBuffer(sourceData).toBuffer(function(err, resultData) {
            if (err) throw err

            // 如果key额度用光了
            // uprocess.send({type: 'out', value: {file, key}})
            // return

            // 如果出错了
            // process.send({type: 'error', value: {file, key}})

            // 压缩超过30%
            if ((file.file.size - resultData.size) / file.file.size > 0.3) {


                // 覆盖文件
                // fs.writeFile('')

                process.send({type: 'end'})
            }
        })
    })

}

process.on('message', (config) => {
    compress(config.file, config.key)
})
