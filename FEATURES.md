# Kiloview Decoder Companion 模块功能说明

> 模块：`companion-module-kiloview-decoder` v1.0.2  
> 适用设备：D350、D260、RD350、RD260（decoder-hi3536 固件）  
> API 基址：`http://<设备IP>:99/api/`  
> 参考：`decoder-hi3536/multiview/src/interface/RegistHttpsRoute.cpp`、`decoder-hi3536/api/Dxx解码器Api文档.md`

---

## 1. 模块概览

本模块通过 HTTP API 控制 Kiloview Dxx 系列多画面解码器，面向导播/现场控制场景（Companion 按钮、反馈、变量、预设）。

| 项目 | 说明 |
|------|------|
| 连接方式 | HTTP，默认端口 99 |
| 鉴权 | `POST /users/login`，请求头 `app` 携带 `{user, token, language}` |
| 状态轮询 | 可配置；设备状态默认 1s，源列表默认 10s |
| 断线重连 | 连接失败后 30s 自动重试 |

---

## 2. 已实现功能（Companion 暴露）

### 2.1 Actions（21 个）

| 分类 | Action ID | 名称 | 对应 API |
|------|-----------|------|----------|
| 系统 | `refreshStatus` | 刷新设备状态 | 轮询 `info/get`、`output/*`、`preview/get` 等 |
| 系统 | `reboot` | 重启设备 | `GET /sys/reboot` |
| 系统 | `restore` | 恢复出厂设置 | `GET /sys/restore` |
| 布局 | `selectLayout` | 切换布局 | `POST /layout/select` |
| 布局 | `saveLayout` | 保存布局 | `POST /layout/save` |
| 布局 | `reloadLayout` | 重新加载布局（丢弃未保存修改） | `POST /layout/reload` |
| 输出/源 | `assignSource` | 分配源到窗口 | `POST /output/source/set` |
| 输出/源 | `removeSource` | 移除窗口源 | `POST /output/source/remove` |
| 输出/源 | `setResolution` | 设置输出分辨率 | `POST /output/resolution/set` |
| 输出/源 | `setMute` | 窗口静音 | `POST /output/mute/set` |
| 输出/源 | `startStream` | 开始播放流 | `POST /source/streams/startPlay` |
| 输出/源 | `stopStream` | 停止播放流 | `POST /source/streams/stopPlay` |
| 源发现 | `refreshSources` | 刷新源列表 | `GET /source/refresh` |
| NDI | `addNdiManualIp` | 添加 NDI 手动发现 IP | `GET /ndi/discovery/all` + `POST /ndi/discovery/manual/add` |
| NDI | `addNdiDiscoveryServer` | 添加 NDI Discovery Server | `POST /ndi/discovery/server/add` |
| 预监 | `assignPreviewSource` | 分配源到预监 | `POST /preview/source/modify` |
| 预监 | `removePreviewSource` | 移除预监源 | `POST /preview/source/remove` |
| 混音 | `setAudiomixEnable` | 混音开关 | `POST /output/audiomix/set` |
| 混音 | `setAudiomixVolume` | 混音音量（-51 ~ 20 dB） | `POST /output/audiomix/set` |
| PTZ | `ptzStorePreset` | 存储 PTZ 预设 | `POST /ptz/set`（`ptz_store_preset`） |
| PTZ | `ptzRecallPreset` | 调用 PTZ 预设 | `POST /ptz/set`（`ptz_recall_preset`） |

**说明：**

- 下拉选项（输出、布局、窗口、分辨率、流、预监位）随轮询动态更新。
- PTZ 仅对支持 NDI PTZ 的源有效（与 Web UI 行为一致）。
- 未实现 `sys/reset`（软重置，区别于 `restore` 恢复出厂）。

### 2.2 Feedbacks（8 个）

| Feedback ID | 名称 | 判断条件 |
|-------------|------|----------|
| `currentLayout` | 输出布局已激活 | 输出当前 `layout_id` 与选项一致 |
| `streamConnected` | 窗口流已连接 | 窗口 `status === 2`（Connected） |
| `streamNameMatch` | 窗口正在播放指定流 | 窗口 `stream_id` 匹配 |
| `resolutionMatch` | 输出分辨率匹配 | 输出 `res_id` 匹配 |
| `layoutModified` | 布局有未保存修改 | 输出 `modified === true` |
| `previewStreamConnected` | 预监流已连接 | 预监位 `status === 2` |
| `previewStreamMatch` | 预监正在播放指定流 | 预监位 `stream_id` 匹配 |
| `audiomixEnabled` | 混音流已启用 | audiomix 列表中对应流 `enable === true` |

