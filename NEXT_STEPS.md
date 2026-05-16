# Omegalog 当前状态

## 目标

做一个本地文件夹驱动的 todo/log 浏览器应用，视觉方向是金色图书馆、暗色档案台、个人指挥中心。数据必须保存为用户选择文件夹里的 `.omegalog.json` 文件。

## 已完成

- Vite + vanilla TypeScript，无后端、无数据库、无认证、无 Tailwind。
- 使用 File System Access API 打开本地文件夹，扫描 `*.omegalog.json`。
- 新增日志会写入 `YYYY-MM-DD_HH-mm-ss_<id>.omegalog.json`。
- 卡片默认按最新创建排序，也支持创建时间切换、权重优先、最紧张、进行中优先、已完成优先。
- 新增/调整表单支持任务标签和 `1-10` 权重，旧日志文件会自动补默认权重 `5` 和空标签。
- 右侧“筛选”现在是真筛选：全部、只看进行中、只看已完成循环切换。
- 右侧底部分页现在是真分页：可翻页，也可在每页 `5/10/20` 条之间切换。
- 右下角 `+` 打开新增/调整面板，再点一次关闭，没有 Cancel 按钮。
- 未选择文件夹时点击 `+` 会先打开文件夹选择，选择成功后自动展开新增面板。
- 新增/调整面板也支持 `Escape` 关闭，不增加可见按钮。
- 日志支持标题、备注、截止时间、倒计时。
- 活动事件可标记完成，写回 `status: "done"` 和 `completedAt`。
- 活动卡片支持点击非按钮区域直接完成，同时保留“标记完成”按钮。
- 已完成事件可调整，也可重新激活。
- 已完成卡片只保留一处完成时间，避免信息重复。
- 完成/重新激活操作有按记录 ID 的防重复触发保护。
- 完成后显示中文主反馈的全屏祝贺动画。
- UI 为中文，主界面按金色图书馆档案台风格排版。
- 未打开文件夹前的欢迎面板居中显示。
- 顶部标题、打开按钮和主控制台左边缘已对齐，减少设计稿式错位。
- 主控制台视觉已再次收敛：最大宽度 `1280px`，背景更可见，控制台更轻，左侧焦点区约 40%，右侧档案区约 60%。
- 使用 `src/assets/omegalog-library-v2.png` 作为金色图书馆背景，旧版 `src/assets/omegalog-library.png` 保留可回退。
- 使用 `src/assets/omegalog-focus-desk-v1.png` 作为左侧焦点事件插图，让焦点卡更接近参考图的真实桌面质感。
- “生成头图”按钮会基于任务标题、备注、标签、权重和状态生成本地 SVG 头图，并把 `coverVariant` / `coverDataUrl` / `coverGeneratedAt` 写回对应 JSON。没有把任何 API key 写入前端。
- 有应用内状态提示，源码没有 `alert/confirm/prompt`。
- FAB、排序按钮、完成动画已同步基础 ARIA 状态。
- 日志列表和动态卡片已补充列表语义。
- 顶层应用容器使用 `main` 语义。
- 新增/调整表单与标题通过 `aria-labelledby` 关联。
- 状态 toast 和祝贺动画使用 `aria-atomic` 保证播报完整。
- 浏览器外观使用暗色 `theme-color`。
- 入口 HTML 已重新整理为 UTF-8 中文文本，避免乱码和标签断裂。
- 已尽量避免打开文件夹后立刻触发额外写权限确认；浏览器原生权限提示本身无法用 CSS 控制。

## 已验证

