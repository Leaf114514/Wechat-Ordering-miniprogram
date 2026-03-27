const { storage } = require('./wechat/index')

/**
 * 向后兼容的缓存工具出口。
 * 业务层继续依赖 cache.js，不需要感知底层微信实现的拆分方式。
 */
module.exports = {
  getStorage: storage.getStorage,
  setStorage: storage.setStorage,
  removeStorage: storage.removeStorage
}
