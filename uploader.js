const tinify = require('tinify')
const keys = require('./key.json')

const fs = require('fs')

function compress(keyIndex, file) {
    tinify.key = keys[keyIndex]

    fs.readFile(file, function(err, sourceData) {
        if (err) throw err
        tinify.fromBuffer(sourceData).toBuffer(function(err, resultData) {
            if (err) throw err

            // 如果key额度用光了
            compress(keyIndex + 1, file)

            // 压缩超过30%
            if ((file.size - resultData.size) / file.size > 0.3) {

                // 覆盖文件
                fs.writeFile('')

                uploader.emit('end')
            }
        })
    })

}

const uploader = {
    run(file) {
        compress(0, file)
    }
}

module.exports = uploader
