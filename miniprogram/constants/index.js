const STORAGE_KEYS = {
  CART: 'meal-cart-items',
  DISHES: 'meal-dishes',
  ORDERS: 'meal-orders',
  USERS: 'meal-users',
  CURRENT_USER: 'meal-current-user',
  ORDER_TOKENS: 'meal-order-tokens'
}

const USER_ROLE = {
  CUSTOMER: 'customer',
  ADMIN: 'admin'
}

const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PREPARING: 'preparing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

const ORDER_STATUS_TEXT = {
  pending_payment: '待支付',
  preparing: '制作中',
  completed: '已完成',
  cancelled: '已取消'
}

const ORDER_FLOW = {
  pending_payment: ['preparing', 'cancelled'],
  preparing: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
}

const CATEGORY_LIST = [
  '全部',
  '招牌主食',
  '轻食能量',
  '暖胃汤面',
  '甜品饮品'
]

const DEFAULT_AVATAR_URL = '/images/icons/avatar.png'

module.exports = {
  STORAGE_KEYS,
  USER_ROLE,
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  ORDER_FLOW,
  CATEGORY_LIST,
  DEFAULT_AVATAR_URL
}
