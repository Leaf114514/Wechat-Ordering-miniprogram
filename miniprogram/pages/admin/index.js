const dishService = require('../../services/dishService')
const orderService = require('../../services/orderService')
const adminService = require('../../services/adminService')
const userService = require('../../services/userService')
const { CATEGORY_LIST, USER_ROLE } = require('../../constants/index')
const { feedback, navigation } = require('../../utils/wechat')

/**
 * 创建后台菜品表单的默认值，避免同一份初始状态散落在多个位置。
 * @returns {Object} 默认表单对象。
 */
function createDefaultDishForm() {
  return {
    _id: '',
    name: '',
    category: CATEGORY_LIST[1],
    price: '',
    stock: '',
    description: '',
    image: '',
    isManualRecommend: false
  }
}

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
    formData: createDefaultDishForm(),
    categoryOptions: CATEGORY_LIST.slice(1)
  },

  /**
   * 页面加载时记录当前激活标签并同步后台状态。
   * @param {Object} options - 页面参数。
   */
  async onLoad(options) {
    this.setData({
      activeTab: options.tab || 'recommend'
    })
    await this.syncAdminState()
  },

  /**
   * 页面显示时重新同步后台数据。
   */
  async onShow() {
    await this.syncAdminState()
  },

  /**
   * 同步当前登录状态和管理员权限。
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
   * 拉取后台页需要的全部数据。
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
      feedback.showError(error.message || '后台数据加载失败')
    }
  },

  /**
   * 统一执行后台操作，并在成功后刷新后台数据。
   * @param {Function} task - 具体业务任务。
   * @param {string} successMessage - 成功提示文案。
   * @param {string} loadingMessage - 可选加载提示文案。
   */
  async runAdminAction(task, successMessage, loadingMessage) {
    try {
      if (loadingMessage) {
        await feedback.withLoading(loadingMessage, task)
      } else {
        await task()
      }

      feedback.showSuccess(successMessage)
      await this.loadAdminData()
    } catch (error) {
      feedback.showError(error.message || '操作失败')
    }
  },

  /**
   * 切换后台标签页。
   * @param {Object} event - 点击事件对象。
   */
  handleTabTap(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab })
  },

  /**
   * 切换首页推荐状态。
   * @param {Object} event - 点击事件对象。
   */
  async handleRecommendToggle(event) {
    const dish = this.data.dishList[
      Number(event.currentTarget.dataset.index)
    ]

    await this.runAdminAction(() => {
      return adminService.setManualRecommend(dish._id, !dish.isManualRecommend)
    }, '首页推荐已更新')
  },

  /**
   * 打开新增菜品编辑器。
   */
  openCreateEditor() {
    this.setData({
      editorVisible: true,
      formData: createDefaultDishForm()
    })
  },

  /**
   * 打开编辑菜品编辑器。
   * @param {Object} event - 点击事件对象。
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
   * 关闭编辑器弹窗。
   */
  closeEditor() {
    this.setData({ editorVisible: false })
  },

  /**
   * 更新表单字段。
   * @param {Object} event - 输入事件对象。
   */
  handleFieldInput(event) {
    const field = event.currentTarget.dataset.field
    const formData = Object.assign({}, this.data.formData, {
      [field]: event.detail.value
    })

    this.setData({ formData })
  },

  /**
   * 处理分类选择变更。
   * @param {Object} event - picker 事件对象。
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
   * 提交菜品表单。
   */
  async submitDishForm() {
    const formData = this.data.formData
    if (!formData.name || !formData.price || !formData.stock) {
      feedback.showError('请完整填写名称、价格、库存')
      return
    }

    try {
      await feedback.withLoading('正在保存', () => {
        return adminService.saveDish(formData)
      })
      this.setData({ editorVisible: false })
      feedback.showSuccess('菜品已保存')
      await this.loadAdminData()
    } catch (error) {
      feedback.showError(error.message || '保存失败')
    }
  },

  /**
   * 切换菜品上架状态。
   * @param {Object} event - 点击事件对象。
   */
  async handleDishToggle(event) {
    const dish = this.data.dishList[
      Number(event.currentTarget.dataset.index)
    ]

    await this.runAdminAction(() => {
      return adminService.toggleDishStatus(dish._id, !dish.isAvailable)
    }, '状态已更新')
  },

  /**
   * 处理后台订单状态流转。
   * @param {Object} event - 订单操作事件对象。
   */
  async handleOrderAction(event) {
    await this.runAdminAction(() => {
      return orderService.updateOrderStatus({
        orderId: event.currentTarget.dataset.orderId,
        nextStatus: event.currentTarget.dataset.action
      })
    }, '订单已处理')
  },

  /**
   * 在 mock 模式下切换到管理员身份。
   */
  async promoteMockAdmin() {
    await userService.switchMockRole(USER_ROLE.ADMIN)
    await this.syncAdminState()
  },

  /**
   * 跳转到个人中心 tab。
   */
  goUserTab() {
    navigation.switchTab('/pages/user/index')
  },

  /**
   * 返回首页 tab。
   */
  goHomeTab() {
    navigation.switchTab('/pages/home/index')
  },

  /**
   * 阻止弹窗内容区域点击冒泡。
   */
  noop() {}
})
