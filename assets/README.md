# 可替换视觉切图

页面实际引用 `images/` 中的 PNG 文件，保持文件名不变即可直接替换：

- `background.jpg`：全页背景，1600 × 900，已按网页加载场景压缩。
- `avatar-assistant-v2.png`：智能助手默认头像，192 × 192 透明 PNG，可直接同名替换。
- `avatar-assistant-police.png`：当前警务智能助手头像，256 × 256 透明 PNG；页面使用独立光晕样式，无外框。
- `avatar-user-v2.png`：用户默认头像，192 × 192 透明 PNG，可直接同名替换。
- `logo.png`：顶部品牌标识，建议正方形透明 PNG。
- `icon-risk.png`：风险特征入口图标。
- `icon-config.png`：调整规则参数入口图标。
- `icon-composite.png`：组合风险筛查入口图标。
- `icon-custom.png`：自定义检索入口图标。

四个入口图标当前均为带 Alpha 通道的透明 PNG，完整保留图标自身的方形底座。页面不再对图标使用剪影、裁切遮罩或投影。

`source/` 保存已有 SVG 源文件，方便设计人员继续调整。入口图标建议保持正方形透明画布。替换对话头像时只需分别覆盖 `images/avatar-assistant-police.png` 和 `images/avatar-user-v2.png`，无需调整页面代码。
