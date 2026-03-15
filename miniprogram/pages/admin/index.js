const dishService = require('../../services/dishService')
const orderService = require('../../services/orderService')
const adminService = require('../../services/adminService')
const userService = require('../../services/userService')
const { CATEGORY_LIST, USER_ROLE } = require('../../constants/index')

Page({
  data: {
    currentUser: null,
    isLoggedIn: false,
    isAdmin: false,
    activeTab: 'recommend',
    tabs: [
      { key: 'recommend', text: '首页推荐' },
      { key: 'dishes', text: '菜品管理' },
      { key: 'orders', text: '订单处理' },
      { key: 'stats', text: '数据统计' }
    ],
    dishList: [],
    orderList: [],
    dashboard: null,
    recommendCount: 0,
    editorVisible: false,
    formData: {
      _id: '',
      name: '',
      category: CATEGORY_LIST[1],
      price: '',
      stock: '',
      description: '',
      image: '',
      isManualRecommend: false
    },
    categoryOptions: CATEGORY_LIST.slice(1)
  },

  /**
   * 页面加载。
   * @param {Object} options - 页面参数。
   */
  async onLoad(options) {
    this.setData({
      activeTab: options.tab || 'recommend'
    })
    await this.syncAdminState()
  },

  /**
   * 页面展示时刷新数据。
   */
  async onShow() {
    await this.syncAdminState()
  },

  /**
   * 同步管理员状态。
   */
  async syncAdminState() {
    const currentUser = userService.getCachedUser()
    const isLoggedIn = Boolean(currentUser)
    const isAdmin = Boolean(currentUser && currentUser.role === USER_ROLE.ADMIN)

    this.setData({
      currentUser,
      isLoggedIn,
      isAdmin
    })

    if (isAdmin) {
      await this.loadAdminData()
    }
  },

  /**
   * 加载后台数据。
   */
  async loadAdminData() {
    try {
      const [dishList, orderList, dashboard] = await Promise.all([
        dishService.getAllDishes(true),
        orderService.getOrders({ role: USER_ROLE.ADMIN, status: 'all' }),
        adminService.getDashboard()
      ])

      this.setData({
        dishList,
        orderList,
        dashboard,
        recommendCount: dishList.filter((item) => item.isManualRecommend).length
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '后台数据加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 切换后台标签。
   * @param {Object} event - 事件对象。
   */
  handleTabTap(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab })
  },

  /**
   * 切换首页推荐状态。
   * @param {Object} event - 事件对象。
   */
  async handleRecommendToggle(event) {
    const dish = this.data.dishList[
      Number(event.currentTarget.dataset.index)
    ]
    try {
      await adminService.setManualRecommend(dish._id, !dish.isManualRecommend)
      wx.showToast({
        title: '首页推荐已更新',
        icon: 'success'
      })
      await this.loadAdminData()
    } catch (error) {
      wx.showToast({
        title: error.message || '推荐更新失败',
        icon: 'none'
      })
    }
  },

  /**
   * 打开新增菜品弹窗。
   */
  openCreateEditor() {
    this.setData({
      editorVisible: true,
      formData: {
        _id: '',
        name: '',
        category: CATEGORY_LIST[1],
        price: '',
        stock: '',
        description: '',
        image: '',
        isManualRecommend: false
      }
    })
  },

  /**
   * 打开编辑菜品弹窗。
   * @param {Object} event - 事件对象。
   */
  openEditEditor(event) {
    const dish = this.data.dishList[
      Number(event.currentTarget.dataset.index)
    ]
    this.setData({
      editorVisible: true,
      formData: Object.assign({}, dish)
    })
  },

  /**
   * 关闭编辑弹窗。
   */
  closeEditor() {
    this.setData({ editorVisible: false })
  },

  /**
   * 绑定输入项。
   * @param {Object} event - 事件对象。
   */
  handleFieldInput(event) {
    const field = event.currentTarget.dataset.field
    const formData = Object.assign({}, this.data.formData, {
      [field]: event.detail.value
    })
    this.setData({ formData })
  },

  /**
   * 切换分类字段。
   * @param {Object} event - 事件对象。
   */
  handleCategoryChange(event) {
    const index = Number(event.detail.value)
    const formData = Object.assign({}, this.data.formData, {
      category: this.data.categoryOptions[index]
    })
    this.setData({ formData })
  },

  /**
   * 切换表单中的推荐状态。
   */
  handleFormRecommendSwitch() {
    const formData = Object.assign({}, this.data.formData, {
      isManualRecommend: !this.data.formData.isManualRecommend
    })
    this.setData({ formData })
  },

  /**
   * 保存菜品。
   */
  async submitDishForm() {
    const formData = this.data.formData
    if (!formData.name || !formData.price || !formData.stock) {
      wx.showToast({
        title: '请完整填写名称、价格、库存',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '正在保存' })
    try {
      await adminService.saveDish(formData)
      wx.hideLoading()
      this.setData({ editorVisible: false })
      wx.showToast({ title: '菜品已保存', icon: 'success' })
      await this.loadAdminData()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  },

  /**
   * 切换菜品上下架状态。
   * @param {Object} event - 事件对象。
   */
  async handleDishToggle(event) {
    const dish = this.data.dishList[
      Number(event.currentTarget.dataset.index)
    ]
    try {
      await adminService.toggleDishStatus(dish._id, !dish.isAvailable)
      wx.showToast({ title: '状态已更新', icon: 'success' })
      await this.loadAdminData()
    } catch (error) {
      wx.showToast({ title: error.message || '更新失败', icon: 'none' })
    }
  },

  /**
   * 更新订单状态。
   * @param {Object} event - 事件对象。
   */
  async handleOrderAction(event) {
    try {
      await orderService.updateOrderStatus({
        orderId: event.currentTarget.dataset.orderId,
        nextStatus: event.currentTarget.dataset.action
      })
      wx.showToast({ title: '订单已处理', icon: 'success' })
      await this.loadAdminData()
    } catch (error) {
      wx.showToast({ title: error.message || '处理失败', icon: 'none' })
    }
  },

  /**
   * 切换演示管理员。
   */
  async promoteMockAdmin() {
    await userService.switchMockRole(USER_ROLE.ADMIN)
    await this.syncAdminState()
  },

  /**
   * 前往用户页登录。
   */
  goUserTab() {
    wx.switchTab({ url: '/pages/user/index' })
  },

  /**
   * 返回首页。
   */
  goHomeTab() {
    wx.switchTab({ url: '/pages/home/index' })
  },

  /**
   * 阻止弹窗内容区点击冒泡。
   */
  noop() {}
})
