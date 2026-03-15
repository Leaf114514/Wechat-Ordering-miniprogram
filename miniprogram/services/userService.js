const cache = require('../utils/cache')
const cloudService = require('./cloudService')
const mockStore = require('./mockStore')
const { STORAGE_KEYS } = require('../constants/index')

/**
 * 设置当前用户到全局状态。
 * @param {Object} user - 用户对象。
 */
function updateCurrentUserState(user) {
  const app = cloudService.getAppInstance()

  if (app && typeof app.setCurrentUser === 'function') {
    app.setCurrentUser(user)
    return
  }

  cache.setStorage(STORAGE_KEYS.CURRENT_USER, user)
}

/**
 * 获取当前用户。
 * @returns {Promise<Object>} 用户对象。
 */
async function ensureCurrentUser() {
  if (cloudService.shouldUseMock()) {
    mockStore.ensureMockSeeds()
    const user = mockStore.getCurrentMockUser()
    updateCurrentUserState(user)
    return user
  }

  try {
    const result = await cloudService.callCloudFunction('loginUser', {})
    if (result.result.code !== 0) {
      throw new Error(result.result.message || '用户初始化失败')
    }
    const user = result.result.data
    updateCurrentUserState(user)
    return user
  } catch (error) {
    console.error('[用户初始化失败]', error)
    throw error
  }
}

/**
 * 获取当前用户缓存。
 * @returns {Object|null} 用户对象。
 */
function getCachedUser() {
  const app = cloudService.getAppInstance()
  if (app && app.globalData.currentUser) {
    return JSON.parse(JSON.stringify(app.globalData.currentUser))
  }

  return cache.getStorage(STORAGE_KEYS.CURRENT_USER, null)
}

/**
 * 切换演示角色。
 * @param {string} role - 目标角色。
 * @returns {Promise<Object>} 更新后的用户对象。
 */
async function switchMockRole(role) {
  mockStore.ensureMockSeeds()
  const users = mockStore.getMockUsers()
  const nextUser = users.find((item) => item.role === role) || users[0]
  updateCurrentUserState(nextUser)
  return nextUser
}

/**
 * 在下单后更新用户统计。
 * @param {Object} order - 订单对象。
 */
function updateUserMetrics(order) {
  if (!cloudService.shouldUseMock()) {
    return
  }

  const users = mockStore.getMockUsers()
  const currentUser = getCachedUser()
  const target = users.find((item) => item._id === currentUser._id)

  if (!target) {
    return
  }

  target.orderCount += 1
  target.totalSpend += order.totalPrice
  target.lastLoginAt = Date.now()
  mockStore.saveMockUsers(users)
  updateCurrentUserState(target)
}

module.exports = {
  ensureCurrentUser,
  getCachedUser,
  switchMockRole,
  updateUserMetrics
}
