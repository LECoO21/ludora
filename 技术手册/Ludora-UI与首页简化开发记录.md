# Ludora UI 与首页简化开发记录

> 本文记录实际已经完成的开发、验证结果和待人工确认项。计划与技术方案分别见《Ludora-UI与首页简化技术排期手册》和《Ludora-UI与首页简化技术开发手册》。

## 1. 记录信息

| 项目 | 内容 |
| --- | --- |
| 记录日期 | 2026-09-04；最近更新 2026-09-05 |
| 本轮主题 | Ludora 首页与游戏制作工作台简化 |
| 当前状态 | 代码实现完成，自动化验证通过，等待最终人工体验确认 |
| 视觉方向 | 中性灰工作台；主题色只用于主要按钮、焦点、进度和关键状态 |
| 视觉稿 | `docs/images/ludora-workbench-ui-concept-v1.png` |

## 2. 本轮确认的产品规则

1. 冷启动先进入简化首页。
2. 首页核心只突出“描述游戏创意”和“开始制作”。
3. 项目页保持左侧项目、中间制作记录、右侧游戏预览。
4. 模型、Reasoning Effort、FPS 和图片能力放入高级设置。
5. 技术事件默认转换成普通用户能理解的制作记录，原始内容放入详细日志。
6. 页面以中性灰为主，减少主题色面积。
7. 所有 Tab、导航分类和切换选中态，禁止使用左侧彩色竖条。

## 3. 已完成开发

### 3.1 首页

- [x] 新增 `HomeWorkspace.tsx`。
- [x] 冷启动默认进入首页。
- [x] 增加大尺寸游戏创意输入框。
- [x] 增加 3 个创意示例。
- [x] 展示最近 3 个项目。
- [x] 增加可折叠高级设置。
- [x] 在开始制作前检查 Runtime、Codex 登录和图片能力。
- [x] 创建项目后自动打开项目并启动 Agent。
- [x] 创建与启动拆成两个明确步骤，直接使用创建接口返回的 `project.id`。
- [x] 增加默认项目名生成函数及 4 个测试。

### 3.2 游戏制作工作台

- [x] 项目栏支持桌面收起和展开。
- [x] “新建游戏”返回简化首页。
- [x] 高级创建入口移入顶栏更多菜单。
- [x] Pipeline 从 8 张阶段卡片改为紧凑横向进度条。
- [x] Composer 默认只展示输入框与开始/停止按钮。
- [x] 模型、Reasoning Effort、FPS 和图片能力移入高级设置。
- [x] EventStream 增加普通视图与详细日志切换。
- [x] 普通视图隐藏 Thread ID、事件方法名和工具原始内容。
- [x] Inspector 标题改为中文。
- [x] 深色、浅色主题调整为中性灰视觉系统。

### 3.3 Tab 与切换选中态

| 位置 | 当前选中表现 | 左侧彩色竖条 |
| --- | --- | --- |
| 左侧项目列表 | 中性背景、文字对比与状态圆点 | 已移除 |
| 设置分类 | 中性背景对比 | 已移除 |
| 提示词分类 | 背景与文字对比 | 已移除 |
| 预览 / 素材 / 文件 Tab | 底部细线 | 不使用 |
| FPS 选择 | 完整边框与底部提示 | 不使用 |
| 主题选择 | 完整边框 | 不使用 |

说明：错误提示、Runtime 状态、图片能力提示等信息块仍可以使用状态色边线，因为它们表达“状态或警告”，不属于 Tab 或切换选中态。

## 4. 主要变更文件

| 文件 | 变更内容 |
| --- | --- |
| `src/renderer/App.tsx` | 首页与项目工作台入口、创建后启动流程、菜单与状态组织 |
| `src/renderer/components/HomeWorkspace.tsx` | 新首页、创意输入、最近项目和高级设置 |
| `src/renderer/components/ProjectRail.tsx` | 项目栏简化与收起能力 |
| `src/renderer/components/Pipeline.tsx` | 紧凑制作进度 |
| `src/renderer/components/Composer.tsx` | 简化输入区与高级设置 |
| `src/renderer/components/EventStream.tsx` | 普通制作记录与详细日志 |
| `src/renderer/components/Inspector.tsx` | 中文标题与 Tab 展示 |
| `src/renderer/styles.css` | 中性灰视觉系统、首页布局、工作台布局和选中态规则 |
| `src/renderer/ui.ts` | 默认项目名生成等 UI 辅助逻辑 |
| `src/renderer/ui.test.ts` | 默认项目名相关测试 |

本轮没有新增依赖，没有修改 Electron Main、IPC、Agent、Prompt、Skill、媒体生成或安全业务逻辑。

## 5. 验证记录

### 5.1 自动化验证

执行 `npm run verify`，结果：

- [x] 19 个测试文件通过。
- [x] 128 个测试通过。
- [x] TypeScript 类型检查通过。
- [x] Production build 通过。

执行 UI smoke：

```bash
env -u ELECTRON_RUN_AS_NODE npm run smoke:ui
```

结果：

- [x] Electron 成功启动。
- [x] 工作台成功渲染。
- [x] 截图成功生成：`.ludora-smoke/workbench.png`。
- [x] 项目选中态经过实际界面检查，没有左侧彩色竖条。

执行 `git diff --check`，结果：

- [x] 没有空白字符或补丁格式错误。

### 5.2 环境说明

当前电脑环境存在：

```text
ELECTRON_RUN_AS_NODE=1
```