流状态标签：`0` 未连接 / `1` 连接中 / `2` 已连接 / `3` 失败 / `4` 性能受限。

### 2.3 Variables

**设备级（固定）：**

- `alias` — 登录用户别名  
- `device_name`、`firmware_version`、`hardware_version`、`serial_number`、`software_version`

**按输出动态（连接后生成）：**

- `output_<id>_name`、`layout_id`、`layout_name`、`resolution`、`modified`  
- `output_<id>_pos_<n>_stream_name`、`stream_status`、`resolution`

**按预监位动态：**

- `preview_<id>_stream_name`、`stream_status`

### 2.4 Presets（内置按钮）

| 分类 | 内容 |
|------|------|
| Layouts | 每个布局一个切换按钮（带 `currentLayout` 反馈） |
| Layout | Save Current Layout |
| Sources | Refresh、NDI 发现、每路流的 Start/Stop/Remove |
| Output 1/2 Sources | 每窗口 × 每路流的分配按钮（带 streamNameMatch 反馈） |
| PTZ | Recall PTZ 0–3（默认输出 1、窗口 1、速度 0.5） |
| System | Refresh Status、Reboot Device |

### 2.5 HTTP 客户端已实现、但未暴露为 Action 的 API

`src/kiloview.js` 中已有封装，后续版本可直接挂 Action/Variable：

| 方法 | API | 用途 |
|------|-----|------|
| `reset()` | `GET /sys/reset` | 软重置 |
| `getDeviceName` / `setDeviceName` | `/sys/device/*` | 设备名称 |
| `modifyLayout` | `POST /layout/modify` | 修改布局几何/属性 |
| `addSourceStream` / `modifySourceStream` / `removeSourceStream` | `/source/groups/streams/*` | 源组 CRUD |
| `getNdiDiscoveryAll` / `getNdiDiscoverySources` | NDI 发现查询 | 状态变量/反馈 |
| `getOutputInterfaces` / `setOutputInterfaces` | 输出接口绑定 | HDMI/SDI 等 |
| `setVumeter` | `/output/vumeter/set` | 音柱显示 |
| `getBorder` / `setBorder` | 窗口边框 | OSD |
| `getBackground` / `setBackground` | 输出背景 | 背景图/色 |
| `ptzControl` | `/ptz/set` | 完整 PTZ 控制（见下文） |
| `getNetwork` / `pingNetwork` | 网络 | 诊断 |
| `getReportCodecInfo` / `getReportSystemInfo` | 报表 | 编解码/系统信息 |

---

## 3. D350 设备 HTTP API 能力（可对外暴露）

以下按固件路由与官方 API 文档整理。**「模块 v1.0」** 列表示当前 Companion 模块是否已对用户开放。

### 3.1 INFO / 固件

| API | 功能 | 模块 v1.0 |
|-----|------|-----------|
| `GET /info/get` | 设备信息（名称、版本、SN） | ✅ 轮询 + 变量 |
| `POST /firmware/upgrade` | 固件升级 | ❌ |
| V1 兼容：`*.json` 系列 | 旧版 JSON API | ❌（Companion 使用 REST） |

### 3.2 用户 / 鉴权

| API | 功能 | 模块 v1.0 |
|-----|------|-----------|
| `POST /users/login` | 登录 | ✅ 连接时 |
| `POST /users/logout` | 登出 | ❌ |
| `GET /users/list` | 用户列表 | ❌ |
| `POST /users/add` / `remove` / `modify` | 用户管理 | ❌ |
| `GET /users/session/check` | Token 校验 | ✅ 内部重登 |
| `GET /auth/check` | 鉴权探测 | ✅ 客户端有封装 |
| `GET/POST /users/auth_info_*` | 免验证开关 | ❌ |

### 3.3 源（SOURCE）

