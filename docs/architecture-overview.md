# 项目架构说明

## 1. 架构目标

本项目的目标不是“页面里把功能堆出来”，而是构建一个：

- 可运行
- 可维护
- 可切换 Mock / 云开发
- 符合高聚合、低耦合原则

的微信点餐小程序。

## 2. 目录分层

### `miniprogram/pages/`

页面层只负责：

- 页面状态
- 事件绑定
- 页面级交互编排
- 调用 service 层与微信能力层

页面层不直接：

- 访问数据库
- 写复杂业务规则
- 到处散写 `wx.*`

### `miniprogram/components/`

组件层只负责：

- UI 展示
- 局部交互
- 通过 `properties` / `events` 和页面通信

组件不直接依赖：

- 订单状态规则
- 用户权限逻辑
- 数据源切换逻辑

### `miniprogram/services/`

service 层负责：

- 业务逻辑处理
- Mock / 云开发双模式切换
- 数据格式规范化
- 权限判断
- 订单状态流转

这是整个项目的业务中枢。

### `miniprogram/utils/wechat/`

微信能力层负责封装原生 API：

- `auth`：登录
- `feedback`：提示与 loading
- `modal`：确认弹窗
- `navigation`：页面跳转
- `storage`：本地缓存
- `page`：下拉刷新辅助
- `cloud`：云开发基础能力
- `media`：图片选择与预览
- `location`：地图能力
- `payment`：支付与 mock 降级

### `cloudfunctions/`

云函数按职责拆分：

- `loginUser`：登录与用户初始化
- `placeOrder`：下单
- `updateOrderStatus`：订单状态流转
- `manageDish`：菜品新增、编辑、上下架、推荐设置
- `adminDashboard`：后台统计
- `recommendDishes`：个性化推荐

## 3. 核心业务链路

### 用户点餐链路

1. 用户登录
2. 首页浏览推荐
3. 点餐页选择分类与菜品
4. 规格弹窗确认规格
5. 加入购物车
6. 填写备注并提交订单
7. 订单页完成支付、查看状态
8. 完成后支持“再来一单”

### 管理端链路

1. 管理员登录
2. 进入后台
3. 管理首页推荐
4. 新增 / 编辑 / 上下架菜品
5. 处理订单状态
6. 查看数据看板

## 4. 为什么符合高聚合、低耦合

### 高聚合

- 微信原生能力集中在 `utils/wechat`
- 订单规则集中在 `orderService` 与 `utils/orderState`
- 菜品管理集中在 `adminService`
- 推荐逻辑集中在 `recommendService`

### 低耦合

- 页面层不感知 Mock / 云开发切换
- 组件层不依赖 service
- service 层不处理页面展示
- 云函数不依赖前端页面结构

## 5. Mock 与云开发切换原则

- 如果 `cloudEnvId` 为空，则自动启用 Mock
- 页面层永远调用 service 层，不直接判断当前模式
- service 层内部决定走本地 mockStore 还是云函数 / 云数据库
- 保证两种模式下返回数据结构一致

## 6. UI/UX 设计原则

- 统一暖橙色餐饮视觉语言
- 卡片化布局
- 统一圆角、阴影、间距节奏
- 页面层次清晰，移动端优先
- 所有关键交互都有成功、失败、空态和确认反馈
