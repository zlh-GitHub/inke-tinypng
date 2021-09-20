const {
  maxSize,
  exts,
  maxRetryCount
} = require('./config');
const path = require('path');
const { default: PQueue } = require("p-queue"); // 并发控制的异步执行队列
const axios = require('axios');
const cliProgress = require("cli-progress"); // 进度条
const ora = require("ora"); // 主要用来实现nodejs命令行环境的loading效果，和显示各种状态的图标等
const {
  mkdirSync,
  existsSync,
  createWriteStream,
  readFileSync,
  readdirSync,
  statSync,
} = require('fs');
const promiseRetry = require('promise-retry');

const root = process.cwd(); // 当前node.js进程执行时的工作目录

/**
 * 随机IP地址
 * @returns {String} 
 */
const getRandomIP = () => Array.from(Array(4)).map(() => parseInt(Math.random() * 255)).join('.');

/**
 * KB转字节
 * @param {Number} kb 
 * @returns 
 */
const kb2byte = kb => kb * 1024;

/**
 * 过滤文件格式，返回所有jpg,jpeg,png图片
 * @param {String[]} filenameArr 
 */
const fileFilter = (filenameArr, size = 0, deep) => {
  return filenameArr.reduce((res, filename) => {
    const stats = statSync(filename);
    if (
      stats.size <= maxSize &&
      stats.size >= kb2byte(size) &&
      stats.isFile() &&
      exts.includes(path.extname(filename).slice(1))
    ) {
      return [...res, filename];
    } else if (stats.isDirectory() && deep) {
      return [...res, ...fileFilter(getFileList(filename), size, deep)];
    }
    return res;
  }, []);
};

/**
 * 获取文件列表
 * @param {String} folder 
 */
const getFileList = folder => readdirSync(folder).map(file => path.join(folder, file))

/**
 * 获取请求配置
 * @param {String} IP 
 * @returns {Object}
 */
const getAjaxOptions = IP => ({
  method: 'POST',
  url: 'https://tinypng.com/web/shrink',
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

const getPathFromWorkspace = p => path.resolve(root, p);

/**
 * 从path中获取图片名
 * @param {String} path
 * @returns 
 */
const getImageName = path => path.replace(/^.*[\\\/]/, "");

/**
 * 生成输出文件名
 * @param {String} filename 
 * @returns 
 */
const getTinyImageName = filename => {
  const reg = new RegExp(`(\\w+)(?=\\.(${exts.join('|')})$)`);
  return filename.replace(reg, old => `${old}.tiny`)
}

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
    stream.on("end", resolve);
    stream.on("error", reject);
  });
};

/**
 * 下载图片到指定目录
 * @param {String} url 在线图片地址 
 * @param {String} dir 保存图片的文件夹路径
 * @param {String} imageName 保存的文件名
 * @param {Function} retry 保存失败时执行的函数
 */
const download = async (url, dir, imageName) => {
  try {
    const outputPath = `${dir}/${imageName}`;
    // if (existsSync(absoultPath)) {
    //   return Promise.resolve("");
    // }
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
  } catch (error) {
    // console.log(`[${imageName}]：下载失败，请尝试手动下载`)
  }
};

/**
 * 
 * @param {String} img 图片路径 
 * @param {Object} options 选项
 * @param {Boolean} options.retain 是否保留原文件
 * @returns 
 */
const singleFileCompress = (img, { retain }) =>
  promiseRetry(async (retry, number) => {
    if (number > 1) {
      // console.log(`[${img}]：压缩失败！第${number}次尝试压缩图片${img}`);
    }
    try {
      const options = getAjaxOptions(getRandomIP());
      const { data } = await axios({
        ...options,
        data: readFileSync(img)
      });
      if (data.error) {
        retry();
        return;
      }
      // console.log(`[${img}]：压缩成功，图片地址为：${data.output.url}，开始下载图片`);
      const absoultPath = getPathFromWorkspace(img);
      // await download(data.output.url, {
      //   absoultPath: retain ? getTinyImageName(absoultPath) : absoultPath,
      // });
      const { dir, name } = splitDirAndName(img);
      download(
        data.output.url,
        dir,
        retain ? getTinyImageName(name) : name,
      );
    } catch (error) {
      // console.log(`[${img}]：压缩失败！`);
      number < maxRetryCount && retry();
    }
  })

const queue = new PQueue({
  concurrency: 20,
  autoStart: false,
  timeout: 5000,
})

/**
 * 批量图片压缩
 * @param {String} path 文件夹
 * @param {Object} options 选项
 * @param {Boolean} options.deep 是否深度遍历文件夹
 * @param {String} options.size 多少kb以上才进行压缩
 * @param {Boolean} options.retain 是否保留原文件
 * @param {String} options.output 输出路径
 * @param {String} options.loglevel 日志级别
 */
const batchFileCompress = (path, options) => {
  const progressBar = new cliProgress.SingleBar(
    {
      stopOnComplete: true,
      clearOnComplete: true,
    },
    cliProgress.Presets.shades_classic
  );
  const { size, deep, retain, output } = options;
  const fileList = getFileList(path);
  const fileterList = fileFilter(fileList, size, deep);
  fileterList.forEach(file => {
    queue.add(() => singleFileCompress(file, {
      output,
      retain
    }));
  })
  queue.on("next", () => {
    progressBar.increment(1);
  });
  queue.start();
  progressBar.start(queue.size, 0);
  queue.onIdle().then(progressBar.stop);
}

module.exports = {
  singleFileCompress,
  batchFileCompress
}