const tinify = require('tinify')


const fs = require('fs')

function compress(file, key) {
    tinify.key = keys

    fs.readFile(file, function(err, sourceData) {
        if (err) throw err
        tinify.fromBuffer(sourceData).toBuffer(function(err, resultData) {
            if (err) throw err

            // 如果key额度用光了
            uploader.emit('out')
            return

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
    run(file, key) {
        compress(file, key)
    }
}

module.exports = uploader
