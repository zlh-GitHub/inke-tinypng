const path = require('path');
const { default: PQueue } = require("p-queue"); // 并发控制的异步执行队列
const axios = require('axios');
// const cliProgress = require("cli-progress"); // 进度条
const ora = require("ora"); // 主要用来实现nodejs命令行环境的loading效果，和显示各种状态的图标等
const promiseRetry = require('promise-retry');
const _ = require('lodash');
const {
  UPDATE_CONFIG_TYPE,
} = require('./constants');
const config = require('./config');
const {
  maxSize, // 最大文件大小
  exts, // 文件类型
  maxRetryCount, // 压缩/失败后最多可尝试多少次
  downloadConcurrency, // 最多可并行下载多少张图片
  compressConcurrency, // 最多可并行压缩多少张图片
  configFileName, // 配置文件路径
  basePath, // 基路径
  kb2byteMuti, // kb => byte 转化倍数
} = config;
const {
  mkdirSync,
  existsSync,
  createWriteStream,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} = require('fs');

console.error = str => console.log('\x1b[31m' + str + '\x1b[0m');
console.success = str => console.log('\x1b[32m' + str + '\x1b[0m');
console.warn = str => console.log('\x1b[33m' + str + '\x1b[0m');

const root = process.cwd(); // 当前node.js进程执行时的工作目录

const queue = new PQueue({
  concurrency: compressConcurrency,
  autoStart: false,
  timeout: 5000,
});

/**
 * 此次压缩的数量
 */
let currentCompressCount = 0;
/**
 * 已压缩的数量
 */
let alreadyCompressCount = 0;

/**
 * 
 * 随机IP地址
 * @returns {String} 
 */
const getRandomIP = () => Array.from(Array(4)).map(() => parseInt(Math.random() * 255)).join('.');

/**
 * 获取url/path中的图片名字
 * @param {String} url 
 * @returns 
 */
const getImageName = (url) => url.replace(/^.*[\\\/]/, "");

/**
 * 获取文件列表
 * @param {String} folder 
 */
const getFileList = folder => readdirSync(folder).map(file => path.join(folder, file));

/**
 * KB转字节
 * @param {Number} kb 
 * @returns 
 */
const kb2byte = kb => kb * kb2byteMuti;

/**
 * 返回基于工作区地址的路径
 * @param {String} p 
 * @returns 
 */
const getPathFromWorkspace = p => path.resolve(root, p);

/**
 * 生成输出文件名
 * @param {String} filename 
 * @returns 
 */
const getTinyImageName = filename => {
  const reg = new RegExp(`(.+)(?=\\.(${exts.join('|')})$)`);
  return filename.replace(reg, old => `${old}.tiny`);
}

/**
 * 更新配置文件
 * @param {Object} action 
 * @param {String} key
 * @param {String} value
 * @param {String} type update | delete
 * @returns 
 */
const updateConfig = ({
  key,
  value,
  type,
}) => {
  const configPath = path.join(__dirname, configFileName);
  let config = readFileSync(configPath, {
    encoding: 'utf-8',
  });
  config = JSON.parse(config);
  switch (type) {
    case UPDATE_CONFIG_TYPE.UPDATE:
      config[key] = value;
      break;
    case UPDATE_CONFIG_TYPE.DELETE:
      delete config[key];
      break;
    default:
      console.error(`type应为：${Object.keys(UPDATE_CONFIG_TYPE).join(' | ')}中的一个`);
  }
  config = JSON.stringify(config);
  writeFileSync(configPath, config);
}

const commonFilter = (filename, stats) => (
    stats.size <= kb2byte(maxSize) &&
    stats.isFile() &&
    exts.includes(path.extname(filename).slice(1))
  );

/**
 * 过滤文件格式，返回符合条件的图片
 * @param {Array<String>} filenameArr 
 * @param {Number} minSize KB
 * @param {Boolean} deep 
 * @returns {Array<String>}
 */
const fileFilter = (filenameArr, minSize = 0, deep) => {
  return filenameArr.reduce((res, filename) => {
    const stats = statSync(filename);
    if (
      stats.size >= kb2byte(minSize) &&
      commonFilter(filename, stats)
    ) {
      return [...res, {
        name: filename,
        size: stats.size,
      }];
    } else if (stats.isDirectory() && deep) {
      return [...res, ...fileFilter(getFileList(filename), minSize, deep)];
    }
    return res;
  }, []);
};

/**
 * 获取请求配置
 * @param {String} IP 
 * @returns {Object}
 */
const getAjaxOptions = IP => ({
  method: 'POST',
  url: 'https://tinify.cn/backend/opt/shrink',
  headers: {
    rejectUnauthorized: false,
    "X-Forwarded-For": IP,
    'Postman-Token': Date.now(),
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
  },
});

/**
 * 获取dir和name
 * @param {String} path 
 */
const splitDirAndName = path => {
  const temp = path.split('/');
  return {
    name: temp.pop(),
    dir: temp.join('/') + '/',
  }
}

/**
 * 流控制promise
 * @param {Stream} stream 
 * @returns 
 */
const streamToPromise = (stream) => {
  return new Promise((resolve, reject) => {
    stream.on("end",resolve);
    stream.on("error", reject);
  });
};

