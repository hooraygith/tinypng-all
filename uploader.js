const tinify = require('tinify')
const key = require('./key.json')
tinify.key = key.key
const fs = require('fs')

const file = ''

fs.readFile(file, function(err, sourceData) {
    if (err) throw err
    tinify.fromBuffer(sourceData).toBuffer(function(err, resultData) {
        if (err) throw err
    })
})



