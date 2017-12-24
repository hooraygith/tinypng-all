/*
 * 参数：
 * -d --dir 待压缩图片的文件夹位置
 * --parallel 4 进程数，默认是cpu线程数
 * --limit 0.2 重复压缩的阈值，压缩率低于这个值时判断为重复压缩，默认0.2
 * --proxy http://127.0.0.1:1080 代理地址
 * --keep true 保留原文件flag，默认会替换原文件
 * --exclude build,bin 排除的文件夹名字
 */

const {fork} = require('child_process')
const _argv = require('yargs')

const readdir = require('./readdir.js')
const keys = require('./key.json').keys.map(key => ({key: key}))

const argv = _argv
    .option('dir', {
        alias: 'd',
        default: '',
        desc: 'the images directory'
    })
    .option('parallel', {
        default: require('os').cpus().length,
        desc: 'parallel number, the number of child processes'
    })
    .option('limit', {
        default: 0.2,
        desc: 'the threshold that has been compressed or not'
    })
    .option('proxy', {
        default: '',
        desc: 'proxy, support http but not socks5'
    })
    .option('keep', {
        default: false,
        desc: 'weather keep the original image'
    })
    .option('exclude', {
        default: '',
        desc: 'the directory excluded'
    })
    .argv

const config = {
    dir: argv.d,
    childCount: argv.parallel,
    limit: argv.limit,
    proxy: argv.proxy,
    keepFile: argv.keep,
    exclude: argv.exclude
}


;(async () => {
    let exclude = ['node_modules', 'dist']
    if (config.exclude) {
        exclude = exclude.concat(config.exclude.split(','))
    }
    let files = await readdir(config.dir, {
        match: /\.(png|jpe?g)$/i,
        exclude
    })

    console.log('待处理图片数量：' + files.length)

    if (files.length < config.childCount) {
        config.childCount = files.length
    }

    const uploaders = Array.apply(null, Array(config.childCount)).map(_ => {
        return fork('./uploader.js')
    })

    let processedCount = 0

    uploaders.forEach(uploader => {
        if (files.length) {
            const file = findFile(files)
            if (file) {
                files[file.index].padding = true
                uploader.send({file, key: findKey(keys), config})
            }

            uploader.on('message', val => {
                // 结束，分配下一个
                if (val.type === 'end') {
                    const fileIndex = val.value.file.index
                    files[fileIndex].resolved = true

                    const file = findFile(files)
                    if (file) {
                        files[file.index].padding = true
                        uploader.send({file, key: findKey(keys), config})
                    }

                    // 如果没有可以压缩的了，结束这个进程
                    if (files.every(file => file.resolved || file.padding)) {
                        uploader.kill()
                    }
                }
                // key额度用光，换下一个key，重试
                if (val.type === 'out') {
                    const keyIndex = val.value.key.index
                    const fileIndex = val.value.file.index
                    keys[keyIndex].invalid = true
                    files[fileIndex].padding = false

                    const file = findFile(files)
                    if (file) {
                        files[file.index].padding = true
                        uploader.send({file, key: findKey(keys), config})
                    }
                }
                // 请求出错，重试
                if (val.type === 'error') {
                    const fileIndex = val.value.file.index
                    files[fileIndex].padding = false
                    const file = findFile(files)
                    if (file) {
                        files[file.index].padding = true
                        uploader.send({file, key: findKey(keys), config})
                    }
                }
            })
        }
    })
})()


function findFile(files) {
    for (let index = 0; index < files.length; index++) {
        const item = files[index]
        if (!item.resolved && !item.padding) {
            return {
                file: item.fullname,
                index,
                size: item.size
            }
        }
    }
}

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
