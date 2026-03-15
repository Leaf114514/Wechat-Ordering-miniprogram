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
    status(nextStatus) {
      this.setData({
        meta: getStatusMeta(nextStatus)
      })
    }
  }
})
