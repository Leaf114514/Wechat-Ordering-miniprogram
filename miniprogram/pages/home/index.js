const config = require('../../config/index')
const dishService = require('../../services/dishService')
const cartService = require('../../services/cartService')
const orderService = require('../../services/orderService')
const recommendService = require('../../services/recommendService')
const userService = require('../../services/userService')
const { splitWaterfallList } = require('../../utils/formatter')

Page({
  data: {
    categories: [],
    activeCategory: '全部',
    dishList: [],
    leftColumn: [],
    rightColumn: [],
    cartItems: [],
    cartSummary: {
      totalCount: 0,
      totalPriceText: '0.00'
    },
    recommendList: [],
    currentUser: null,
    activeDish: null,
    specPopupVisible: false,
    pageNo: 1,
    hasMore: true,
    remark: '',
    restaurantProfile: config.restaurantProfile
  },

  /**
   * 页面加载。
   */
  async onLoad() {
    await this.initializePage()
  },

  /**
   * 页面显示时同步购物车。
   */
  onShow() {
    this.syncCartState()
  },

  /**
   * 下拉刷新首页数据。
   */
  async onPullDownRefresh() {
    await this.reloadDishFeed()
    wx.stopPullDownRefresh()
  },

  /**
   * 触底加载更多菜品。
   */
  async onReachBottom() {
    if (!this.data.hasMore) {
      return
    }

    await this.loadDishFeed(false)
  },

  /**
   * 初始化页面数据。
   */
  async initializePage() {
    try {
      const currentUser = await userService.ensureCurrentUser()
      const categories = await dishService.getCategoryList()
      this.setData({ currentUser, categories })
      await this.reloadDishFeed()
      await this.loadRecommendations(currentUser._id)
      this.syncCartState()
    } catch (error) {
      wx.showToast({
        title: error.message || '首页初始化失败',
        icon: 'none'
      })
    }
  },

  /**
   * 重新加载首页菜品。
   */
  async reloadDishFeed() {
    this.setData({
      pageNo: 1,
      dishList: []
    })
    await this.loadDishFeed(true)
  },

  /**
   * 加载首页瀑布流。
   * @param {boolean} reset - 是否重置。
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
    const columns = splitWaterfallList(dishList)

    this.setData({
      pageNo,
      dishList,
      leftColumn: columns.left,
      rightColumn: columns.right,
      hasMore: result.hasMore
    })
  },

  /**
   * 加载推荐菜品。
   * @param {string} userId - 用户 ID。
   */
  async loadRecommendations(userId) {
    const recommendList = await recommendService.getPersonalRecommendations({
      userId,
      limit: 3
    })
    this.setData({ recommendList })
  },

  /**
   * 切换分类。
   * @param {Object} event - 事件对象。
   */
  async handleCategoryTap(event) {
    const category = event.currentTarget.dataset.category
    this.setData({ activeCategory: category })
    await this.reloadDishFeed()
  },

  /**
   * 打开规格选择弹窗。
   * @param {Object} event - 事件对象。
   */
  handleDishSelect(event) {
    const dish = event.detail.dish
    this.setData({
      activeDish: dish,
      specPopupVisible: true
    })
  },

  /**
   * 点击加入购物车。
   * @param {Object} event - 事件对象。
   */
  handleAddDish(event) {
    const dish = event.detail.dish
    if (dish.specs && dish.specs.length) {
      this.handleDishSelect(event)
      return
    }

    cartService.addCartItem(dish, [], 1)
    this.syncCartState()
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })
  },

  /**
   * 关闭规格弹窗。
   */
  handleSpecClose() {
    this.setData({ specPopupVisible: false })
  },

  /**
   * 确认规格选择。
   * @param {Object} event - 事件对象。
   */
  handleSpecConfirm(event) {
    const detail = event.detail
    cartService.addCartItem(detail.dish, detail.selections, detail.quantity)
    this.setData({ specPopupVisible: false })
    this.syncCartState()
    wx.showToast({
      title: '加入成功',
      icon: 'success'
    })
  },

  /**
   * 同步购物车状态到页面。
   */
  syncCartState() {
    const cartItems = cartService.getCartItems()
    const cartSummary = cartService.getCartSummary(cartItems)
    this.setData({ cartItems, cartSummary })
  },

  /**
   * 处理购物车变更。
   * @param {Object} event - 事件对象。
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
   * 记录备注。
   * @param {Object} event - 事件对象。
   */
  handleRemarkInput(event) {
    this.setData({ remark: event.detail.value })
  },

  /**
   * 提交订单。
   */
  async handleCheckout() {
    if (!this.data.cartItems.length) {
      return
    }

    wx.showLoading({ title: '正在创建订单' })
    try {
      const result = await orderService.placeOrder({
        cartItems: this.data.cartItems,
        totalPrice: this.data.cartSummary.totalPriceText,
        remark: this.data.remark
      })
      cartService.clearCartItems()
      this.syncCartState()
      this.setData({ remark: '' })
      wx.hideLoading()
      wx.showToast({
        title: `订单已创建 ${result.totalPriceText}`,
        icon: 'success'
      })
      await this.reloadDishFeed()
      wx.navigateTo({ url: '/pages/orders/index' })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '创建订单失败',
        icon: 'none'
      })
    }
  },

  /**
   * 页面跳转。
   * @param {Object} event - 事件对象。
   */
  handleNavigate(event) {
    const url = event.currentTarget.dataset.url
    wx.navigateTo({ url })
  }
})
