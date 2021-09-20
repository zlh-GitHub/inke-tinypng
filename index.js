#! /usr/bin/env node
const {
  singleFileCompress,
  batchFileCompress,
} = require('./helper');
const { program } = require("commander"); // 命令行工具

program.version('1.0.0', '-v, -version');

program.addHelpText('beforeAll', 'inke tinypng');
program.addHelpText('afterAll', 'done');

program
  .command('img')
  .description('压缩单张图片')
  .argument('<path>', '文件路径')
  .option('-r, --retain', '是否保留原文件，即导出文件名和源文件一致')
  .option('-l, --loglevel <level>', '日志级别，可选：info ｜ warn ｜ error')
  .action(singleFileCompress)

program
  .command('dir')
  .description('压缩文件夹里面的文件')
  .argument('<path>', '文件夹路径')
  .option('-d, --deep', '是否深度遍历文件夹')
  .option('-s, --size <size>', '多少kb以上的才进行压缩，后跟文件大小，如-s=500')
  .option('-r, --retain', '是否保留原文件，即导出文件名和源文件一致')
  .option('-o, --output <path>', '输出到一个新的文件夹，后跟文件夹路径，如-o=./public/output')
  .option('-l, --loglevel <level>', '日志级别，可选：info ｜ warn ｜ error')
  .action(batchFileCompress)

program.parse(process.argv); // 该行代码必须放在program配置下面
