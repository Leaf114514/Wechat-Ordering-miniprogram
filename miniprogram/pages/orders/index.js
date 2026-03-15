const orderService = require('../../services/orderService')
const userService = require('../../services/userService')
const { USER_ROLE } = require('../../constants/index')

Page({
  data: {
    filterList: [
      { key: 'all', text: '全部' },
      { key: 'pending_payment', text: '待支付' },
      { key: 'preparing', text: '制作中' },
      { key: 'completed', text: '已完成' },
      { key: 'cancelled', text: '已取消' }
    ],
    activeStatus: 'all',
    orderList: [],
    currentUser: null,
    hasLogin: false
  },

  /**
   * 页面加载。
   */
  async onLoad() {
    await this.syncPageData()
  },

  /**
   * 页面展示时刷新数据。
   */
  async onShow() {
    await this.syncPageData()
  },

  /**
   * 同步页面数据。
   */
  async syncPageData() {
    const currentUser = userService.getCachedUser()
    if (!currentUser) {
      this.setData({
        currentUser: null,
        hasLogin: false,
        orderList: []
      })
      return
    }

    this.setData({
      currentUser,
      hasLogin: true
    })
    await this.loadOrders()
  },

  /**
   * 获取订单列表。
   */
  async loadOrders() {
    try {
      const role = this.data.currentUser.role || USER_ROLE.CUSTOMER
      const orderList = await orderService.getOrders({
        status: this.data.activeStatus,
        userId: this.data.currentUser._id,
        role
      })
      this.setData({ orderList })
    } catch (error) {
      wx.showToast({
        title: error.message || '订单读取失败',
        icon: 'none'
      })
    }
  },

  /**
   * 切换订单筛选。
   * @param {Object} event - 事件对象。
   */
  async handleFilterTap(event) {
    this.setData({
      activeStatus: event.currentTarget.dataset.status
    })
    if (this.data.hasLogin) {
      await this.loadOrders()
    }
  },

  /**
   * 处理订单动作。
   * @param {Object} event - 事件对象。
   */
  async handleOrderAction(event) {
    const orderId = event.currentTarget.dataset.orderId
    const action = event.currentTarget.dataset.action

    if (action === 'again') {
      wx.switchTab({ url: '/pages/order/index' })
      return
    }

    wx.showLoading({ title: '正在处理' })
    try {
      await orderService.updateOrderStatus({
        orderId,
        nextStatus: action
      })
      wx.hideLoading()
      wx.showToast({
        title: '订单状态已更新',
        icon: 'success'
      })
      await this.loadOrders()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '状态更新失败',
        icon: 'none'
      })
    }
  },

  /**
   * 去登录页面。
   */
  goUserTab() {
    wx.switchTab({ url: '/pages/user/index' })
  },

  /**
   * 返回点餐页。
   */
  goOrderTab() {
    wx.switchTab({ url: '/pages/order/index' })
  }
})