| API | 功能 | 模块 v1.0 |
|-----|------|-----------|
| `GET /source/groups/list` | 源组与流列表 | ✅ 轮询 + 下拉 |
| `GET /source/refresh` | 触发源发现刷新 | ✅ Action |
| `POST /source/streams/startPlay` | 开始拉流 | ✅ Action |
| `POST /source/streams/stopPlay` | 停止拉流 | ✅ Action |
| `POST /source/groups/add` | 新建源组 | ❌ |
| `POST /source/groups/rename` | 重命名源组 | ❌ |
| `POST /source/groups/remove` | 删除源组 | ❌ |
| `POST /source/groups/streams/add` | 手动添加流（RTSP/SRT/NDI 等） | ❌ |
| `POST /source/groups/streams/modify` | 修改流参数 | ❌ |
| `POST /source/groups/streams/remove` | 删除流 | ❌ |
| `POST /source/groups/streams/copy` | 复制流 | ❌ |
| `POST /source/groups/streams/move` | 移动流 | ❌ |
| `POST /source/groups/streams/batchAddStream` | 批量添加 | ❌ |
| `GET /source/getKiloklnkIp` | KiloLink IP | ❌ |

**可扩展价值：** 在 Companion 上「一键添加 RTSP/NDI 源」、按组管理源，适合固定机位场景。

### 3.4 NDI 发现

| API | 功能 | 模块 v1.0 |
|-----|------|-----------|
| `GET /ndi/discovery/all` | 所有发现方式配置 | ✅ 内部（手动 IP 合并） |
| `GET /ndi/discovery/sources` | 按方式列出 NDI 源 | ❌ |
| `POST /ndi/discovery/manual/add` | 手动 IP 列表 | ✅ Action（追加 IP） |
| `POST /ndi/discovery/auto/add` | 自动发现目标 | ❌ |
| `POST /ndi/discovery/server/add` | Discovery Server | ✅ Action |
| `POST /ndi/discovery/auto/del` | 删除自动发现项 | ❌ |
| `POST /ndi/discovery/server/del` | 删除 Server 项 | ❌ |

**可扩展价值：** 列出当前 NDI 源、删除发现规则、变量显示发现状态。

### 3.5 布局（LAYOUT）

| API | 功能 | 模块 v1.0 |
|-----|------|-----------|
| `GET /layout/list` | 布局列表 | ✅ 轮询 + 下拉 |
| `GET /layout/template/list` | 布局模板 | ❌ |
| `POST /layout/select` | 切换布局 | ✅ Action |
| `POST /layout/save` | 保存 | ✅ Action |
| `POST /layout/reload` | 重载 | ✅ Action |
| `POST /layout/modify` | 修改布局（窗口几何等） | ❌ |
| `POST /layout/add` | 新建布局 | ❌ |
| `POST /layout/remove` | 删除布局 | ❌ |
| `POST /layout/rename` | 重命名 | ❌ |
| `POST /layout/resave` | 另存为 | ❌ |

**可扩展价值：** 从模板创建布局、重命名；高级场景需 `layout/modify` 配合自定义窗口。

### 3.6 输出（OUTPUT）

| API | 功能 | 模块 v1.0 |
|-----|------|-----------|
| `GET /output/list` | 输出列表 | ✅ 轮询 |
| `GET /output/get` | 输出详情（各窗口源、状态） | ✅ 轮询 + 反馈/变量 |
| `POST /output/source/set` | 分配源 | ✅ Action |
| `POST /output/source/remove` | 移除源 | ✅ Action |
| `GET /output/resolution/list` | 分辨率列表 | ✅ 轮询 |
| `POST /output/resolution/set` | 设置分辨率 | ✅ Action |
| `POST /output/mute/set` | 窗口静音 | ✅ Action |
| `GET /output/audiomix/get` | 混音状态 | ✅ 轮询 |
| `POST /output/audiomix/set` | 混音参数 | ✅ Action |
| `POST /output/audiomix/add` | 添加混音路 | ❌ |
| `POST /output/audiomix/remove` | 移除混音路 | ❌ |
| `POST /output/audio/sound` | 音频测试音 | ❌ |
| `POST /output/vumeter/set` | 音柱 | ❌ |
| `GET/POST /output/interfaces/*` | 物理接口绑定（HDMI/SDI 等） | ❌ |
| `GET/POST /output/border/*` | 窗口边框 OSD | ❌ |
| `GET/POST /output/background/*` | 输出背景 | ❌ |
| `POST /output/audio/check` | 音频检测 | ❌ |
| `GET/POST /output/ts/program/*` | MPEG-TS 节目/音轨选择 | ❌ |

