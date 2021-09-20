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
// })

const fs = require('fs');
const path = require('path');
const ipCachePath = path.resolve(__dirname, 'ipCache.txt');
const isToday = date => new Date(date).toLocaleDateString() === new Date().toLocaleDateString();
const ipCacheStats = fs.statSync(ipCachePath);
let todayAlreadyUseIP = [];
if (isToday(ipCacheStats.mtime)) {
  // 最后修改是当天，拿出里面的数据
  todayAlreadyUseIP = fs.readFileSync(path.resolve(__dirname, 'ipCache.txt'), {
    encoding: 'utf-8',
  }).split('\n');
} else {
  // 删除里面的数据
  fs.writeFileSync(ipCachePath, '')
}


let currentIP = '';
let currentIPUseNums = 0;

const getRandomIP = () => {
  const randomIP = Array.from(Array(4)).map(() => parseInt(Math.random() * 255)).join('.');
  if (todayAlreadyUseIP.includes(randomIP)) {
    return getRandomIP();
  }
}

/**
 * 生成随机IP，如果ipCache中存在，并且该IP使用未超过20次，则直接返回，否则新生成一个
 * @returns {String} IP
 */
const getIP = () => {
  if (!currentIP || (currentIP && currentIPUseNums >= 20)) {
    currentIP = Array.from(Array(4)).map(() => parseInt(Math.random() * 255)).join('.');
    currentIPUseNums = 0;
  }
  currentIPUseNums ++;
  return currentIP;
}
