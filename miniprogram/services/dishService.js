const config = require('../config/index')
const { CATEGORY_LIST } = require('../constants/index')
const { formatCurrency } = require('../utils/formatter')
const cloudService = require('./cloudService')
const mockStore = require('./mockStore')

/**
 * 标准化菜品展示字段。
 * @param {Object} dish - 原始菜品对象。
 * @returns {Object} 标准化结果。
 */
function normalizeDish(dish) {
  return Object.assign({}, dish, {
    priceText: formatCurrency(dish.price),
    originPriceText: dish.originPrice
      ? formatCurrency(dish.originPrice)
      : ''
  })
}

/**
 * 获取完整菜品列表。
 * @param {boolean} includeUnavailable - 是否包含下架菜品。
 * @returns {Promise<Array>} 菜品数组。
 */
async function getAllDishes(includeUnavailable) {
  if (cloudService.shouldUseMock()) {
    const dishes = mockStore.getMockDishes()
    const filtered = includeUnavailable
      ? dishes
      : dishes.filter((item) => item.isAvailable)
    return filtered.map(normalizeDish)
  }

  try {
    const db = cloudService.getDatabase()
    let query = db.collection('dishes')

    if (!includeUnavailable) {
      query = query.where({ isAvailable: true })
    }

    const result = await query.orderBy('sales', 'desc').get()
    return (result.data || []).map(normalizeDish)
  } catch (error) {
    console.error('[菜品读取失败]', error)
    throw error
  }
}

/**
 * 获取菜品分类。
 * @returns {Promise<Array>} 分类数组。
 */
async function getCategoryList() {
  const dishes = await getAllDishes(true)
  const categorySet = dishes.reduce((accumulator, dish) => {
    accumulator.add(dish.category)
    return accumulator
  }, new Set(CATEGORY_LIST.filter((item) => item !== '全部')))

  return ['全部'].concat(Array.from(categorySet))
}

/**
 * 获取菜品列表。
 * @param {string} category - 分类名称。
 * @returns {Promise<Array>} 菜品数组。
 */
async function getDishesByCategory(category) {
  try {
    const dishes = await getAllDishes(false)
    if (!category || category === '全部') {
      return dishes
    }

    return dishes.filter((item) => item.category === category)
  } catch (err) {
    console.error('[菜品获取失败]', err)
    throw err
  }
}

/**
 * 获取首页瀑布流数据。
 * @param {Object} params - 查询参数。
 * @param {string} params.category - 分类名称。
 * @param {number} params.pageNo - 页码。
 * @param {number} params.pageSize - 每页条数。
 * @returns {Promise<{list:Array,hasMore:boolean}>} 分页结果。
 */
async function getHomeFeed(params) {
  const options = params || {}
  const category = options.category || '全部'
  const pageNo = options.pageNo || 1
  const pageSize = options.pageSize || config.pageSize
  const dishes = await getDishesByCategory(category)
  const start = (pageNo - 1) * pageSize
  const list = dishes.slice(start, start + pageSize)

  return {
    list,
    hasMore: start + pageSize < dishes.length
  }
}

/**
 * 根据 ID 获取菜品详情。
 * @param {string} dishId - 菜品 ID。
 * @returns {Promise<Object|null>} 菜品对象。
 */
async function getDishById(dishId) {
  const dishes = await getAllDishes(true)
  return dishes.find((item) => item._id === dishId) || null
}

module.exports = {
  getAllDishes,
  getCategoryList,
  getDishesByCategory,
  getHomeFeed,
  getDishById
}