- `npx tsc --noEmit` 通过。
- `npm run build` 通过。
- `npm run verify` 可一次执行类型检查与生产构建。
- `npm ls --depth=0` 通过，顶层依赖只有 `vite` 和 `typescript`。
- 约束审计通过：源码/配置中未发现 React、Tailwind、Electron、Express、server、auth/login、IndexedDB、fetch/axios、`alert/confirm/prompt`。
- Playwright 模拟流程验证过：
  - 打开文件夹
  - 新增日志
  - 写入 JSON
  - 标记完成
  - 未选文件夹时点击右下角 `+`，选完文件夹后自动展开新增面板
  - 点击活动卡片非按钮区域完成
  - 显示祝贺动画
  - 重新激活
  - console error 为 0
- 最新一次自动烟测结果：新增后生成 1 个 `.omegalog.json`，状态为 `active`；点击卡片完成后 JSON 状态为 `done`，`completedAt` 为字符串，完成计数为 1，console error 为 0。
- 排序专项烟测通过：最新创建、最紧张、进行中优先、已完成优先四种顺序均符合文案，console error 为 0。
- 最新 Edge DevTools 烟测通过：权重按钮写回 JSON，新增任务写入 `tags`、`weight`、`coverVariant`、`coverDataUrl`，状态筛选真实生效，搜索可搜标签/内容，分页与每页数量按钮真实生效，焦点事件按高权重优先，console error 为 0。
- 响应式专项验证：`1680px` 保持左右双栏，`1280px` 自动改为上下布局，`390px` 移动端新增面板不遮挡 FAB；三种视口均无横向溢出，console error 为 0。
- 操作列专项验证：按用户 100% 截图宽度复测 `1874px`，以及 `1680px`、`1280px`、`390px`；右侧“调整/完成”按钮均在可视区内，无横向溢出，console error 为 0。
- Playwright 模拟过延迟写入下双击活动卡片，确认同一记录只写入一次。
- 桌面和移动端截图检查过，移动端 FAB 遮挡卡片按钮的问题已修。
- 移动端新增面板专项验证：`390x844` 视口下，页面无横向溢出，面板与 FAB 不重叠，间距约 `22px`，FAB 可再次点击关闭，console error 为 0。
- 桌面新增面板专项验证：`1440x900` 视口下面板与 FAB 不重叠，FAB 可再次点击关闭，console error 为 0。
- 桌面横向溢出专项验证：`1440x900` 视口下 `scrollWidth == clientWidth`，长链接备注不会造成横向滚动，console error 为 0。
- 不支持 File System Access API 专项验证：提示文案显示，打开按钮和 FAB 禁用，console error 为 0。
- 损坏 JSON 专项验证：坏 `.omegalog.json` 被跳过并产生 1 条 warning，有效日志正常显示，console error 为 0。
- 刷新持久化专项验证：新增后刷新并重新打开同一模拟文件夹仍加载 1 条 active；完成后再次刷新仍为 `done`，`completedAt` 为字符串，console error 为 0。
- 调整事件专项验证：修改标题、备注、截止时间后写回同一 JSON；刷新并重新打开后仍显示调整后的标题和备注，console error 为 0。
- 重新激活专项验证：已完成事件点击“重新激活”后写回 `status: "active"`、`completedAt: null`；刷新后仍为 active，console error 为 0。
- 文件名格式专项验证：新增文件名匹配 `YYYY-MM-DD_HH-mm-ss_<id>.omegalog.json`，`createdAt` 可解析，console error 为 0。
- 祝贺动画时长专项验证：完成后约 `177ms` 内显示，overlay 可见约 `2512ms` 后隐藏，粒子节点清空，console error 为 0。
- Escape 关闭面板专项验证：面板隐藏、FAB 恢复 `+`、`aria-expanded=false`，Cancel/取消按钮数量为 0，console error 为 0。
- 空状态专项验证：未打开文件夹前显示“选择一个文件夹。每条日志都会成为一个真实文件。”；打开空文件夹后显示“还没有日志。创建第一条。”，total 为 0，console error 为 0。
- 计数专项验证：2 条 active、1 条 done、1 个无关文件时，total=3、active=2、completed=1，卡片数量匹配，console error 为 0。
- 焦点面板专项验证：多条 active 时按高权重优先、再按截止时间选择焦点；全部完成后显示“暂无进行中事件 / 所有任务已归档”，console error 为 0。
- 编码专项验证：源码与文档中未发现 Unicode replacement character 或已知 mojibake 片段；`npm run verify` 通过。
- 安全专项验证：用户曾贴出的第三方 API key 未写入项目文件或文档；项目内未发现第三方 API 配置。
- 本地开发服务器验证：`http://127.0.0.1:5176/` 返回 `200`，页面内容包含 `OMEGALOG`。
- 当前版本预览截图已生成：`test-results/omegalog-desktop.png`、`test-results/omegalog-mobile.png`。
- 预览截图文件验证：desktop 为 `1440x900`、约 `1.34MB`；mobile 为 `390x1247`、约 `0.45MB`；均非空图。
- `.gitignore` 包含 `test-results/`，预览截图不会进入源码产物；同时允许 `src/assets/*.png` 作为项目资产。

