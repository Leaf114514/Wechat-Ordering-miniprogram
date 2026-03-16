const {
  ORDER_STATUS,
  USER_ROLE,
  STORAGE_KEYS
} = require('../constants/index')
const {
  formatCurrency,
  formatTimestamp,
  joinSelections
} = require('../utils/formatter')
const {
  createSubmitGuard,
  createIdempotencyToken
} = require('../utils/guard')
const {
  buildOrderActions,
  canTransit,
  resolveActionStatus
} = require('../utils/orderState')
const { payment } = require('../utils/wechat/index')
const cloudService = require('./cloudService')
const mockStore = require('./mockStore')
const userService = require('./userService')
const cache = require('../utils/cache')

const submitGuard = createSubmitGuard(2000)

/**
 * 构建用于校验库存的菜品映射。
 * @param {Array} dishes - 菜品列表。
 * @returns {Object} 菜品映射。
 */
function buildDishMap(dishes) {
  return dishes.reduce((accumulator, dish) => {
    accumulator[dish._id] = dish
    return accumulator
  }, {})
}

/**
 * 校验购物车条目。
 * @param {Array} cartItems - 购物车条目。
 */
function validateCartItems(cartItems) {
  if (!Array.isArray(cartItems) || !cartItems.length) {
    throw new Error('购物车为空，请先选择菜品')
  }
}

/**
 * 校验购物车库存与上下架状态。
 * @param {Array} cartItems - 购物车条目。
 * @param {Object} dishMap - 菜品映射。
 */
function assertCartStock(cartItems, dishMap) {
  cartItems.forEach((item) => {
    const dish = dishMap[item.dishId]
    if (!dish || !dish.isAvailable) {
      throw new Error(`${item.name} 已下架，请刷新菜单后重试`)
    }

    if (Number(dish.stock || 0) < Number(item.quantity || 0)) {
      throw new Error(`${item.name} 库存不足，请调整数量后重试`)
    }
  })
}

/**
 * 统一格式化订单视图信息。
 * @param {Object} order - 原始订单。
 * @param {string} role - 当前角色。
 * @returns {Object} 展示订单。
 */
function decorateOrder(order, role) {
  const items = (order.items || []).map((item) => {
    return Object.assign({}, item, {
      priceText: formatCurrency(item.price),
      selectionText: joinSelections(item.selections || [])
    })
  })
  const itemCount = items.reduce((sum, item) => {
    return sum + Number(item.quantity || 0)
  }, 0)

  return Object.assign({}, order, {
    items,
    totalPriceText: formatCurrency(order.totalPrice),
    createdAtText: formatTimestamp(order.createdAt),
    remarkText: order.remark || '无备注',
    itemCount,
    actions: buildOrderActions(order, role)
  })
}

/**
 * 获取指定订单。
 * @param {string} orderId - 订单 ID。
 * @returns {Object|null} 订单对象。
 */
function getMockOrderById(orderId) {
  const orders = mockStore.getMockOrders()
  return orders.find((item) => item._id === orderId) || null
}

/**
 * 查询订单列表。
 * @param {Object} params - 查询参数。
 * @returns {Promise<Array>} 订单数组。
 */
async function getOrders(params) {
  const options = params || {}
  const status = options.status || 'all'
  const role = options.role || USER_ROLE.CUSTOMER
  const userId = options.userId

  if (role !== USER_ROLE.ADMIN && !userId) {
    return []
  }

  if (cloudService.shouldUseMock()) {
    let orders = mockStore.getMockOrders()
    if (role !== USER_ROLE.ADMIN) {
      orders = orders.filter((item) => item.userId === userId)
    }
    if (status !== 'all') {
      orders = orders.filter((item) => item.status === status)
    }

    return orders
      .sort((left, right) => right.createdAt - left.createdAt)
      .map((item) => decorateOrder(item, role))
  }

  try {
    const db = cloudService.getDatabase()
    const where = {}
    if (role !== USER_ROLE.ADMIN) {
      where.userId = userId
    }
    if (status !== 'all') {
      where.status = status
    }

    const result = await db
      .collection('orders')
      .where(where)
      .orderBy('createdAt', 'desc')
      .get()

    return (result.data || []).map((item) => decorateOrder(item, role))
  } catch (error) {
    console.error('[订单列表读取失败]', error)
    throw error
  }
}

