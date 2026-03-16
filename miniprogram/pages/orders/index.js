const orderService = require('../../services/orderService')
const cartService = require('../../services/cartService')
const userService = require('../../services/userService')
const { USER_ROLE, PAGE_ROUTES } = require('../../constants/index')
const {
  feedback,
  navigation,
  modal,
  page: pageActions
} = require('../../utils/wechat/index')

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
    hasLogin: false,
    isAdminView: false,
    loading: true,
    errorMessage: ''
  },

  /**
   * 页面首次加载时同步订单数据。
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
   * 订单页支持下拉刷新。
   */
  async onPullDownRefresh() {
    await pageActions.withPullDownRefresh(() => this.syncPageData())
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
        isAdminView: false,
        orderList: [],
        loading: false,
        errorMessage: ''
      })
      return
    }

    this.setData({
      currentUser,
      hasLogin: true,
      isAdminView: currentUser.role === USER_ROLE.ADMIN
    })
    await this.loadOrders()
  },

  /**
   * 按当前筛选条件获取订单列表。
   */
  async loadOrders() {
    this.setData({
      loading: true,
      errorMessage: ''
    })

    try {
      const role = this.data.currentUser.role || USER_ROLE.CUSTOMER
      const orderList = await orderService.getOrders({
        status: this.data.activeStatus,
        userId: this.data.currentUser._id,
        role
      })

      this.setData({ orderList })
    } catch (error) {
      const errorMessage = error.message || '订单读取失败'
      this.setData({
        errorMessage
      })
      feedback.showError(errorMessage)
    } finally {
      this.setData({ loading: false })
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
   * 处理订单动作，包括支付、取消、再来一单与后台流转。
   * @param {Object} event - 订单操作事件对象。
   */
  async handleOrderAction(event) {
    const order = this.data.orderList[
      Number(event.currentTarget.dataset.index)
    ]
    const action = event.currentTarget.dataset.action

    if (!order) {
      return
    }

    if (action === 'again') {
      const cartItems = orderService.buildCartItemsFromOrder(order)
      cartService.restoreCartItems(cartItems)
      feedback.showSuccess('已为你重新加入购物车')
      navigation.switchTab(PAGE_ROUTES.ORDER)
      return
    }

    if (action === 'pay') {
      try {
        await feedback.withLoading('正在发起支付', () => {
          return orderService.payOrder(order._id)
        })
        feedback.showSuccess('支付成功，订单已进入制作中')
        await this.loadOrders()
      } catch (error) {
        feedback.showError(error.message || '支付失败')
      }
      return
    }

    const actionTextMap = {
      cancelled: '取消订单',
      completed: '确认完成',
      preparing: '开始制作'
    }
    const confirmed = await modal.confirm({
      title: actionTextMap[action] || '确认操作',
      content: `确认执行“${actionTextMap[action] || '当前操作'}”吗？`
    })

    if (!confirmed) {
      return
    }

    try {
      await feedback.withLoading('正在处理', () => {
        return orderService.updateOrderStatus({
          orderId: order._id,
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
   * 跳转到个人中心。
   */
  goUserTab() {
    navigation.switchTab(PAGE_ROUTES.USER)
  },

  /**
   * 返回点餐页。
   */
  goOrderTab() {
    navigation.switchTab(PAGE_ROUTES.ORDER)
  }
})
