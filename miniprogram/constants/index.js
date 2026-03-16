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

const USER_ROLE_TEXT = {
  customer: '普通用户',
  admin: '管理员'
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
  '招牌热饭',
  '轻食能量',
  '暖胃汤面',
  '甜品饮品'
]

const PAGE_ROUTES = {
  HOME: '/pages/home/index',
  ORDER: '/pages/order/index',
  USER: '/pages/user/index',
  ORDERS: '/pages/orders/index',
  ADMIN: '/pages/admin/index'
}

const DEFAULT_AVATAR_URL = '/images/icons/avatar.png'

module.exports = {
  STORAGE_KEYS,
  USER_ROLE,
  USER_ROLE_TEXT,
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  ORDER_FLOW,
  CATEGORY_LIST,
  PAGE_ROUTES,
  DEFAULT_AVATAR_URL
}
