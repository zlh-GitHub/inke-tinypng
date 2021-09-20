module.exports = {
  /**
   * 文件类型
   */
  exts: ['jpg', 'jpeg', 'png'],
  /**
   * 文件大小限制
   */
  maxSize: 5 * 1024 * 1024, 
  /**
   * 最多一次行压缩多少张图片
   */
  compressConcurrency: 10,
  /**
   * 最多同时下载多少张图片
   */
  downloadConcurrency: 10,
  maxRetryCount: 5,
  ipCacheFielName: 'ipCache.txt',
};
