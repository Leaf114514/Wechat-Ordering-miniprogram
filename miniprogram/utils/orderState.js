const {
  ORDER_STATUS,
  ORDER_FLOW,
  USER_ROLE,
  ORDER_STATUS_TEXT
} = require('../constants/index')

const STATUS_META = {
  pending_payment: {
    text: ORDER_STATUS_TEXT.pending_payment,
    color: '#ff5c3c',
    background: '#fff1ec'
  },
  preparing: {
    text: ORDER_STATUS_TEXT.preparing,
    color: '#ff9800',
    background: '#fff6dd'
  },
  completed: {
    text: ORDER_STATUS_TEXT.completed,
    color: '#3aa76d',
    background: '#eefaf3'
  },
  cancelled: {
    text: ORDER_STATUS_TEXT.cancelled,
    color: '#9e9e9e',
    background: '#f2f2f2'
  }
}

/**
 * 获取订单状态展示信息。
 * @param {string} status - 订单状态。
 * @returns {{text:string,color:string,background:string}} 展示信息。
 */
function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META[ORDER_STATUS.PENDING_PAYMENT]
}

/**
 * 判断订单状态是否允许流转。
 * @param {string} currentStatus - 当前状态。
 * @param {string} nextStatus - 目标状态。
 * @returns {boolean} 是否允许。
 */
function canTransit(currentStatus, nextStatus) {
  return (ORDER_FLOW[currentStatus] || []).indexOf(nextStatus) > -1
}

/**
 * 将页面动作映射为实际目标状态。
 * 部分动作是交互语义，例如 pay 和 again，不直接等于订单状态。
 * @param {string} actionKey - 页面动作 key。
 * @returns {string} 目标订单状态。
 */
function resolveActionStatus(actionKey) {
  const actionMap = {
    pay: ORDER_STATUS.PREPARING,
    preparing: ORDER_STATUS.PREPARING,
    completed: ORDER_STATUS.COMPLETED,
    cancelled: ORDER_STATUS.CANCELLED
  }

  return actionMap[actionKey] || actionKey
}

/**
 * 构建订单操作按钮。
 * @param {Object} order - 订单对象。
 * @param {string} role - 用户角色。
 * @returns {Array} 可执行操作。
 */
function buildOrderActions(order, role) {
  const actions = []

  if (role === USER_ROLE.ADMIN) {
    if (order.status === ORDER_STATUS.PENDING_PAYMENT) {
      actions.push({ key: 'preparing', text: '开始制作' })
      actions.push({ key: 'cancelled', text: '取消订单', danger: true })
    }

    if (order.status === ORDER_STATUS.PREPARING) {
      actions.push({ key: 'completed', text: '完成出餐' })
      actions.push({ key: 'cancelled', text: '取消订单', danger: true })
    }

    return actions
  }

  if (order.status === ORDER_STATUS.PENDING_PAYMENT) {
    actions.push({ key: 'pay', text: '立即支付' })
    actions.push({ key: 'cancelled', text: '取消订单', danger: true })
  }

  if (order.status === ORDER_STATUS.COMPLETED) {
    actions.push({ key: 'again', text: '再来一单' })
  }

  return actions
}

module.exports = {
  getStatusMeta,
  canTransit,
  resolveActionStatus,
  buildOrderActions
}