/**
 * 在 Mock 模式下创建订单。
 * @param {Object} payload - 下单参数。
 * @returns {Promise<Object>} 新订单。
 */
async function placeMockOrder(payload) {
  const user = userService.getCachedUser()
  const dishes = mockStore.getMockDishes()
  const orders = mockStore.getMockOrders()
  const orderTokens = cache.getStorage(STORAGE_KEYS.ORDER_TOKENS, {})
  const token = payload.idempotencyToken

  if (!user) {
    throw new Error('请先登录后再下单')
  }

  if (orderTokens[token]) {
    const existed = orders.find((item) => item._id === orderTokens[token])
    return decorateOrder(existed, USER_ROLE.CUSTOMER)
  }

  const dishMap = buildDishMap(dishes)
  assertCartStock(payload.cartItems, dishMap)

  const now = Date.now()
  const orderId = `order-${now}`

  payload.cartItems.forEach((item) => {
    const dish = dishMap[item.dishId]
    dish.stock -= item.quantity
    dish.sales += item.quantity
  })

  const order = {
    _id: orderId,
    userId: user._id,
    status: ORDER_STATUS.PENDING_PAYMENT,
    totalPrice: Number(payload.totalPrice),
    remark: (payload.remark || '').trim(),
    createdAt: now,
    updatedAt: now,
    stockRollbacked: false,
    dedupToken: token,
    statusTimeline: {
      pending_payment: now
    },
    items: payload.cartItems.map((item) => ({
      itemKey: item.itemKey,
      dishId: item.dishId,
      name: item.name,
      image: item.image,
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
      selections: item.selections || []
    }))
  }

  orders.unshift(order)
  orderTokens[token] = orderId
  mockStore.saveMockDishes(dishes)
  mockStore.saveMockOrders(orders)
  cache.setStorage(STORAGE_KEYS.ORDER_TOKENS, orderTokens)
  userService.updateUserMetrics(order)

  return decorateOrder(order, USER_ROLE.CUSTOMER)
}

/**
 * 提交订单。
 * @param {Object} payload - 下单参数。
 * @returns {Promise<Object>} 订单结果。
 */
async function placeOrder(payload) {
  const currentUser = userService.getCachedUser()
  if (!currentUser) {
    throw new Error('请先登录后再下单')
  }

  validateCartItems(payload.cartItems)

  const idempotencyToken = payload.idempotencyToken ||
    createIdempotencyToken(currentUser._id)
  const guardKey = `place-order-${currentUser._id}`

  if (!submitGuard.canRun(guardKey)) {
    throw new Error('请勿重复提交订单')
  }

  try {
    if (cloudService.shouldUseMock()) {
      return await placeMockOrder(
        Object.assign({}, payload, { idempotencyToken })
      )
    }

    const result = await cloudService.callCloudFunction('placeOrder', {
      userId: currentUser._id,
      cartItems: payload.cartItems,
      remark: (payload.remark || '').trim(),
      idempotencyToken
    })

    if (result.result.code !== 0) {
      throw new Error(result.result.message || '下单失败')
    }

    return decorateOrder(result.result.data, USER_ROLE.CUSTOMER)
  } finally {
    setTimeout(() => {
      submitGuard.release(guardKey)
    }, 400)
  }
}

/**
 * 在 Mock 模式下更新订单状态。
 * @param {string} orderId - 订单 ID。
 * @param {string} nextStatus - 目标状态。
 * @returns {Object} 更新后的订单。
 */
