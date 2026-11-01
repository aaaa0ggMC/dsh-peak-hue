# dsh-peak-hue · 峰谷换色

给 DeepSeek Harness 的鲸鱼 logo 按 **DeepSeek API 的峰谷时段**换色。

> 2026-08-17 起 DeepSeek API 分峰谷计价，社区把梁文锋叫成两个名字：
> 峰时是 **梁文峰**（价格翻倍），谷时是 **梁文谷**（价格减半）。
> 这只鲸鱼跟着走 —— 谷时深蓝，峰时告警红。

| 时段（北京时间，每日） | 梗 | 颜色 |
|---|---|---|
| 09:00–12:00、14:00–18:00 | 梁文峰（峰） | 红 `#E5484D` |
| 其余时间 | 梁文谷（谷） | 蓝 `#4D6BFE` |

## 它做了什么

占住 Web 客户端的两个品牌 slot：

- `sidebar.brand.mark` — 侧栏展开时的 mark 和收起后的 rail；
- `conversation.hero.brand.mark` — 空白会话标题前的那只鲸鱼。

> **侧栏为什么要 `priority: -1`**：single slot 的规则是按 `priority` 升序排、
> 只让第一条 active。official 构建里 `dsh-client-ui-brand-official` 已经先占了
> `sidebar.brand.mark`（侧栏那只 +「deepseek HARNESS」字标），默认 priority 0
> 注册只会排在它后面被静默忽略——表现就是“主页面变了、侧栏没变”。

两个 mark 都用官方鲸鱼轮廓的同一份 path 画出来，`fill: currentColor`，
颜色每 15 秒按 `Asia/Shanghai` 重算（切回前台也会立刻重算，过整点后最多
十几秒变过来）。不依赖浏览器本地时区，不联网，不写任何存储。

> 占住 hero slot 会替换掉壳里那条**动画**鲸鱼，换成本插件的静态着色鲸鱼。
> 想要动画就别装它 —— 这是唯一的代价。

## 安装

```sh
# 在本仓库目录里
dsh plugin install .
```

或者让它以 bundle 形式进 profile（和别的插件一样：装完即热更新，客户端
模块由 HMR 送进已打开的页面）：

```
plugin_manager install_bundle  →  ~/Projs/dsh-peak-hue
```

## 卸载

```sh
dsh plugin remove dsh-peak-hue
```

## 结构

```
index.js           host 半边：空实现，只提供 Loader 行
client.js          全部逻辑：时段判断 + 两个 slot 的着色鲸鱼
cordis.patch.yml   一行 insert
locale/{en,zh}.json 插件列表里的标题与说明
icon.svg           原创图标（蓝/红对半 + 峰线）
```

## 边界

- 只认“每日”时间表，不判断周末与法定节假日（DeepSeek 当前公告就是每日两段）。
- 颜色写死在 `client.js` 顶部（`PEAK_COLOR` / `VALLEY_COLOR`），没做设置项 ——
  两个常量，改完热更新即可。
- 不碰文字 wordmark，只给鲸鱼上色。

## License

MIT
