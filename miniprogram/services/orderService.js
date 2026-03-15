const {
  ORDER_STATUS,
  USER_ROLE,
  STORAGE_KEYS
} = require('../constants/index')
const { formatCurrency, formatTimestamp } = require('../utils/formatter')
const { createSubmitGuard, createIdempotencyToken } = require('../utils/guard')
const { buildOrderActions, canTransit } = require('../utils/orderState')
const cloudService = require('./cloudService')
const mockStore = require('./mockStore')
const userService = require('./userService')
const cache = require('../utils/cache')

const submitGuard = createSubmitGuard(2000)

/**
 * 格式化订单视图信息。
 * @param {Object} order - 原始订单。
 * @param {string} role - 当前角色。
 * @returns {Object} 展示订单。
 */
function decorateOrder(order, role) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return Object.assign({}, order, {
    totalPriceText: formatCurrency(order.totalPrice),
    createdAtText: formatTimestamp(order.createdAt),
    itemCount,
    actions: buildOrderActions(order, role)
  })
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

  if (orderTokens[token]) {
    const existed = orders.find((item) => item._id === orderTokens[token])
    return decorateOrder(existed, USER_ROLE.CUSTOMER)
  }

  payload.cartItems.forEach((item) => {
    const dish = dishes.find((dishItem) => dishItem._id === item.dishId)
    if (!dish || dish.stock < item.quantity) {
      throw new Error(`${item.name} 库存不足，请刷新后重试`)
    }
  })

  const now = Date.now()
  const orderId = `order-${now}`
  payload.cartItems.forEach((item) => {
    const dish = dishes.find((dishItem) => dishItem._id === item.dishId)
    dish.stock -= item.quantity
    dish.sales += item.quantity
  })

  const order = {
    _id: orderId,
    userId: user._id,
    status: ORDER_STATUS.PENDING_PAYMENT,
    totalPrice: Number(payload.totalPrice),
    remark: payload.remark || '',
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
      quantity: item.quantity,
      price: item.price,
      selections: item.selections
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
  const idempotencyToken = payload.idempotencyToken ||
    createIdempotencyToken(currentUser && currentUser._id)
  const guardKey = `place-order-${currentUser && currentUser._id}`

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
      remark: payload.remark || '',
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
  const order = orders.find((item) => item._id === orderId)

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
      const dish = dishes.find((dishItem) => dishItem._id === item.dishId)
      if (dish) {
        dish.stock += item.quantity
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

  if (cloudService.shouldUseMock()) {
    return updateMockOrderStatus(payload.orderId, payload.nextStatus)
  }

  const result = await cloudService.callCloudFunction('updateOrderStatus', {
    orderId: payload.orderId,
    nextStatus: payload.nextStatus,
    operatorRole: currentUser.role,
    userId: currentUser._id
  })

  if (result.result.code !== 0) {
    throw new Error(result.result.message || '状态更新失败')
  }

  return decorateOrder(result.result.data, currentUser.role)
}

/**
 * 获取用户订单统计。
 * @param {string} userId - 用户 ID。
 * @returns {Promise<Object>} 统计结果。
 */
async function getOrderMetrics(userId) {
  const orders = await getOrders({ userId, role: USER_ROLE.CUSTOMER })
  const metrics = orders.reduce(
    (accumulator, order) => {
      accumulator.totalOrders += 1
      accumulator.totalAmount += order.totalPrice
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
  getOrderMetrics
}