## 完成审计

当前目标可以拆成两部分：

1. 做出一个可运行、可写本地文件、中文化、金色图书馆风格的 Omegalog 产品。
2. 按用户最新提供的 `Image #1` 目标参考图重排界面。
3. 把“看起来像按钮”的 UI 都改成真实可用交互，并加入标签、权重和事件头图能力。

第一部分已有真实证据支撑：源码、构建、自动烟测、排序专项烟测、文件读写路径和本地图片资产均已检查。

第二部分已有明确方向：目标图展示的是顶部大号 serif `OMEGALOG`、金色图书馆背景、左侧焦点事件卡、右侧事件档案表格。当前代码已按这个结构重写布局，并用浏览器截图和桌面/移动端度量继续对齐。

第三部分已有真实交互支撑：筛选、表头排序、权重加减、分页、每页数量切换、调整事件、完成、重新激活、生成头图都绑定到了数据读写或视图状态，不再只是静态装饰。

## 背景资产

- 当前使用：`src/assets/omegalog-library-v2.png`
- 保留回退：`src/assets/omegalog-library.png`
- 焦点插图：`src/assets/omegalog-focus-desk-v1.png`
- 生成方式：内置 `image_gen` 工具。
- 生成方向：16:9 金色宏伟图书馆、暗色档案/指挥中心氛围、无文字、无人物、无 UI mockup。
- 文件检查：`1757x895`，`Format24bppRgb`，约 `2.1MB`。
- 抽样亮度：上部 luma `55.8`，中部 `35.3`，底部 `11.6`，符合“上方金色光感、下半部可读暗区”的背景需求。
- 浏览器验证：`/src/assets/omegalog-library-v2.png` 返回 `200`，`.ambient-bg` 的 computed background 包含 `omegalog-library-v2`，console error 为 `0`。

## 运行方式

```bash
npm install
npm run dev
```

验收前可以先运行：

```bash
npm run verify
```

## 手动烟测清单

1. 打开页面，点击“打开日志文件夹”。
2. 选择一个本地文件夹。
3. 点击右下角 `+`，新增一条日志。
4. 确认该文件夹内出现 `.omegalog.json` 文件。
5. 刷新页面，重新打开同一文件夹，确认日志仍能加载。
6. 点击活动卡片非按钮区域，或点击“标记完成”。
7. 确认 JSON 写回 `status: "done"` 和 `completedAt`。
8. 确认全屏祝贺动画出现并自动消失。
9. 对已完成事件点击“重新激活”，确认状态回到进行中。

## 要求到产物的审计清单

