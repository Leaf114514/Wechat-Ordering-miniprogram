const cloudService = require('./cloudService')
const mockStore = require('./mockStore')
const { formatCurrency } = require('../utils/formatter')

/**
 * 获取管理员仪表盘数据。
 * @returns {Promise<Object>} 仪表盘结果。
 */
async function getDashboard() {
  if (!cloudService.shouldUseMock()) {
    const result = await cloudService.callCloudFunction('adminDashboard', {})
    if (result.result.code !== 0) {
      throw new Error(result.result.message || '统计数据获取失败')
    }
    return result.result.data
  }

  const dishes = mockStore.getMockDishes()
  const orders = mockStore.getMockOrders()
  const validOrders = orders.filter((item) => item.status !== 'cancelled')
  const totalRevenue = validOrders.reduce((sum, item) => {
    return sum + item.totalPrice
  }, 0)
  const pendingCount = orders.filter((item) => {
    return item.status === 'pending_payment' || item.status === 'preparing'
  }).length
  const topDishes = dishes
    .slice()
    .sort((left, right) => right.sales - left.sales)
    .slice(0, 5)

  return {
    totalOrders: orders.length,
    totalRevenue,
    totalRevenueText: formatCurrency(totalRevenue),
    pendingCount,
    availableDishCount: dishes.filter((item) => item.isAvailable).length,
    topDishes
  }
}

/**
 * 保存菜品。
 * @param {Object} payload - 菜品表单。
 * @returns {Promise<Object>} 保存结果。
 */
async function saveDish(payload) {
  if (!cloudService.shouldUseMock()) {
    const result = await cloudService.callCloudFunction('manageDish', {
      action: 'save',
      payload
    })

    if (result.result.code !== 0) {
      throw new Error(result.result.message || '保存菜品失败')
    }

    return result.result.data
  }

  const dishes = mockStore.getMockDishes()
  const now = Date.now()
  const existing = dishes.find((item) => item._id === payload._id)

  if (existing) {
    Object.assign(existing, {
      name: payload.name,
      category: payload.category,
      price: Number(payload.price),
      stock: Number(payload.stock),
      description: payload.description,
      image: payload.image || existing.image,
      isAvailable: payload.isAvailable !== false,
      isManualRecommend: Boolean(payload.isManualRecommend),
      updatedAt: now
    })
    mockStore.saveMockDishes(dishes)
    return existing
  }

  const dish = {
    _id: `dish-${now}`,
    name: payload.name,
    category: payload.category,
    price: Number(payload.price),
    originPrice: Number(payload.price),
    sales: 0,
    stock: Number(payload.stock),
    rating: 4.8,
    image: payload.image || '/assets/dishes/dish-6.png',
    description: payload.description,
    tags: ['新品'],
    isAvailable: true,
    isManualRecommend: Boolean(payload.isManualRecommend),
    specs: payload.specs || [
      {
        name: '规格',
        required: true,
        options: [{ label: '标准', delta: 0 }]
      }
    ],
    createdAt: now,
    updatedAt: now
  }

  dishes.unshift(dish)
  mockStore.saveMockDishes(dishes)
  return dish
}

/**
 * 切换菜品上下架状态。
 * @param {string} dishId - 菜品 ID。
 * @param {boolean} isAvailable - 是否上架。
 * @returns {Promise<Object>} 菜品结果。
 */
async function toggleDishStatus(dishId, isAvailable) {
  if (!cloudService.shouldUseMock()) {
    const result = await cloudService.callCloudFunction('manageDish', {
      action: 'toggle',
      payload: {
        dishId,
        isAvailable
      }
    })

    if (result.result.code !== 0) {
      throw new Error(result.result.message || '更新菜品状态失败')
    }

    return result.result.data
  }

  const dishes = mockStore.getMockDishes()
  const target = dishes.find((item) => item._id === dishId)
  if (!target) {
    throw new Error('菜品不存在')
  }

  target.isAvailable = isAvailable
  target.updatedAt = Date.now()
  mockStore.saveMockDishes(dishes)
  return target
}

/**
 * 设置首页自定义推荐菜品。
 * @param {string} dishId - 菜品 ID。
 * @param {boolean} isManualRecommend - 是否推荐。
 * @returns {Promise<Object>} 更新后的菜品。
 */
async function setManualRecommend(dishId, isManualRecommend) {
  if (!cloudService.shouldUseMock()) {
    const result = await cloudService.callCloudFunction('manageDish', {
      action: 'recommend',
      payload: {
        dishId,
        isManualRecommend
      }
    })

    if (result.result.code !== 0) {
      throw new Error(result.result.message || '推荐配置更新失败')
    }

    return result.result.data
  }

  const dishes = mockStore.getMockDishes()
  const target = dishes.find((item) => item._id === dishId)
  if (!target) {
    throw new Error('菜品不存在')
  }

  target.isManualRecommend = isManualRecommend
  target.updatedAt = Date.now()
  mockStore.saveMockDishes(dishes)
  return target
}

module.exports = {
  getDashboard,
  saveDish,
  toggleDishStatus,
  setManualRecommend
}
