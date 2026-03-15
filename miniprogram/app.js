const cache = require('./utils/cache')
const config = require('./config/index')
const { STORAGE_KEYS } = require('./constants/index')
const mockStore = require('./services/mockStore')

/**
 * 初始化云开发能力。
 * @returns {boolean} 是否初始化成功。
 */
function initCloud() {
  if (!wx.cloud || !config.cloudEnvId) {
    return false
  }

  try {
    wx.cloud.init({
      env: config.cloudEnvId,
      traceUser: true
    })
    return true
  } catch (error) {
    console.error('[云开发初始化失败]', error)
    return false
  }
}

App({
  /**
   * 小程序启动时执行初始化。
   */
  onLaunch() {
    const cloudReady = initCloud()
    const useMockData = config.useMockData || !cloudReady

    this.globalData = {
      cloudReady,
      useMockData,
      cartItems: cache.getStorage(STORAGE_KEYS.CART, []),
      currentUser: cache.getStorage(STORAGE_KEYS.CURRENT_USER, null),
      restaurantProfile: config.restaurantProfile,
      cloudEnvId: config.cloudEnvId
    }

    if (useMockData) {
      mockStore.ensureMockSeeds()
      this.globalData.currentUser = cache.getStorage(
        STORAGE_KEYS.CURRENT_USER,
        null
      )
    }
  },

  /**
   * 更新购物车全局状态并持久化。
   * @param {Array} cartItems - 最新购物车列表。
   */
  setCart(cartItems) {
    this.globalData.cartItems = cartItems
    cache.setStorage(STORAGE_KEYS.CART, cartItems)
  },

  /**
   * 更新当前用户并持久化。
   * @param {Object} user - 用户对象。
   */
  setCurrentUser(user) {
    this.globalData.currentUser = user
    cache.setStorage(STORAGE_KEYS.CURRENT_USER, user)
  }
})
