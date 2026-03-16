const cloudService = require('./cloudService')
const mockStore = require('./mockStore')
const { formatCurrency } = require('../utils/formatter')

/**
 * 构建默认规格，保证新增菜品在不配置复杂规格时也可直接下单。
 * @returns {Array} 默认规格数组。
 */
function buildDefaultSpecs() {
  return [
    {
      name: '规格',
      required: true,
      options: [{ label: '标准', delta: 0 }]
    }
  ]
}

/**
 * 规范化菜品表单，避免页面层承担数据清洗职责。
 * @param {Object} payload - 菜品表单。
 * @returns {Object} 标准化后的菜品数据。
 */
function normalizeDishPayload(payload) {
  return {
    _id: payload._id || '',
    name: String(payload.name || '').trim(),
    category: String(payload.category || '').trim(),
    price: Number(payload.price || 0),
    stock: Number(payload.stock || 0),
    description: String(payload.description || '').trim(),
    image: payload.image || '/assets/dishes/dish-6.png',
    isAvailable: payload.isAvailable !== false,
    isManualRecommend: Boolean(payload.isManualRecommend),
    specs: Array.isArray(payload.specs) && payload.specs.length
      ? payload.specs
      : buildDefaultSpecs()
  }
}

/**
 * 校验菜品表单。
 * @param {Object} payload - 菜品表单。
 */
function validateDishPayload(payload) {
  if (!payload.name) {
    throw new Error('请填写菜品名称')
  }

  if (!payload.category) {
    throw new Error('请选择菜品分类')
  }

  if (payload.price <= 0) {
    throw new Error('菜品价格必须大于 0')
  }

  if (payload.stock < 0) {
    throw new Error('库存不能小于 0')
  }
}

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
    return sum + Number(item.totalPrice || 0)
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
  const normalizedPayload = normalizeDishPayload(payload)
  validateDishPayload(normalizedPayload)

  if (!cloudService.shouldUseMock()) {
    const result = await cloudService.callCloudFunction('manageDish', {
      action: 'save',
      payload: normalizedPayload
    })

    if (result.result.code !== 0) {
      throw new Error(result.result.message || '保存菜品失败')
    }

    return result.result.data
  }

  const dishes = mockStore.getMockDishes()
  const now = Date.now()
  const existing = dishes.find((item) => item._id === normalizedPayload._id)

  if (existing) {
    Object.assign(existing, {
      name: normalizedPayload.name,
      category: normalizedPayload.category,
      price: normalizedPayload.price,
      stock: normalizedPayload.stock,
      description: normalizedPayload.description,
      image: normalizedPayload.image || existing.image,
      isAvailable: normalizedPayload.isAvailable,
      isManualRecommend: normalizedPayload.isManualRecommend,
      specs: normalizedPayload.specs,
      updatedAt: now
    })
    mockStore.saveMockDishes(dishes)
    return existing
  }

  const dish = {
    _id: `dish-${now}`,
    name: normalizedPayload.name,
    category: normalizedPayload.category,
    price: normalizedPayload.price,
    originPrice: normalizedPayload.price,
    sales: 0,
    stock: normalizedPayload.stock,
    rating: 4.8,
    image: normalizedPayload.image,
    description: normalizedPayload.description,
    tags: ['新品'],
    isAvailable: normalizedPayload.isAvailable,
    isManualRecommend: normalizedPayload.isManualRecommend,
    specs: normalizedPayload.specs,
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
