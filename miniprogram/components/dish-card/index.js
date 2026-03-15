Component({
  properties: {
    dish: {
      type: Object,
      value: {}
    }
  },

  methods: {
    /**
     * 点击菜品卡片。
     */
    handleTap() {
      this.triggerEvent('select', {
        dish: this.properties.dish
      })
    },

    /**
     * 点击加购按钮。
     */
    handleAdd() {
      this.triggerEvent('add', {
        dish: this.properties.dish
      })
    }
  }
})
