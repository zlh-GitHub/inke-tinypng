#! /usr/bin/env node
const {
  singleFileCompress,
  batchFileCompress,
  updateConfig,
} = require('./helper');
const config = require('./config.json');
const {
  NUM_REG,
  UPDATE_CONFIG_TYPE,
} = require('./constants');
const { program } = require("commander"); // 命令行工具

program.version('1.0.1', '-v, -version');

program.addHelpText('beforeAll', `
  inke-tinypng 参考借鉴了知乎专栏文章《原来TinyPNG可以这样玩!》原文链接：https://zhuanlan.zhihu.com/p/152317953；该作者也有开发相应的npm包：super-tinypng
  super-tinypng 参考借鉴了思否文章《nodejs全自动使用Tinypng（免费版，无需任何配置）压缩图片》原文链接：https://segmentfault.com/a/1190000015467084，相应的npm包为thank-tinypng
`);
// program.addHelpText('afterAll', 'done');

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
  .option('-ms, --minSize <size>', '多少kb以上的才进行压缩，后跟文件大小，如-s 500')
  .option('-r, --retain', '是否保留原文件，即导出文件名和源文件一致')
  .option('-o, --output <path>', '输出到一个新的文件夹，后跟文件夹名，如-o output')
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
  .description(`设置最小文件大小，单位KB，需为整数，并且小于${config.maxSize}KB，该配置和dir -ms作用一致，只有执行dir时，该配置才会生效，命令行的权重大于config`)
  .argument('<minSize>', '基路径')
  .action(minSize => {
    if (!NUM_REG.test(minSize)) {
      console.error('请输入数字')
      return;
    } else if (minSize > config.maxSize) {
      console.error(`请输入小于${config.maxSize}的整数`);
      return;
    }
    updateConfig({
      key: 'minSize',
      value: Number(minSize),
      type: UPDATE_CONFIG_TYPE.UPDATE,
    })
  })

program
  .command('config.clear.minSize')
  .description('清除设置的最小文件大小')
  .action(() => updateConfig({
    key: 'minSize',
    type: UPDATE_CONFIG_TYPE.DELETE,
  }))

program
  .command('config')
  .description('获取配置')
  .action(() => console.log(config))

program.parse(process.argv); // 该行代码必须放在program配置下面
