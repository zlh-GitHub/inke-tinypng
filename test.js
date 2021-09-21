// console.error = str => console.log('\033[31m' + str + '\033[0m');
// console.success = str => console.log('\033[32m' + str + '\033[0m');
// console.warn = str => console.log('\033[33m' + str + '\033[0m');

// const promiseRetry = require('promise-retry');

// const doSomething = () => new Promise((resolve, reject) => {
//   setTimeout(() => {
//     Math.random() > 0.8 ? resolve() : reject();
//   }, 1000)
// })

// promiseRetry((retry, number) => {
//   if (number > 1) {
//     console.log(`第${number}次执行doSomething`);
//   }
//   return doSomething().catch(retry);
// }).then(() => console.success('success'))











// const fs = require('fs');
// const path = require('path');
// const ipCachePath = path.resolve(__dirname, 'ipCache.txt');
// const isToday = date => new Date(date).toLocaleDateString() === new Date().toLocaleDateString();
// const ipCacheStats = fs.statSync(ipCachePath);
// let todayAlreadyUseIP = [];
// if (isToday(ipCacheStats.mtime)) {
//   // 最后修改是当天，拿出里面的数据
//   todayAlreadyUseIP = fs.readFileSync(path.resolve(__dirname, 'ipCache.txt'), {
//     encoding: 'utf-8',
//   }).split('\n');
// } else {
//   // 删除里面的数据
//   fs.writeFileSync(ipCachePath, '')
// }


// let currentIP = '';
// let currentIPUseNums = 0;

// const getRandomIP = () => {
//   const randomIP = Array.from(Array(4)).map(() => parseInt(Math.random() * 255)).join('.');
//   if (todayAlreadyUseIP.includes(randomIP)) {
//     return getRandomIP();
//   }
// }

// /**
//  * 生成随机IP，如果ipCache中存在，并且该IP使用未超过20次，则直接返回，否则新生成一个
//  * @returns {String} IP
//  */
// const getIP = () => {
//   if (!currentIP || (currentIP && currentIPUseNums >= 20)) {
//     currentIP = Array.from(Array(4)).map(() => parseInt(Math.random() * 255)).join('.');
//     currentIPUseNums = 0;
//   }
//   currentIPUseNums ++;
//   return currentIP;
// }











// const sleep = () => new Promise(resolve => {
//   // console.log('执行');
//   setTimeout(resolve, Math.random() * 2000 + 1000);
// });


// const { default: PQueue } = require("p-queue"); // 并发控制的异步执行队列
// const cliProgress = require("cli-progress"); // 进度条
// const progressBar = new cliProgress.SingleBar(
//   {
//     stopOnComplete: true,
//     clearOnComplete: true,
//   },
//   cliProgress.Presets.shades_classic
// );
// const queue = new PQueue({
//   concurrency: 20,
//   autoStart: false,
//   timeout: 5000,
// });
// const arr = new Array(50).fill(true);
// arr.forEach(() => {
//   queue.add(sleep);
// })
// queue.on("next", () => {
//   progressBar.increment(1);
// });
// console.log(arr.length, queue.size);
// progressBar.start(queue.size, 0, {
//   // speed: "N/A", 
// });
// queue.start();
// queue.onIdle().then(() => {
//   // progressBar.stop();
//   console.log('转换完成');
// });
















// const cliProgress = require('cli-progress');

// // create new container
// const multibar = new cliProgress.MultiBar({
//     clearOnComplete: false,
//     hideCursor: true

// }, cliProgress.Presets.shades_grey);

// // add bars
// const b1 = multibar.create(200, 0);
// const b2 = multibar.create(1000, 0);

// // control bars
// b1.increment();
// b2.update(20, {filename: "helloworld.txt"});

// // stop all bars
// multibar.stop();











// const fs = require('fs');
// console.log(fs.statSync('./config.json'));


// const productPromise = () => db.collection('product').add







