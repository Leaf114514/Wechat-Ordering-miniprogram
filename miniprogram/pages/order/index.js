const config = require('../../config/index')
const dishService = require('../../services/dishService')
const cartService = require('../../services/cartService')
const orderService = require('../../services/orderService')
const userService = require('../../services/userService')
const { feedback, navigation, page: pageActions } = require('../../utils/wechat')

/**
 * 在需要登录的场景下统一提示并跳转到个人中心。
 * 该逻辑只服务当前点餐页，因此放在页面文件内部，避免扩散为全局耦合。
 * @param {string} message - 提示文案。
 */
function redirectToUserTabWithMessage(message) {
  feedback.showError(message)
  navigation.switchTabLater('/pages/user/index', 400)
}

Page({
  data: {
    categories: [],
    activeCategory: '全部',
    dishList: [],
    cartItems: [],
    cartSummary: {
      totalCount: 0,
      totalPriceText: '0.00'
    },
    currentUser: null,
    isLoggedIn: false,
    activeDish: null,
    specPopupVisible: false,
    pageNo: 1,
    hasMore: true,
    remark: '',
    restaurantProfile: config.restaurantProfile
  },

  /**
   * 页面加载时初始化分类、菜品和用户状态。
   */
  async onLoad() {
    await this.initializePage()
  },

  /**
   * 页面显示时同步购物车和登录态。
   */
  onShow() {
    this.syncCartState()
    this.syncUserState()
  },

  /**
   * 处理下拉刷新，并在刷新结束后自动关闭动画。
   */
  async onPullDownRefresh() {
    await pageActions.withPullDownRefresh(() => this.reloadDishFeed())
  },

  /**
   * 触底时继续加载下一页菜品。
   */
  async onReachBottom() {
    if (!this.data.hasMore) {
      return
    }

    await this.loadDishFeed(false)
  },

  /**
   * 初始化点餐页核心数据。
   */
  async initializePage() {
    try {
      const categories = await dishService.getCategoryList()
      this.setData({ categories })
      await this.reloadDishFeed()
      this.syncCartState()
      this.syncUserState()
    } catch (error) {
      feedback.showError(error.message || '点餐页初始化失败')
    }
  },

  /**
   * 同步当前登录状态。
   */
  syncUserState() {
    const currentUser = userService.getCachedUser()
    this.setData({
      currentUser,
      isLoggedIn: Boolean(currentUser)
    })
  },

  /**
   * 从第一页重新拉取菜品列表。
   */
  async reloadDishFeed() {
    this.setData({
      pageNo: 1,
      dishList: []
    })
    await this.loadDishFeed(true)
  },

  /**
   * 加载菜品流数据。
   * @param {boolean} reset - 是否从第一页开始加载。
   */
  async loadDishFeed(reset) {
    const pageNo = reset ? 1 : this.data.pageNo + 1
    const result = await dishService.getHomeFeed({
      category: this.data.activeCategory,
      pageNo,
      pageSize: config.pageSize
    })
    const dishList = reset
      ? result.list
      : this.data.dishList.concat(result.list)

    this.setData({
      pageNo,
      dishList,
      hasMore: result.hasMore
    })
  },

  /**
   * 切换菜品分类并刷新列表。
   * @param {Object} event - 点击事件对象。
   */
  async handleCategoryTap(event) {
    const category = event.currentTarget.dataset.category
    this.setData({ activeCategory: category })
    await this.reloadDishFeed()
  },

  /**
   * 打开规格选择弹窗。
   * @param {Object} event - 菜品卡片事件对象。
   */
  handleDishSelect(event) {
    const dish = event.detail.dish
    this.setData({
      activeDish: dish,
      specPopupVisible: true
    })
  },

  /**
   * 快速加购无规格菜品。
   * @param {Object} event - 菜品事件对象。
   */
  handleAddDish(event) {
    const dish = event.detail.dish
    if (dish.specs && dish.specs.length) {
      this.handleDishSelect(event)
      return
    }

    cartService.addCartItem(dish, [], 1)
    this.syncCartState()
    feedback.showSuccess('已加入购物车')
  },

  /**
   * 关闭规格选择弹窗。
   */
  handleSpecClose() {
    this.setData({ specPopupVisible: false })
  },

  /**
   * 确认规格选择并加入购物车。
   * @param {Object} event - 规格弹窗确认事件。
   */
  handleSpecConfirm(event) {
    const detail = event.detail
    cartService.addCartItem(detail.dish, detail.selections, detail.quantity)
    this.setData({ specPopupVisible: false })
    this.syncCartState()
    feedback.showSuccess('加入成功')
  },

  /**
   * 同步购物车视图数据。
   */
  syncCartState() {
    const cartItems = cartService.getCartItems()
    const cartSummary = cartService.getCartSummary(cartItems)
    this.setData({ cartItems, cartSummary })
  },

  /**
   * 处理购物车数量变更或删除动作。
   * @param {Object} event - 购物车组件事件。
   */
  handleCartChange(event) {
    const detail = event.detail

    if (detail.type === 'quantity') {
      cartService.updateCartCount(detail.itemKey, detail.delta)
    }

    if (detail.type === 'delete') {
      cartService.removeCartItem(detail.itemKey)
    }

    this.syncCartState()
  },

  /**
   * 记录订单备注输入。
   * @param {Object} event - 输入事件对象。
   */
  handleRemarkInput(event) {
    this.setData({ remark: event.detail.value })
  },

  /**
   * 提交订单，并在成功后清空购物车与跳转订单页。
   */
  async handleCheckout() {
    if (!this.data.cartItems.length) {
      return
    }

    if (!this.data.isLoggedIn) {
      redirectToUserTabWithMessage('请先登录后再下单')
      return
    }

    try {
      const result = await feedback.withLoading('正在创建订单', () => {
        return orderService.placeOrder({
          cartItems: this.data.cartItems,
          totalPrice: this.data.cartSummary.totalPriceText,
          remark: this.data.remark
        })
      })

      cartService.clearCartItems()
      this.syncCartState()
      this.setData({ remark: '' })
      feedback.showSuccess(`订单已创建 ¥${result.totalPriceText}`)
      await this.reloadDishFeed()
      navigation.navigateTo('/pages/orders/index')
    } catch (error) {
      feedback.showError(error.message || '创建订单失败')
    }
  },

  /**
   * 打开订单列表页，未登录时先引导登录。
   */
  openOrdersPage() {
    if (!this.data.isLoggedIn) {
      redirectToUserTabWithMessage('请先登录后查看订单')
      return
    }

    navigation.navigateTo('/pages/orders/index')
  },

  /**
   * 跳转到个人中心 tab。
   */
  goUserTab() {
    navigation.switchTab('/pages/user/index')
  }
})