/**
 * 下载图片到指定目录
 * @param {String} url 在线图片地址 
 * @param {String} dir 保存图片的文件夹路径
 * @param {String} imageName 保存的文件名
 */
const download = async (url, dir, imageName) => {
  try {
    const outputPath = path.join(dir, imageName);
    const response = await axios({
      method: "get",
      url,
      responseType: "stream",
    });
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true }); // rsecursive是否自动创建多级路径
    }
    const writer = createWriteStream(outputPath);
    response.data.pipe(writer);
    await streamToPromise(writer);
    // console.success(`【${imageName}】：图片下载成功`);
  } catch (error) {
    console.error(`【${imageName}】：下载失败，请尝试手动下载：${url}\n`)
  }
};

const logCompressSuccess = (name, originSize, output) => {
  const optimized = ((1 - output.ratio) * 100).toFixed(2);
  let log = `${currentCompressCount ? `${++alreadyCompressCount}/${currentCompressCount}` : ''}【${name}】：压缩成功，`;
  log += `优化比例: ${optimized}% ，`;
  log += `原始大小: ${(originSize / kb2byteMuti).toFixed(2)}KB ，`;
  log += `压缩大小: ${(output.size / kb2byteMuti).toFixed(2)}KB`;
  console[Number(optimized) === 0 ? 'warn' : 'success'](log);
}

/**
 * 融合配置选项
 * @param {Object} configOptions 
 * @param {Object} options 
 * @returns 
 */
const mergeOptions = (configOptions, options) => _.merge(configOptions, options);

/**
 * 压缩&下载图片
 * @param {Object} image 图片信息
 * @param {String} image.name 图片名字
 * @param {Number} image.size 图片大小
 * @param {Object} options 选项
 * @param {Boolean} options.retain 是否保留原文件
 * @returns 
 */
const fileCompress = ({
  name: filename,
  size: originSize
}, {
  retain,
  output,
}) =>
  promiseRetry(async (retry, number) => {
    const { dir, name } = splitDirAndName(filename);
    if (number > 1) {
      console.error(`【${name}】：压缩失败！第${number}次尝试压缩\n`);
    }
    try {
      const options = getAjaxOptions(getRandomIP());
      const { data } = await axios({
        ...options,
        data: readFileSync(filename)
      });
      console.log(data);
      if (data.error) {
        retry();
        return;
      }
      logCompressSuccess(name, originSize, data.output);
      await download(
        data.output.url,
        output ? path.join(dir, output) : dir,
        retain ? getTinyImageName(name) : name,
      );
    } catch (error) {
      console.log(error, 2);
      number < maxRetryCount && retry();
    }
  })

const singleFileCompress = async (filename, options) => {
  const fullFilename = basePath ? path.join(basePath, filename) : filename;
  if (!existsSync(fullFilename)) {
    console.warn('文件不存在，请确认路径');
    return;
  }
  const stats = statSync(fullFilename);
  if (!commonFilter(filename, stats)) {
    console.warn('文件不满足要求，请确认');
    return;
  }
  // 开启loading
  // const spinner = ora("处理中...\n").start();
  await fileCompress({
    name: fullFilename,
    size: stats.size,
  }, options);
  // spinner.succeed('压缩完成');
}

/**
 * 批量图片压缩
 * @param {String} inputPath 文件夹
 * @param {Object} options 选项
 * @param {Boolean} options.deep 是否深度遍历文件夹
 * @param {String} options.size 多少kb以上才进行压缩
 * @param {Boolean} options.retain 是否保留原文件
 * @param {String} options.output 输出路径
 * @param {String} options.loglevel 日志级别
 */
const batchFileCompress = (inputPath, options) => {
  // 开启loading
  // const progressBar = new cliProgress.SingleBar(
  //   {
  //     stopOnComplete: true,
  //     clearOnComplete: true,
  //   },
  //   cliProgress.Presets.shades_classic
  // );
  // const stats = statSync()
  const { minSize, deep, retain, output } = mergeOptions(config, options);
  const fullPath = basePath ? path.join(basePath, inputPath) : inputPath;
  console.log("本次执行脚本的配置：", {
    exts,
    maxSize,
    minSize,
    deep,
    retain,
    output,
    basePath,
    path: inputPath,
    fullPath,
  });
  if (!existsSync(fullPath)) {
    console.warn(`文件夹不存在，请确认路径：${fullPath}`);
    return;
  }
  const stats = statSync(fullPath);
  if (!stats.isDirectory()) {
    console.warn(`路径${fullPath}指向不是文件夹，请确认`);
    return;
  }
  const fileList = getFileList(fullPath);
  const fileterList = fileFilter(fileList, minSize, deep);
  const count = currentCompressCount = fileterList.length;
  console.log("此次处理文件的数量:", count);
  fileterList.forEach(file => {
    queue.add(() => fileCompress(file, {
      output,
      retain,
    }));
  })
  // queue.on("next", () => {
  //   progressBar.increment(1);
  // });
  // progressBar.start(queue.size, 0);
  queue.start();
  // queue.onIdle().then(() => {
  //   progressBar.stop();
  //   console.success('压缩完成');
  // });
}

module.exports = {
  singleFileCompress,
  batchFileCompress,
  updateConfig,
  UPDATE_CONFIG_TYPE
}