| 要求 | 证据 |
| --- | --- |
| Vite + vanilla TypeScript | `package.json`、`src/main.ts` |
| 无后端、无数据库、无认证、无 Tailwind | 只有前端源码和 Vite 依赖 |
| 打开本地日志文件夹 | `src/main.ts` 中 `showDirectoryPicker({ mode: 'readwrite' })` |
| 扫描 `.omegalog.json` | `loadFolder()` 只读取后缀匹配文件 |
| 解析失败不崩溃 | `loadFolder()` 中 `try/catch` 和 `console.warn` |
| 新增日志写入本地文件 | `getFileHandle(..., { create: true })` 与 `writeEntry()` |
| 文件名格式 | `formatDateForFilename()` + `_<id>.omegalog.json` |
| 卡片按创建时间默认倒序 | `currentSortMode = 'created'` 与 `getSortedRecords()` |
| 排序模式不重复 | `urgent` 按截止时间优先，`active` 按进行中分组后再按创建时间 |
| 显示 total/active/completed | `count-total`、`count-active`、`count-completed` |
| 右下角加号打开面板，再点关闭 | `add-log-fab`、`toggleComposer()` |
| 未选文件夹时点击加号 | `shouldOpenComposerAfterFolder` 在选目录成功后调用 `openComposer()` |
| 无 Cancel 按钮 | `index.html` 的表单只有提交按钮 |
| 面板快捷关闭 | `src/main.ts` 监听 `Escape` 后调用 `closeComposer()` |
| 标记完成写回 JSON | `completeLog()` 写入 `status: 'done'` 和 `completedAt` |
| 点击卡片完成 | 活动卡片非按钮区域点击会调用 `completeLog()` |
| 已完成事件继续可处理 | 已完成卡片包含“调整”和“重新激活” |
| 已完成卡片简洁 | 已完成时间只在卡片主体展示一次 |
| 防重复写入 | `pendingRecordIds` 避免同一记录完成/重新激活重复触发 |
| 倒计时 | `formatCountdownText()`、`startCountdownTicker()` |
| 祝贺动画 | `showCongratulations()`、`#congrats-overlay` |
| 中文 UI | `index.html` 与 `src/main.ts` 用户可见文本 |
| 未打开文件夹空状态居中 | `#welcome-view` 使用 `justify-self: center` |
| 顶部排版对齐 | `.hero`、打开按钮和 `.console-frame` 共用 `.app-shell` 左边缘 |
| 主工作台比例 | 桌面度量：shell/frame 宽 `1280px`，focus 宽约 `507px`，grid 宽约 `705px` |
| 金色图书馆视觉 | `src/assets/omegalog-library-v2.png` 与 `src/style.css` |
| 移动端适配 | `src/style.css` 的 `@media` 规则 |
| 应用内无白色弹窗 | 源码无 `alert/confirm/prompt` |
| 交互状态可审计 | FAB 使用 `aria-expanded`，排序按钮使用 `aria-pressed`，完成动画同步 `aria-hidden` |
| 日志列表语义 | `log-list` 使用 `role="list"`，动态卡片使用 `role="listitem"` |
| 页面主内容语义 | 顶层 `.app-shell` 使用 `<main>` |
| 表单标题语义 | `log-form` 使用 `aria-labelledby="log-form-title"` |
| 浏览器外观 | `index.html` 设置 `theme-color` 为暗色背景 |
| 入口文本稳定 | `index.html` 为干净 UTF-8 中文文本，`npm run verify` 通过 |

## 仍需人工确认的点

目标图已由用户在对话中提供；本地工作区没有单独保存目标图文件，因此精确像素对照仍以对话中的图片为准。当前可用于对照的本地预览截图是：

- `test-results/omegalog-reference-desktop.png`
- `test-results/omegalog-desktop.png`
- `test-results/omegalog-mobile.png`

后续若继续追求更接近参考图，建议按以下顺序微调：

1. 背景构图与亮暗比例。
2. 标题、按钮和面板的垂直位置比例。
3. 档案台容器的宽度、高度、透明度和边框。
4. 焦点卡与档案列表行的大小、间距、按钮位置。
5. 移动端首屏与 FAB 是否遮挡。
