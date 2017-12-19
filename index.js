const glob = require('glob')
const {fork} = require('child_process')

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

        uploader.run(files[processedCount])
        processedCount += 1

        uploader.on('end' => {
            if (files[processedCount]) {
                uploader.run(files[processedCount])
                processedCount += 1
            }
        })
    }
})
