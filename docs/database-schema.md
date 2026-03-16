# 数据结构说明

## 1. `users`

用于保存用户身份、角色与统计信息。

### 核心字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 用户主键 |
| `openId` | string | 微信 openId |
| `nickname` | string | 用户昵称 |
| `avatarUrl` | string | 用户头像 |
| `role` | string | 用户角色，`customer` / `admin` |
| `favoriteCategories` | array | 偏好分类，可用于推荐 |
| `orderCount` | number | 累计订单数 |
| `totalSpend` | number | 累计消费金额 |
| `lastLoginAt` | number | 最近登录时间 |
| `createdAt` | number | 创建时间 |
| `updatedAt` | number | 更新时间 |

## 2. `dishes`

用于保存菜品、规格、库存与展示信息。

### 核心字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 菜品主键 |
| `name` | string | 菜品名称 |
| `category` | string | 分类名称 |
| `price` | number | 当前售价 |
| `originPrice` | number | 原价 |
| `sales` | number | 销量 |
| `stock` | number | 库存 |
| `rating` | number | 评分展示值 |
| `image` | string | 菜品图片 |
| `description` | string | 菜品描述 |
| `tags` | array | 标签数组 |
| `isAvailable` | boolean | 是否上架 |
| `isManualRecommend` | boolean | 是否首页人工推荐 |
| `specs` | array | 规格组列表 |
| `createdAt` | number | 创建时间 |
| `updatedAt` | number | 更新时间 |

### `specs` 结构

```json
[
  {
    "name": "口味",
    "required": true,
    "options": [
      { "label": "经典原味", "delta": 0 },
      { "label": "蜜汁橙香", "delta": 2 }
    ]
  }
]
```

## 3. `orders`

用于保存订单主数据、明细和状态流转。

### 核心字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 订单主键 |
| `userId` | string | 用户 ID |
| `openId` | string | 微信 openId，用于权限校验 |
| `status` | string | 订单状态 |
| `totalPrice` | number | 订单总价 |
| `remark` | string | 订单备注 |
| `dedupToken` | string | 幂等 token，避免重复提交 |
| `items` | array | 订单明细 |
| `stockRollbacked` | boolean | 取消订单后是否已回滚库存 |
| `statusTimeline` | object | 状态时间线 |
| `createdAt` | number | 创建时间 |
| `updatedAt` | number | 更新时间 |

### `items` 结构

```json
[
  {
    "itemKey": "dish-1001__口味-经典原味|辣度-不辣",
    "dishId": "dish-1001",
    "name": "橙香嫩煎鸡腿饭",
    "image": "/assets/dishes/dish-1.png",
    "quantity": 1,
    "price": 32,
    "selections": [
      {
        "groupName": "口味",
        "optionLabel": "经典原味",
        "delta": 0
      }
    ]
  }
]
```

## 4. 状态流转规则

当前订单状态统一使用以下规则：

- `pending_payment` -> `preparing`
- `pending_payment` -> `cancelled`
- `preparing` -> `completed`
- `preparing` -> `cancelled`

说明：

- 用户端“支付成功”后从 `pending_payment` 进入 `preparing`
- 取消订单时需要回滚库存
- 已完成与已取消的订单不可再继续流转