直接执行 `npm run smoke:ui` 会导致 Electron 的 `BrowserWindow` 导出异常。临时取消该环境变量后可以正常执行，这不是 Ludora 项目代码问题。

## 6. 待人工确认

以下内容建议由使用者在实际窗口中再体验一遍：

- [ ] 浅色主题下的文字与边界是否舒适。
- [ ] 小窗口下首页、项目栏和预览是否符合使用习惯。
- [ ] 键盘切换主要 Tab、打开高级设置和提交指令是否顺手。
- [ ] 设置分类、提示词分类逐项切换时的视觉反馈是否满意。
- [ ] “主题色只少量使用”的整体程度是否符合预期。

## 7. Git 状态

本轮代码与文档当前保存在本地工作区，尚未为本轮改造创建 Git 提交，也尚未推送到远程仓库。

提交前应再次执行：

```bash
git status --short
git diff --check
npm run verify
```

## 8. 后续记录规则

后续每次 UI 调整都在本文追加一条记录，至少包含：

1. 日期与需求原话。
2. 实际修改位置。
3. 修改前后差异。
4. 验证命令与结果。
5. 尚未验证的内容。
6. 是否已经提交和推送。

### 2026-09-04：取消选择项左侧彩色竖条

- 需求：所有 Tab 选择或切换选择时，不要出现左侧带颜色的竖条。
- 修改：移除项目项、桌面设置分类和桌面提示词分类选中态的左侧主题色指示。
- 统一规则：选择状态使用中性背景、文字对比、完整边框或底部细线表达。
- 验证：源码扫描、实际项目页截图、`git diff --check` 均通过。

### 2026-09-05：用品牌循环视频替换等待小游戏（已废弃，仅作历史记录）

> 状态：该方案随后被用户取消，MP4 文件和全部生产引用已经删除。以下内容仅保留为历史决策记录，不代表当前实现。

- 需求：取消 Chrome 恐龙跳跃方向；游戏尚未生成时不再展示占位小游戏，改为与 Ludora Logo 宣传图一致的约 15 秒循环动图视频。
- 旧任务处理：已停止仍在后台运行的“横版跳跃游戏”制作任务；保留已产生文件，没有删除项目。
- 品牌来源：复用 `docs/images/ludora-game-agent-poster.png`，不重新生成或改变品牌主体。
- 视频输出：`assets/ludora-wait-loop.mp4`，H.264、1280×720、30 FPS、451 帧、15.03 秒、无音频。
- 循环方式：首尾使用相同构图与运动参数，通过呼吸缩放、轻微漂移和亮度变化形成无缝循环。
- 回退图片：`assets/ludora-wait-poster.webp`；视频加载失败或用户启用减少动态效果时仍有可见画面。
- 页面行为：使用 `autoplay muted loop playsinline` 自动静音播放，显示“正在构建游戏世界”和 Ludora 品牌文案。
- 模板范围：以后新建的 Ludora 项目都会获得该等待视频；真正游戏完成后由 Agent 替换等待页。
- 当前预览：同步更新 `/Users/leco/Desktop/game/银铲铲`，并在 Ludora 实际窗口中确认画面加载成功。
- 打包：将 `assets/**/*` 加入 Electron 安装包文件清单。
- 稳定性：修复循环视频分段读取时预览服务器文件句柄未显式关闭的问题。
- 验证：视频完整解码 451 帧；当前项目使用 Ludora 已有 Vite 成功构建；`npm run verify` 通过，19 个测试文件、128 个测试、类型检查和生产构建全部成功。
- Git：本轮改动仍在本地，尚未提交或推送。

### 2026-09-05：取消等待视频，改为完全静态的宣传图

- 需求：不再使用视频；等待页只显示静态 Ludora 品牌宣传图，画面不播放、不缩放、不呼吸、不闪动。
- 保留图片：主项目使用 `assets/ludora-wait-poster.webp`，当前“银铲铲”项目使用 `public/assets/ludora-wait-poster.webp`。
- 页面修改：`<video>` 替换为单个原生 `<img>`；移除 `autoplay`、`loop`、视频源、15 秒标记和所有播放控制逻辑。
- 动效修改：移除等待状态点的呼吸动画、关键帧和减少动态效果分支；页面中不再存在 CSS 动画或过渡。
- 模板范围：以后新建的 Ludora 项目只复制静态 WebP，不再复制或引用 MP4。
- 当前项目：同步修改 `/Users/leco/Desktop/game/银铲铲` 的页面、脚本、样式和 `GAME_DESIGN.md`，并重新生成 `dist`。
- 动画评估：presentation=`2d`，generation=`not-needed`；等待画面按用户要求保持完全静止，游戏正式实现后的 60 FPS 规则不受影响。
- 已删除视频：`assets/ludora-wait-loop.mp4`、`/Users/leco/Desktop/game/银铲铲/public/assets/ludora-wait-loop.mp4`、`/Users/leco/Desktop/game/银铲铲/dist/assets/ludora-wait-loop.mp4`。
- 恢复说明：上述 MP4 此前未提交 Git，不能从 Git 直接恢复；保留的宣传图可用于日后重新生成。
- 自动验证：相关 11 个测试通过；`npm run verify` 通过，19 个测试文件、128 个测试、TypeScript 类型检查和生产构建全部成功；`git diff --check` 通过。
- 页面验证：静态图片成功加载为 1280×720；页面无 `<video>`、Canvas、CSS 动画或过渡，控制台无错误；图片区域间隔 3 秒的两次截图完全一致。
- Git：本轮改动仍在本地，尚未提交或推送。
