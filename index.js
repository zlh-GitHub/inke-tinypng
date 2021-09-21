#! /usr/bin/env node
const {
  singleFileCompress,
  batchFileCompress,
  updateConfig,
  UPDATE_CONFIG_TYPE,
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
  // .option('-l, --loglevel <level>', '日志级别，可选：info ｜ warn ｜ error')
  .action(singleFileCompress)

program
  .command('dir')
  .description('压缩文件夹里面的文件')
  .argument('<path>', '文件夹路径')
  .option('-d, --deep', '是否深度遍历文件夹')
  .option('-ms, --minSize <size>', '多少kb以上的才进行压缩，后跟文件大小，如-s=500')
  .option('-r, --retain', '是否保留原文件，即导出文件名和源文件一致')
  .option('-o, --output <path>', '输出到一个新的文件夹，后跟文件夹路径，如-o=./public/output')
  // .option('-l, --loglevel <level>', '日志级别，可选：info ｜ warn ｜ error')
  .action(batchFileCompress)

program
  .command('config.set.basePath')
  .description('设置基路径，img ｜ dir 的path将相对于basePath，应为一个文件夹')
  .argument('<basePath>', '基路径')
  .action(basePath => updateConfig({
    key: 'basePath',
    value: basePath,
    type: UPDATE_CONFIG_TYPE.UPDATE,
  }))

program
  .command('config.clear.basePath')
  .description('清除配置的基路径')
  .action(() => updateConfig({
    key: 'basePath',
    type: UPDATE_CONFIG_TYPE.DELETE,
  }))

program
  .command('config.set.minSize')
  .description('设置最小文件大小，单位KB，该配置和dir -ms作用一致，只有执行dir时，该配置才会生效，命令行的权重大于config')
  .argument('<minSize>', '基路径')
  .action(minSize => updateConfig({
    key: 'minSize',
    value: minSize,
    type: UPDATE_CONFIG_TYPE.UPDATE,
  }))

program
  .command('config.clear.minSize')
  .description('清楚设置的最小文件大小')
  .action(() => updateConfig({
    key: 'minSize',
    type: UPDATE_CONFIG_TYPE.DELETE,
  }))

program.parse(process.argv); // 该行代码必须放在program配置下面
