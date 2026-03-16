# 微信小程序接口清单（点餐项目版）

## 目标

这份清单只保留当前点餐小程序真正高频、与业务直接相关的微信接口，方便开发时先抓主链路，再逐步扩展能力。

## P0：当前项目必须掌握

| 接口 | 作用 | 点餐场景 | 当前代码位置 |
| --- | --- | --- | --- |
| `wx.login` | 获取登录 `code` | 微信登录、换取用户会话 | `miniprogram/services/userService.js` |
| `wx.getStorageSync` / `wx.setStorageSync` / `wx.removeStorageSync` | 本地持久化 | 购物车、当前用户、幂等 token、mock 数据 | `miniprogram/utils/cache.js`、`miniprogram/services/cartService.js`、`miniprogram/services/orderService.js` |
| `wx.showToast` / `wx.showLoading` / `wx.hideLoading` | 轻量反馈与过程反馈 | 登录、下单、保存菜品、状态更新、错误提示 | `miniprogram/pages/user/index.js`、`miniprogram/pages/order/index.js`、`miniprogram/pages/orders/index.js`、`miniprogram/pages/admin/index.js` |
| `wx.navigateTo` / `wx.switchTab` | 页面跳转 | 首页、点餐页、订单页、个人中心、后台页切换 | `miniprogram/pages/home/index.js`、`miniprogram/pages/order/index.js`、`miniprogram/pages/user/index.js` |
| `wx.stopPullDownRefresh` | 结束下拉刷新状态 | 数据刷新完成后关闭顶部刷新动画 | `miniprogram/pages/home/index.js`、`miniprogram/pages/order/index.js` |
| `wx.cloud.init` / `wx.cloud.database` / `wx.cloud.callFunction` | 云开发入口 | 菜品、订单、登录、后台管理统一走云能力 | `miniprogram/app.js`、`miniprogram/services/cloudService.js` |

### 为什么 P0 优先级最高

1. 这些接口已经覆盖当前项目的完整闭环：登录、浏览菜品、加购、下单、查订单、后台管理。
2. 它们都位于页面主交互路径上，几乎每个核心页面都会触发。
3. 一旦出错会直接影响业务可用性，最适合优先做统一封装。

## P1：下一阶段建议补齐

| 接口 | 建议引入时机 | 典型用途 |
| --- | --- | --- |
| `wx.requestPayment` | 接入真实支付时 | 订单支付、支付结果流转 |
| `wx.chooseAddress` / `wx.chooseLocation` | 做外卖配送或自提导航时 | 地址选择、门店定位、路线选择 |
| `wx.requestSubscribeMessage` | 做订单通知时 | 支付成功、制作中、完成提醒 |
| `wx.chooseMedia` + `wx.uploadFile` | 做图片上传时 | 菜品图片、评价晒图、后台上传 |
| `wx.previewImage` | 做菜品图册升级时 | 菜品大图预览 |
| `wx.openLocation` / `wx.makePhoneCall` | 做门店服务能力时 | 到店导航、联系门店 |
| `wx.createSelectorQuery` | 做复杂联动 UI 时 | 吸顶分类、滚动联动、锚点定位 |
| `wx.request` | 后端改成自建 API 时 | 直接进行 HTTP 通信 |

## P2：当前阶段暂不优先

这些能力官方支持很强，但和当前点餐主链路耦合较弱，暂时不建议优先投入：

- 蓝牙、BLE、NFC、Wi-Fi 等设备类接口
- XR-FRAME、Skyline 等高级渲染能力
- AI 推理、VisionKit、Face 等智能能力
- 广告能力、聊天工具能力
- Worker、TCP/UDP、mDNS 等偏底层能力

## 当前仓库的封装思路

为了遵循高聚合、低耦合，项目中的微信能力按职责拆分为：

- `miniprogram/utils/wechat/storage.js`：只负责本地缓存
- `miniprogram/utils/wechat/auth.js`：只负责登录凭证获取
- `miniprogram/utils/wechat/feedback.js`：只负责提示与加载态
- `miniprogram/utils/wechat/navigation.js`：只负责页面跳转
- `miniprogram/utils/wechat/page.js`：只负责页面级辅助动作
- `miniprogram/services/cloudService.js`：只负责云开发能力适配

这样做的好处：

1. 页面层只关心“提示什么、跳到哪里”，不直接依赖底层 `wx` 细节。
2. 服务层只关心“登录、缓存、云数据”，不和页面交互逻辑混在一起。
3. 后续如果把云开发替换成自建后端，只需要调整服务层，不需要全局重写 `wx` 调用。

## 官方文档入口

- API 总览：`https://developers.weixin.qq.com/miniprogram/dev/api/`
- `wx.login`：`https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html`
- `wx.navigateTo`：`https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html`
- `wx.switchTab`：`https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.switchTab.html`
- `wx.showToast`：`https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showToast.html`
- `wx.showLoading`：`https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showLoading.html`
- `wx.hideLoading`：`https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.hideLoading.html`
- `wx.getStorageSync`：`https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageSync.html`
- `wx.setStorageSync`：`https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorageSync.html`
- `wx.removeStorageSync`：`https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.removeStorageSync.html`
- `wx.stopPullDownRefresh`：`https://developers.weixin.qq.com/miniprogram/dev/api/ui/pull-down-refresh/wx.stopPullDownRefresh.html`
- `wx.requestPayment`：`https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestPayment.html`
- `wx.chooseAddress`：`https://developers.weixin.qq.com/miniprogram/dev/api/open-api/address/wx.chooseAddress.html`
- `wx.chooseLocation`：`https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.chooseLocation.html`
- `wx.requestSubscribeMessage`：`https://developers.weixin.qq.com/miniprogram/dev/api/open-api/subscribe-message/wx.requestSubscribeMessage.html`
- `wx.chooseMedia`：`https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.chooseMedia.html`
- `wx.uploadFile`：`https://developers.weixin.qq.com/miniprogram/dev/api/network/upload/wx.uploadFile.html`
- `wx.previewImage`：`https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.previewImage.html`
- `wx.openLocation`：`https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.openLocation.html`
- `wx.makePhoneCall`：`https://developers.weixin.qq.com/miniprogram/dev/api/device/phone/wx.makePhoneCall.html`
- `wx.createSelectorQuery`：`https://developers.weixin.qq.com/miniprogram/dev/api/wxml/wx.createSelectorQuery.html`
- `wx.request`：`https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html`