**D350 说明：** 多路 HDMI/SDI 输出、窗口边框/背景、TS 流多节目选择在 Web UI 中可用，Companion 尚未覆盖。

### 3.7 预监（PREVIEW）

| API | 功能 | 模块 v1.0 |
|-----|------|-----------|
| `GET /preview/get` | 预监列表 | ✅ 轮询 |
| `POST /preview/source/modify` | 添加/修改预监源 | ✅ Action |
| `POST /preview/source/remove` | 移除预监源 | ✅ Action |
| `POST /preview/sort` | 预监排序 | ❌ |

### 3.8 PTZ（NDI 源）

统一入口：`POST /ptz/set`，`type` 字段区分操作。

| type | 功能 | 模块 v1.0 |
|------|------|-----------|
| `ptz_store_preset` | 存储预设 | ✅ Action |
| `ptz_recall_preset` | 调用预设 | ✅ Action |
| `ptz_pan_tilt` | 绝对 Pan/Tilt | ❌ |
| `ptz_pan_tilt_speed` | Pan/Tilt 速度 | ❌ |
| `ptz_zoom` | 绝对 Zoom | ❌ |
| `ptz_zoom_speed` | Zoom 速度 | ❌ |
| `ptz_focus` / `ptz_focus_speed` | 对焦 | ❌ |
| `ptz_auto_focus` | 自动对焦 | ❌ |
| `ptz_white_balance_*` | 白平衡（auto/indoor/outdoor/oneshot/manual） | ❌ |
| `ptz_exposure_auto` / `ptz_exposure_manual` | 曝光 | ❌ |
| `ptz_is_supported` | 是否支持 PTZ | ❌ |

**可扩展价值：** 摇杆式 Pan/Tilt/Zoom（需按住/释放或变量驱动）、对焦/白平衡快捷按钮。

### 3.9 系统（SYSTEM）

| API | 功能 | 模块 v1.0 |
|-----|------|-----------|
| `GET /sys/reboot` | 重启 | ✅ Action |
| `GET /sys/reset` | 软重置 | ❌ |
| `GET /sys/restore` | 恢复出厂 | ✅ Action |
| `GET/POST /sys/device/*` | 设备名称 | ❌ |
| `GET/POST /sys/ip/*` | IP 替换工具 | ❌ |
| `GET/POST /sys/preset/*` | 系统预设位 | ❌ |

### 3.10 维护（MAINTENANCE）

| API | 功能 | 模块 v1.0 |
|-----|------|-----------|
| `GET /maintenance/usage_get` | 资源使用率 | ❌ |
| `GET/POST /maintenance/reboot/*` | 定时重启 | ❌ |
| `GET/POST /maintenance/screen/*` | 熄屏设置 | ❌ |
| `GET /maintenance/log/download` | 日志下载 | ❌ |

### 3.11 网络（NETWORK）

| API | 功能 | 模块 v1.0 |
|-----|------|-----------|
| `GET /network/get` | 网络信息 | ❌ |
| `POST /network/set` / `modify` | 修改网络 | ❌ |
| `POST /network/ping` | Ping 诊断 | ❌ |
| `GET/POST /network/http/*` | HTTP 服务配置 | ❌ |
| `GET/POST /network/routing/*` | 静态路由 | ❌ |
| `POST /klnk/network/set` | KiloLink 网络（需 kiloview 头） | ❌ |

### 3.12 时间 / 区域（SYSTIME）

| API | 功能 | 模块 v1.0 |
|-----|------|-----------|
| `GET /timeregion/settings` | 时区/时间 | ❌ |
| `POST /timeregion/time/set` | 设置时间 | ❌ |
| `POST /timeregion/timezone/set` | 设置时区 | ❌ |

### 3.13 报表 / 监控（REPORT）

| API | 功能 | 模块 v1.0 |
|-----|------|-----------|
| `GET /report/codec_info` | 编解码信息 | ❌ |
| `GET /report/system_info` | 系统信息 | ❌ |
| `GET /report/get_network` | 网络接口详情 | ❌ |
| `GET /report/get_recording_status` | 录制状态 | ❌（**D350 无录制，固定返回值**） |
| 兼容路径 `/codec/report/*`、`/systemctrl/report/*` 等 | 对齐其他产品线 | ❌ |

