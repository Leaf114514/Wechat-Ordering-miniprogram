const orderService = require('../../services/orderService')
const userService = require('../../services/userService')
const { USER_ROLE } = require('../../constants/index')
const { feedback, navigation } = require('../../utils/wechat')

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
   * 页面初次加载时同步订单数据。
   */
  async onLoad() {
    await this.syncPageData()
  },

  /**
   * 页面显示时重新拉取最新订单。
   */
  async onShow() {
    await this.syncPageData()
  },

  /**
   * 同步页面登录状态和订单列表。
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
   * 按当前筛选条件获取订单列表。
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
      feedback.showError(error.message || '订单读取失败')
    }
  },

  /**
   * 切换订单筛选条件。
   * @param {Object} event - 点击事件对象。
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
   * 处理订单动作，例如再次下单、取消订单、确认完成等。
   * @param {Object} event - 订单操作事件对象。
   */
  async handleOrderAction(event) {
    const orderId = event.currentTarget.dataset.orderId
    const action = event.currentTarget.dataset.action

    if (action === 'again') {
      navigation.switchTab('/pages/order/index')
      return
    }

    try {
      await feedback.withLoading('正在处理', () => {
        return orderService.updateOrderStatus({
          orderId,
          nextStatus: action
        })
      })
      feedback.showSuccess('订单状态已更新')
      await this.loadOrders()
    } catch (error) {
      feedback.showError(error.message || '状态更新失败')
    }
  },

  /**
   * 跳转到个人中心 tab。
   */
  goUserTab() {
    navigation.switchTab('/pages/user/index')
  },

  /**
   * 返回点餐 tab。
   */
  goOrderTab() {
    navigation.switchTab('/pages/order/index')
  }
})
