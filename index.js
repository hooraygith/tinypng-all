#!/usr/bin/env node

/*
 * 参数：
 * --parallel 4 进程数，默认是cpu线程数
 * --limit 0.2 重复压缩的阈值，压缩率低于这个值时判断为重复压缩，默认0.2
 * --proxy http://127.0.0.1:1080 代理地址
 * --keep true 保留原文件flag，默认会替换原文件
 * --exclude build,bin 排除的文件夹名字
 * --key  key1,key2  api key
 */

const {fork} = require('child_process')
const _argv = require('yargs')

const readdir = require('./readdir.js')


const argv = _argv
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
        desc: 'proxy, support all common protocol, like http and socks5'
    })
    .option('keep', {
        default: false,
        desc: 'weather keep the original image'
    })
    .option('exclude', {
        default: '',
        desc: 'directories excluded, "," split'
    })
    .option('key', {
        default: '',
        desc: 'the api key of tinypng.com, "," split'
    })
    .argv

let exclude = ['node_modules', 'dist']
if (argv.exclude) {
    exclude = exclude.concat(argv.exclude.split(','))
}
let keys = require('./key.js').keys.map(key => ({key: key}))
if (argv.key) {
    keys = argv.key.split(',')
}

;(async () => {

    let files = await readdir(argv._[0], {
        match: file => {
            const re1 = /\.(png|jpe?g)$/i
            const re2 = /-tinified\.(png|jpe?g)$/i
            if (re1.test(file) && !re2.test(file)) {
                return true
            }
        },
        exclude
    })

    console.log('待处理图片数量：' + files.length)

    if (files.length < argv.parallel) {
        argv.parallel = files.length
    }

    const uploaders = Array(argv.parallel).fill('').map(_ => {
        return fork(__dirname + '/uploader.js')
    })

    let processedCount = 0

    uploaders.forEach(uploader => {
        if (files.length) {
            const file = findFile(files)
            if (file) {
                files[file.index].padding = true
                uploader.send({file, key: findKey(keys), config: argv})
            }

            uploader.on('message', val => {
                // 结束，分配下一个文件
                if (val.type === 'end') {
                    const fileIndex = val.value.file.index
                    const key = val.value.key
                    files[fileIndex].resolved = true

                    const file = findFile(files)
                    if (file) {
                        files[file.index].padding = true
                        uploader.send({file, key, config: argv})
                    } else {
                        uploader.kill()
                    }
                }
                // key额度用光，换下一个key，重试
                if (val.type === 'out') {
                    const keyIndex = val.value.key.index
                    const fileIndex = val.value.file.index
                    const file = val.value.file
                    keys[keyIndex].invalid = true
                    files[fileIndex].padding = false

                    const key = findKey(keys)
                    if (file && key) {
                        console.log('key 无效，换下一个：', key.key)
                        files[file.index].padding = true
                        uploader.send({file, key, config: argv})
                    } else {
                        uploader.kill()
                    }
                }

                // 未知错误，重试
                if (val.type === 'unknown') {
                    const keyIndex = val.value.key.index
                    const fileIndex = val.value.file.index
                    uploaders.erorTimes = uploaders.erorTimes ? uploaders.erorTimes + 1 : 0
                    files[fileIndex].padding = false

                    // 如果压缩同一个文件，错误次数超过3次，忽略他
                    const processTimes = val.processTimes
                    if (processTimes > 3) {
                        console.log('同一个文件错误超过3次', key.key)

                        // 换下一个文件
                        const file = findFile(files)
                        const key = val.value.key
                        if (file && key) {
                            files[file.index].padding = true
                            uploader.send({file, key, config: argv})
                        } else {
                            uploader.kill()
                        }
                    } else {
                        // 累计未知错误超过10次，杀死全部
                        if (uploaders.erorTimes > 10) {
                            uploaders.forEach(uploader => uploader.kill())
                        } else {
                            files[fileIndex].padding = true
                            
                            const file = val.value.file
                            const key = val.value.key
                            uploader.send({file, key, config: argv, processTimes: processTimes + 1})
                        }
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
                key: key.key,
                index
            }
        }
    }
}
