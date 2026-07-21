# 可替换视觉切图

页面实际引用 `images/` 中的 PNG 文件，保持文件名不变即可直接替换：

- `background.jpg`：全页背景，1600 × 900，已按网页加载场景压缩。
- `logo.png`：顶部品牌标识，建议正方形透明 PNG。
- `avatar.png`：对话区域 AI 助手头像，建议使用 96 × 96 正方形透明 PNG。
- `user-avatar.png`：对话区域默认用户头像，建议使用正方形透明 PNG。
- `icon-risk.png`：风险特征入口图标。
- `icon-config.png`：调整规则参数入口图标。
- `icon-composite.png`：组合风险筛查入口图标。
- `icon-custom.png`：自定义检索入口图标。

四个入口图标当前均为带 Alpha 通道的透明 PNG，完整保留图标自身的方形底座。页面不再对图标使用剪影、裁切遮罩或投影。

`source/` 保存对应 SVG 源文件，方便设计人员继续调整。入口图标建议保持 96 × 96 画布，页面显示尺寸为 48 × 48。替换对话头像时只需覆盖 `images/avatar.png`，无需调整页面代码。
