const cache = require('../utils/cache')
const { clonePlainData } = require('../utils/formatter')
const { STORAGE_KEYS } = require('../constants/index')
const { mockDishes } = require('../mock/dishes')
const { mockOrders } = require('../mock/orders')
const { mockUsers, demoUser } = require('../mock/users')

/**
 * 确保本地 Mock 数据完成初始化。
 */
function ensureMockSeeds() {
  if (!cache.getStorage(STORAGE_KEYS.DISHES, null)) {
    cache.setStorage(STORAGE_KEYS.DISHES, clonePlainData(mockDishes))
  }

  if (!cache.getStorage(STORAGE_KEYS.ORDERS, null)) {
    cache.setStorage(STORAGE_KEYS.ORDERS, clonePlainData(mockOrders))
  }

  if (!cache.getStorage(STORAGE_KEYS.USERS, null)) {
    cache.setStorage(STORAGE_KEYS.USERS, clonePlainData(mockUsers))
  }

  if (!cache.getStorage(STORAGE_KEYS.CURRENT_USER, null)) {
    cache.setStorage(STORAGE_KEYS.CURRENT_USER, clonePlainData(demoUser))
  }

  if (!cache.getStorage(STORAGE_KEYS.ORDER_TOKENS, null)) {
    cache.setStorage(STORAGE_KEYS.ORDER_TOKENS, {})
  }
}

/**
 * 获取 Mock 菜品列表。
 * @returns {Array} 菜品数据。
 */
function getMockDishes() {
  ensureMockSeeds()
  return clonePlainData(cache.getStorage(STORAGE_KEYS.DISHES, []))
}

/**
 * 保存 Mock 菜品列表。
 * @param {Array} dishes - 菜品数组。
 */
function saveMockDishes(dishes) {
  cache.setStorage(STORAGE_KEYS.DISHES, clonePlainData(dishes))
}

/**
 * 获取 Mock 订单列表。
 * @returns {Array} 订单数据。
 */
function getMockOrders() {
  ensureMockSeeds()
  return clonePlainData(cache.getStorage(STORAGE_KEYS.ORDERS, []))
}

/**
 * 保存 Mock 订单列表。
 * @param {Array} orders - 订单数组。
 */
function saveMockOrders(orders) {
  cache.setStorage(STORAGE_KEYS.ORDERS, clonePlainData(orders))
}

/**
 * 获取 Mock 用户列表。
 * @returns {Array} 用户数据。
 */
function getMockUsers() {
  ensureMockSeeds()
  return clonePlainData(cache.getStorage(STORAGE_KEYS.USERS, []))
}

/**
 * 保存 Mock 用户列表。
 * @param {Array} users - 用户数组。
 */
function saveMockUsers(users) {
  cache.setStorage(STORAGE_KEYS.USERS, clonePlainData(users))
}

/**
 * 获取当前 Mock 用户。
 * @returns {Object|null} 用户对象。
 */
function getCurrentMockUser() {
  ensureMockSeeds()
  return clonePlainData(cache.getStorage(STORAGE_KEYS.CURRENT_USER, null))
}

module.exports = {
  ensureMockSeeds,
  getMockDishes,
  saveMockDishes,
  getMockOrders,
  saveMockOrders,
  getMockUsers,
  saveMockUsers,
  getCurrentMockUser
}
