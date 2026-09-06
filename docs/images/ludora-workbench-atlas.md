# Ludora 工作台图标图集

- 用途：项目图标、角色头像、制作阶段标识；纯装饰，旁边的文字提供可访问名称。
- 生产文件：`src/renderer/assets/ludora-workbench-atlas.png`。
- 来源：2026-09-06 使用 ImageGen 生成的原创配套美术，不是从用户参考图中截取的图标。
- 尺寸：1536 × 1024，PNG，4 列 × 2 行。
- 顺序：城堡、手柄、药水、宝箱；规划师、开发机器人、检查员、创作者。
- 使用方式：`GameGlyph.tsx` 通过 CSS 背景定位裁切；圆形头像与圆角项目图标共用一张图，不请求远程图片。
- 注意：提示词要求透明底，但实际输出带有绘制背景。当前依靠圆形/圆角遮罩适配，不能把它当作透明 PNG 使用。
- 原始生成文件：`/Users/leco/.codex/generated_images/01a04125-46fb-75b2-9cae-245edffb0762/exec-89122ef6-05c5-40f6-8cb5-9b441a733955.png`。

## 原始提示词

```text
Use case: stylized-concept. Asset type: one production UI sprite atlas for Ludora, an AI game creation desktop workbench. Create a single square 1024x1024 transparent PNG with an EXACT regular grid of 4 columns x 2 rows (8 equal 256x512? no: square atlas 4 columns and 2 rows means cell 256 wide x 512 high; center each small square subject at x=128,384,640,896 y=256,768). Better output landscape 1536x1024 with 4 columns x 2 rows, 384x512 cells. Each icon fits centered within a square 256x256 at cell center leaving large transparent padding.
Eight separate iconic subjects in exact reading order:
row 1: a tiny magical blue-roofed castle; a cobalt game controller with cyan buttons; a sapphire potion bottle with cork and small glowing liquid; an open navy and silver treasure chest holding blue gems.
row 2: round portrait of a kindly young wizard with dark navy pointed hat (planner); round portrait of a friendly blue robot with a simple smiling face (developer); round portrait of an explorer with silver goggles and blue scarf (reviewer); round portrait of a smiling young game creator with navy hoodie (user).
All subjects occupy exactly the same visual footprint, centered in their cell and separated widely. Art direction: premium hand-painted fantasy RPG inventory icons, charming sculpted three-dimensional forms, softly beveled shapes, rich cobalt and slate blue with small silver gold highlights, restrained teal accents, clean expressive silhouettes, soft upper-left light, coherent detail and brushwork. Suitable at 24-64 pixels as desktop UI icons; avoid excessive microdetail. Genuine transparent background and clean alpha around all subjects; NO backdrop, NO gridlines, NO panels, NO written text, NO logos, NO shadows outside the subject, NO extra subjects. Do not resemble a webpage or UI screenshot; this is a reusable sprite sheet asset.
```

生成工具存在随机性；如需修改单个角色，保留上述网格与位置约定，否则需同步调整 `GameGlyph.tsx` 和 `workbench.css` 的裁切规则。