**可扩展价值：** CPU/内存/解码路数变量，适合监控页。

### 3.14 其他（Web UI / 内部）

| API | 功能 | 模块 v1.0 | 备注 |
|-----|------|-----------|------|
| `GET/POST /overlay/*` | Overlay 图层 | ❌ | API 文档有，当前 `RegistHttpsRoute` 未注册 |
| `GET/POST /guide/*` | 首次引导 | ❌ | 一般不需 Companion |
| `POST /file/upload/*`、`GET /file/download/*` | 文件上传下载 | ❌ | 背景图等 |
| `GET /webrtc/sdp/get` | WebRTC 预监 | ❌ | 浏览器预监用 |
| `GET /proxy/decoder` | 代理信息 | ❌ | 内部 |
| `POST /maintenance/setdevspeed` 等 | 产测 | ❌ | 无鉴权，不适合暴露 |

---

## 4. 实现覆盖统计

| 维度 | 已实现 | 设备 API 合计（约） | 覆盖率 |
|------|--------|---------------------|--------|
| Actions | 21 | — | 核心导播路径已覆盖 |
| Feedbacks | 8 | — | 布局/源/预监/混音主场景 |
| Variables | 设备 + 动态输出/预监 | — | 未含网络/报表/PTZ 实时量 |
| HTTP 路由（RegistHttpsRoute） | ~25 个被模块使用 | ~90+ | 约 **28%** 路由有 Companion 入口 |

> 覆盖率按「路由是否有 Action/Feedback/Variable 入口」估算，非按使用频率。导播最常用的切布局、换源、预监、混音、NDI 发现、PTZ 预设已在 v1.0 覆盖。

---

## 5. 建议后续版本优先级

### P1 — 现场导播增强

1. **PTZ 连续控制**：`ptz_pan_tilt_speed`、`ptz_zoom_speed`（配合 Companion 旋转编码器或按住按钮）  
2. **源管理**：`streams/add`、`streams/remove` — 快速添加/删除 RTSP、NDI 手动源  
3. **NDI 源列表变量**：`GET /ndi/discovery/sources` — 按钮显示「源是否在线」  
4. **混音 add/remove**：完整混音路管理（当前仅 enable/volume）

### P2 — 输出与画面

1. **窗口边框/背景**：`border/*`、`background/*`  
2. **输出接口绑定**：`interfaces/*`（多 HDMI 场景）  
3. **MPEG-TS 节目选择**：`output/ts/program/*`（TS 流多节目）  
4. **布局管理**：`layout/add`、`rename`、`remove`

### P3 — 系统运维

1. **设备名称**、**定时重启**、**资源使用率**变量  
2. **网络 Ping** Action（链路诊断）  
3. **软重置** `sys/reset`（与 restore 区分）

### 不建议放入 Companion

- 固件升级、用户 CRUD、网络/IP 修改（误操作风险高）  
- 产测接口、WebRTC SDP、Guide 引导  
- D350 录制相关（设备无此能力）

---

## 6. 与 4kconverter 模块的差异（简要）

| 项目 | kiloview-decoder（D350） | kiloview-4kconverter（N50/N60） |
|------|--------------------------|----------------------------------|
| 定位 | 多画面解码器 | 编解码一体机 |
| 默认端口 | 99 | 80/443 |
| 核心模型 | 多输出 × 多窗口 × 布局 | 单/双路编解码模式切换 |
| v1.0 特色 | 布局 save/reload、预监、混音、NDI 发现 | 大量编解码预设按钮 |
| API 前缀 | `/api/output/*`、`/layout/*` 等 | `/systemctrl/*`、`/codec/*` 等 |

---

## 7. 相关文件

| 文件 | 说明 |
|------|------|
| `src/actions.js` | Action 定义 |
| `src/feedbacks.js` | Feedback 定义 |
| `src/variables.js` | Variable 定义 |
| `src/presets.js` | 预设按钮 |
| `src/kiloview.js` | HTTP API 客户端 |
| `src/api.js` | 连接、轮询、动态选项 |
| `companion/manifest.json` | 模块清单与适用型号 |
| `companion/HELP.md` | Companion 内帮助页 |

---

*文档生成依据模块 v1.0.2 源码与 decoder-hi3536 固件路由，如有固件升级导致 API 变更，以设备实际路由为准。*
