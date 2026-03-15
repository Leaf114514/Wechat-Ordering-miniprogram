# 暖橙点餐小程序

一个基于微信小程序原生框架与微信云开发的高可用点餐系统脚手架，
默认提供 Mock 数据可直接在微信开发者工具中预览，配置 `cloudEnvId`
后即可切换到 CloudBase 正式模式。

## 快速开始

1. 直接用微信开发者工具打开本项目。
2. 如需本地演示，无需额外配置，默认走 Mock 数据。
3. 如需连接云开发：
   - 在 `miniprogram/config/index.js` 填写 `cloudEnvId`
   - 创建 `dishes`、`orders`、`users` 三个集合
   - 将 `database/seed` 下的示例数据导入集合
   - 在开发者工具中上传并部署 `cloudfunctions` 目录下云函数
4. 若需管理员权限，请在 `users` 集合把目标用户 `role` 改为 `admin`。

## 目录结构

- `miniprogram/pages`：页面层，包含首页、订单、管理后台、个人中心
- `miniprogram/components`：购物车、状态标签、菜品卡片、规格弹窗
- `miniprogram/services`：服务层，封装云数据库与云函数调用
- `miniprogram/utils`：工具层，提供金额格式化、状态机、防重工具
- `cloudfunctions`：下单、订单状态更新、推荐、管理员管理等核心云函数
- `docs`：接口文档、数据库索引建议、性能优化建议

## 关键能力

- 卡片式首页 + 双列瀑布流菜单
- 底部固定购物车，支持滑动删除与数量动画
- 多规格弹窗，支持口味、辣度等维度选择
- 订单状态机：待支付 / 制作中 / 已完成 / 已取消
- 管理员端：菜品管理、订单处理、经营统计
- 协同过滤推荐：`recommendDishes` 云函数根据历史完成订单生成推荐

## 交付文档

- `docs/cloud-api.md`
- `docs/database-index.md`
- `docs/performance.md`
