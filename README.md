# tinypng-all
Compress the images automatically with tinypng

## Usage:

`npm i tinypng-all -g`

`tn ./path/to/project`


参数:

--parallel: 并发数，默认为cpu线程数

--proxy: 代理地址，支持各种常见的代码，比如 http、socks4、socks5

--limit: 判断重复压缩的阈值，默认为0.2，即压缩率小于0.2就认为是重复压缩，就不会替换掉原文件

--keep: 加上这个参数会保留原图片，压缩的图会自动加文件名 `-tinified`

--exclude: 排除的文件夹，不压缩的文件夹

--key: tinypng api key，多个可以用 ',' 号分隔

