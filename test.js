const glob = require('glob-all')

glob('./img/**', (err, _files) => {
    console.log(_files)
})