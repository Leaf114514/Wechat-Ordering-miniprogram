const { getStatusMeta } = require('../../utils/orderState')

Component({
  properties: {
    status: {
      type: String,
      value: ''
    }
  },

  data: {
    meta: getStatusMeta('pending_payment')
  },

  observers: {
    /**
     * 状态变化时同步展示文案与颜色。
     * 组件内部只关心 UI 表现，不感知业务流程。
     */
    status(nextStatus) {
      this.setData({
        meta: getStatusMeta(nextStatus)
      })
    }
  }
})