function updateMockOrderStatus(orderId, nextStatus) {
  const currentUser = userService.getCachedUser()
  const orders = mockStore.getMockOrders()
  const dishes = mockStore.getMockDishes()
  const dishMap = buildDishMap(dishes)
  const order = orders.find((item) => item._id === orderId)

  if (!currentUser) {
    throw new Error('请先登录后再操作订单')
  }

  if (!order) {
    throw new Error('订单不存在')
  }

  if (!canTransit(order.status, nextStatus)) {
    throw new Error('当前状态不允许执行该操作')
  }

  if (
    currentUser.role !== USER_ROLE.ADMIN &&
    order.userId !== currentUser._id
  ) {
    throw new Error('无权操作该订单')
  }

  order.status = nextStatus
  order.updatedAt = Date.now()
  order.statusTimeline[nextStatus] = order.updatedAt

  if (nextStatus === ORDER_STATUS.CANCELLED && !order.stockRollbacked) {
    order.items.forEach((item) => {
      const dish = dishMap[item.dishId]
      if (dish) {
        dish.stock += item.quantity
        dish.sales = Math.max(0, dish.sales - item.quantity)
      }
    })
    order.stockRollbacked = true
    mockStore.saveMockDishes(dishes)
  }

  mockStore.saveMockOrders(orders)
  return decorateOrder(order, currentUser.role)
}

/**
 * 更新订单状态。
 * @param {Object} payload - 更新参数。
 * @returns {Promise<Object>} 更新后的订单。
 */
async function updateOrderStatus(payload) {
  const currentUser = userService.getCachedUser()
  if (!currentUser) {
    throw new Error('请先登录后再操作订单')
  }

  const nextStatus = resolveActionStatus(payload.nextStatus)

  if (cloudService.shouldUseMock()) {
    return updateMockOrderStatus(payload.orderId, nextStatus)
  }

  const result = await cloudService.callCloudFunction('updateOrderStatus', {
    orderId: payload.orderId,
    nextStatus,
    operatorRole: currentUser.role,
    userId: currentUser._id
  })

  if (result.result.code !== 0) {
    throw new Error(result.result.message || '状态更新失败')
  }

  return decorateOrder(result.result.data, currentUser.role)
}

/**
 * 发起支付。
 * 当前版本优先保证闭环可运行，因此真实环境未接入商户参数时自动走 mock 支付流程。
 * @param {string} orderId - 订单 ID。
 * @returns {Promise<Object>} 支付后的订单。
 */
async function payOrder(orderId) {
  const order = cloudService.shouldUseMock()
    ? getMockOrderById(orderId)
    : null

  if (order && order.status !== ORDER_STATUS.PENDING_PAYMENT) {
    throw new Error('当前订单不需要支付')
  }

  await payment.requestPayment({
    mock: true
  })

  return updateOrderStatus({
    orderId,
    nextStatus: 'pay'
  })
}

/**
 * 将历史订单转换为购物车条目，供“再来一单”使用。
 * @param {Object} order - 历史订单。
 * @returns {Array} 购物车条目数组。
 */
function buildCartItemsFromOrder(order) {
  return (order.items || []).map((item) => ({
    itemKey: item.itemKey,
    dishId: item.dishId,
    name: item.name,
    image: item.image,
    quantity: Number(item.quantity || 1),
    price: Number(item.price || 0),
    priceText: formatCurrency(item.price),
    selections: item.selections || [],
    selectionText: joinSelections(item.selections || [])
  }))
}

/**
 * 获取用户订单统计。
 * @param {string} userId - 用户 ID。
 * @returns {Promise<Object>} 统计结果。
 */
async function getOrderMetrics(userId) {
  if (!userId) {
    return {
      totalOrders: 0,
      totalAmount: 0,
      pending_payment: 0,
      preparing: 0,
      completed: 0,
      cancelled: 0,
      totalAmountText: '0.00'
    }
  }

  const orders = await getOrders({ userId, role: USER_ROLE.CUSTOMER })
  const metrics = orders.reduce(
    (accumulator, order) => {
      accumulator.totalOrders += 1
      accumulator.totalAmount += Number(order.totalPrice || 0)
      accumulator[order.status] = (accumulator[order.status] || 0) + 1
      return accumulator
    },
    {
      totalOrders: 0,
      totalAmount: 0,
      pending_payment: 0,
      preparing: 0,
      completed: 0,
      cancelled: 0
    }
  )

  metrics.totalAmountText = formatCurrency(metrics.totalAmount)
  return metrics
}

module.exports = {
  getOrders,
  placeOrder,
  updateOrderStatus,
  payOrder,
  buildCartItemsFromOrder,
  getOrderMetrics
}
