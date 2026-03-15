const cache = require('../utils/cache')
const { formatCurrency, joinSelections } = require('../utils/formatter')
const { STORAGE_KEYS } = require('../constants/index')
const { getAppInstance } = require('./cloudService')

/**
 * 同步购物车到全局与本地缓存。
 * @param {Array} cartItems - 最新购物车列表。
 */
function syncCartItems(cartItems) {
  const app = getAppInstance()

  if (app && typeof app.setCart === 'function') {
    app.setCart(cartItems)
    return
  }

  cache.setStorage(STORAGE_KEYS.CART, cartItems)
}

/**
 * 获取购物车条目。
 * @returns {Array} 购物车数组。
 */
function getCartItems() {
  const app = getAppInstance()

  if (app && Array.isArray(app.globalData.cartItems)) {
    return JSON.parse(JSON.stringify(app.globalData.cartItems))
  }

  return JSON.parse(JSON.stringify(cache.getStorage(STORAGE_KEYS.CART, [])))
}

/**
 * 生成购物车条目唯一键。
 * @param {string} dishId - 菜品 ID。
 * @param {Array} selections - 已选规格。
 * @returns {string} 唯一键。
 */
function buildCartKey(dishId, selections) {
  const selectionText = (selections || [])
    .map((item) => `${item.groupName}-${item.optionLabel}`)
    .join('|')

  return `${dishId}__${selectionText || 'default'}`
}

/**
 * 获取购物车汇总数据。
 * @param {Array} items - 购物车数组。
 * @returns {{totalCount:number,totalPrice:number,totalPriceText:string}} 汇总结果。
 */
function getCartSummary(items) {
  const summary = (items || []).reduce(
    (accumulator, item) => {
      accumulator.totalCount += item.quantity
      accumulator.totalPrice += item.price * item.quantity
      return accumulator
    },
    {
      totalCount: 0,
      totalPrice: 0
    }
  )

  summary.totalPriceText = formatCurrency(summary.totalPrice)
  return summary
}

/**
 * 添加菜品到购物车。
 * @param {Object} dish - 菜品信息。
 * @param {Array} selections - 已选规格。
 * @param {number} quantity - 数量。
 * @returns {Array} 最新购物车。
 */
function addCartItem(dish, selections, quantity) {
  const cartItems = getCartItems()
  const safeQuantity = quantity || 1
  const cartKey = buildCartKey(dish._id, selections)
  const existed = cartItems.find((item) => item.itemKey === cartKey)
  const extraPrice = (selections || []).reduce((sum, item) => {
    return sum + Number(item.delta || 0)
  }, 0)
  const unitPrice = Number(dish.price) + extraPrice

  if (existed) {
    existed.quantity += safeQuantity
  } else {
    cartItems.unshift({
      itemKey: cartKey,
      dishId: dish._id,
      name: dish.name,
      image: dish.image,
      quantity: safeQuantity,
      price: unitPrice,
      priceText: formatCurrency(unitPrice),
      selections: selections || [],
      selectionText: joinSelections(selections)
    })
  }

  syncCartItems(cartItems)
  return cartItems
}

/**
 * 更新购物车商品数量。
 * @param {string} itemKey - 条目 key。
 * @param {number} delta - 变化量。
 * @returns {Array} 最新购物车。
 */
function updateCartCount(itemKey, delta) {
  const cartItems = getCartItems()
  const target = cartItems.find((item) => item.itemKey === itemKey)

  if (!target) {
    return cartItems
  }

  target.quantity += delta
  const nextItems = cartItems.filter((item) => item.quantity > 0)
  syncCartItems(nextItems)
  return nextItems
}

/**
 * 删除指定购物车条目。
 * @param {string} itemKey - 条目 key。
 * @returns {Array} 最新购物车。
 */
function removeCartItem(itemKey) {
  const nextItems = getCartItems().filter((item) => item.itemKey !== itemKey)
  syncCartItems(nextItems)
  return nextItems
}

/**
 * 清空购物车。
 */
function clearCartItems() {
  syncCartItems([])
}

module.exports = {
  getCartItems,
  buildCartKey,
  getCartSummary,
  addCartItem,
  updateCartCount,
  removeCartItem,
  clearCartItems
}
