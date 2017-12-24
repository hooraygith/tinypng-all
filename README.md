# tinypng-all
Compress the images automatically with tinypng

## Usage:

`npm i tinypng-all -g`

`tna -d ./path/to/project`


参数:

-d: 图片的文件夹位置，可以为项目根目录，会自动过滤node_modules文件夹

--limit: 并发数，默认为cpu线程数

--proxy: 代理地址，支持http代理，不支持socks5

--limit: 判断重复压缩的阈值，默认为0.2，即压缩率小于0.2就认为是重复压缩，就不会替换掉原文件

--keep: 加上这个参数会保留原图片，压缩的图会自动加文件名-tinified

--key: tinypng api key

