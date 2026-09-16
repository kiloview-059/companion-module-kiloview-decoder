# 界面测试 Checklist — kiloview-decoder 合并模块

> 用法：在 Companion 界面里照着点一遍。目标是用最少的点击覆盖可见性切换、端到端链路、错误兜底三大风险点，不必穷举 60+ preset。
> 勾选约定：`[ ]` 待测 → `[x]` 通过 → `[!]` 失败（在末尾记录现象）

---

## 0. 测试前准备

- [ ] 模块已通过 `npm run package`（或 `npm pack`）打包并装入 Companion
- [ ] 三台真机就绪：D350、D260、MG300V2（IP 已知、admin/admin 可登录）
- [ ] 打开 Companion 日志面板（Logs），Verbose Logging = ON
- [ ] 准备一个空按钮页面（Grid），便于拖 preset

---

## 1. 可见性切换（核心，最容易翻车）

| # | 操作 | 预期 | 通过 |
|---|---|---|---|
| 1.1 | 新建 connection，Device Type = `Auto detect`，**不连真机**，看 preset 列表 | 仅看到 4 个通用 preset：Refresh / Reboot / Display Device Info / Display IP | [ ] |
| 1.2 | 连上 D350（port 80，admin/admin），等待自动识别 | preset 数量切到 31 个，分类出现 Select Layout / Video Output / Audio Output / Output Source / Source Group / PTZ | [ ] |
| 1.3 | 切到 D260，重复 1.2 | 同 1.2 | [ ] |
| 1.4 | 新建第二个 connection，Device Type = `Media Gateway`，连 MG300V2（port 99） | preset 切到 23 个，分类出现 Gateway Stream / Decode Source，**没有** PTZ / Video Output / Audio Output | [ ] |
| 1.5 | 把 MG300 connection 改 Device Type 回 `Auto detect` 再连一次 | 自动识别为 gateway，preset 与 1.4 一致 | [ ] |

> 失败信号：preset 数量对不上 / Auto detect 长时间不切 / 切了之后旧 preset 仍残留。

---

## 2. Info 类 preset（变量刷新）

| # | Preset | 操作 | 预期 | 通过 |
|---|---|---|---|---|
| 2.1 | Info → **Display Device Info** | 拖到按钮，按下 | 按钮显示 `Name: D350 / FW: 2.20.x / SW: ... / SN: ... / HW: ...`，字段非空 | [ ] |
| 2.2 | Info → **Display IP Address** | 拖到按钮 | 显示 `IP: 192.168.x.x`，与连接配置一致 | [ ] |
| 2.3 | 把 connection label 从 `KV-Decoder` 改成 `Test` | 刷新按钮 | 变量前缀失效（显示 `$(Test:ip)` 字面量），符合预期（文档已说明前缀 = connection label） | [ ] |

---

## 3. General 类 preset（系统动作）

| # | Preset | 设备 | 预期 | 通过 |
|---|---|---|---|---|
| 3.1 | General → **Refresh Device Status** | D350 | 日志显示重新拉取 state/sources，变量刷新 | [ ] |
| 3.2 | General → **Reboot Device** | D260 | 设备真重启（红灯闪），日志无错；重启后自动重连 | [ ] |

---

## 4. Decoder profile — Select Layout 类（D350 固件坑点）

| # | Preset | 设备 | 预期 | 通过 |
|---|---|---|---|---|
| 4.1 | Select Layout → **Select Layout for Output** | D260 | 拖按钮 → 选 Output + Layout → 按下 → output_N_layout_name 变量刷新 | [ ] |
| 4.2 | 同上 | D350（fw ≤ 2.20.0732.1221） | 按下后**被 quirks 拦截**，日志出现 `Select Layout is blocked: D350 firmware ...` 警告，设备不崩 | [ ] |
| 4.3 | Select Layout → **Save Layout** | D260 | 选定 output + layout，按下后 output_N_modified 变量变 false（已保存） | [ ] |
| 4.4 | Select Layout → **Reload Layout** | D260 | 按下后 output_N_modified 变 false，layout 还原到上次保存 | [ ] |
| 4.5 | Select Layout → **Select Layout and Assign Source** | D260 | 选 Layout + Output + Position + Group + Stream，按下后两步串行完成，position 变量更新 | [ ] |

---

## 5. Decoder profile — Output Source 类

| # | Preset | 设备 | 预期 | 通过 |
|---|---|---|---|---|
| 5.1 | Output Source → **Assign Source to Position** | D350 | 选 Output + Position + Group + Stream，按下 → output_N_pos_X_stream_name 变量变新值 | [ ] |
| 5.2 | Output Source → **Remove Source from Position** | D350 | 按下后对应 position stream_name 变空 | [ ] |
| 5.3 | Output Source → **Set Position Mute** | D350 | Mute = true → 设备对应 position 静音；feedback `Audio Interface Muted` 跟随亮 | [ ] |
| 5.4 | Output Source → **Set Output Resolution** | D260 | 选新分辨率，按下 → output_N_resolution 变量更新，feedback `Output Resolution Match` 亮 | [ ] |

---

## 6. Decoder profile — Video / Audio Output 类

| # | Preset | 设备 | 预期 | 通过 |
|---|---|---|---|---|
| 6.1 | Video Output → **Toggle Video Interface** | D260 | 按一次关闭 HDMI，再按一次打开；feedback `Video Interface Enabled` 跟随 | [ ] |
| 6.2 | Video Output → **Set Video Interface Mode** | D260 | 选 HDMI/DVI，按下后接口模式切换，无 502 | [ ] |
| 6.3 | Audio Output → **Set Audio Interface Volume** | D350 | 设 -10 dB，按下后无错（不验证音质） | [ ] |

---

## 7. Decoder profile — Source Group 类

| # | Preset | 设备 | 预期 | 通过 |
|---|---|---|---|---|
| 7.1 | Source Group → **Add RTSP Source** | D350 | 编辑 url 为真机可用的 rtsp://，按下后 sources_count +1，新流出现在下拉 | [ ] |
| 7.2 | Source Group → **Modify Source Stream** | D350 | 选刚才的流，改 name，按下后下拉 label 变更 | [ ] |
| 7.3 | Source Group → **Remove Source Stream** | D350 | 按下后 sources_count -1 | [ ] |
| 7.4 | Source Group → **Start Stream Playback** | D350 | 选刚加的流，按下后无 404，position 状态变 connected | [ ] |
| 7.5 | Source Group → **Stop Stream Playback** | D350 | 按下后 position 状态变 disconnected | [ ] |
| 7.6 | Source Group → **Add NDI Source** | D350 | 拖按钮 → 填 ndi_name + url → 按下 → 无 502，新流加入 group | [ ] |
| 7.7 | Source Group → **NDI: Add Manual IP** | D350 | 填一台已知 NDI 主机 IP，按下后日志无错，group 刷新 | [ ] |
| 7.8 | Source Group → **NDI: Add Discovery Server** | D350（无 Discovery Server 环境） | 不填 IP 直接按 → 日志出现 `NDI discovery server IP is empty` 警告，**不崩模块** | [ ] |

---

## 8. Decoder profile — PTZ 类（仅 NDI 源有效）

| # | Preset | 设备 | 预期 | 通过 |
|---|---|---|---|---|
| 8.1 | PTZ → **Store PTZ Preset** | D350 + NDI 源已分配到某 position | 选 Output + Position + Preset No=0，按下 → 设备返回 200（无 400 layout_id 报错） | [ ] |
| 8.2 | PTZ → **Recall PTZ Preset** | 同上 | 按下 → NDI 源画面回到预设位 | [ ] |

---

## 9. Gateway profile — Gateway Stream 类

| # | Preset | 设备 | 预期 | 通过 |
|---|---|---|---|---|
| 9.1 | Gateway Stream → **Add RTMP Push** | MG300V2 | body 里填真机可达的 rtmp://，按下 → gateway_streams_count +1 | [ ] |
| 9.2 | Gateway Stream → **Start Gateway Push** | MG300V2 | 选刚才的 service + source，按下 → 设备开始推送 | [ ] |
| 9.3 | Gateway Stream → **Stop Gateway Push** | MG300V2 | 按下 → 推送停止 | [ ] |
| 9.4 | Gateway Stream → **Remove Gateway Stream Service** | MG300V2 | 按下 → gateway_streams_count -1 | [ ] |
| 9.5 | Gateway Stream → **Add SRT Push**（任选一种非 RTMP 协议） | MG300V2 | 按下 → 模板 JSON 正确解析，service 新增 | [ ] |

---

## 10. Gateway profile — Decode Source 类

| # | Preset | 设备 | 预期 | 通过 |
|---|---|---|---|---|
| 10.1 | Decode Source → **Add RTSP Source** | MG300V2 | body 填真机 RTSP，按下 → sources_count +1 | [ ] |
| 10.2 | Decode Source → **Remove Decode Source** | MG300V2 | 按下 → sources_count -1 | [ ] |
| 10.3 | Decode Source → **Add UDP Source**（任选一种非 RTSP 协议） | MG300V2 | 按下 → 模板 JSON 正确解析，source 新增 | [ ] |

---

## 11. Gateway profile — 多输出切换

| # | Preset | 设备 | 预期 | 通过 |
|---|---|---|---|---|
| 11.1 | Select Layout → **Select Layout for Output** | MG300V2 | 选 Output + Layout，按下 → output_name 变量更新 | [ ] |
| 11.2 | Output Source → **Set Position Mute** | MG300V2 | 按下 → mute_status 变量更新，feedback `Audio Mute Status` 跟随 | [ ] |

---

## 12. Feedback 验证（无需拖 preset，直接在按钮上加 feedback）

| # | Feedback | 设备 | 预期 | 通过 |
|---|---|---|---|---|
| 12.1 | `Output Layout Active` | D260 | 当前 active layout 在按钮上高亮（默认绿色） | [ ] |
| 12.2 | `Position Stream Connected` | D350 | position 有流时按钮高亮，断流后熄灭 | [ ] |
| 12.3 | `Position Stream Name Match` | D350 | 选定 stream 与 position 实际流匹配时高亮 | [ ] |
| 12.4 | `Output Layout Modified` | D260 | 改了未保存 → 高亮；Save Layout 后熄灭 | [ ] |
| 12.5 | `Video Interface Enabled` | D260 | 接口启用高亮，禁用熄灭（试 Highlight When = False 也生效） | [ ] |
| 12.6 | `Audio Interface Muted` | D350 | 静音高亮，取消静音熄灭 | [ ] |
| 12.7 | `Audio Mute Status`（gateway） | MG300V2 | 全部 position 静音时高亮 | [ ] |
| 12.8 | `Background Type`（gateway） | MG300V2 | background_type=black 时匹配；改成 color 类型后切换匹配 | [ ] |
| 12.9 | `Guide Status (experimental)`（gateway） | MG300V2 | 若固件无 /guide/get 接口 → 变量空 + feedback 不亮，**不报错** | [ ] |

---

## 13. 边界 / 兜底用例

| # | 操作 | 预期 | 通过 |
|---|---|---|---|
| 13.1 | **未连接设备时点 preset** | 模块不崩；日志报连接错误；UI 按钮无响应即可 | [ ] |
| 13.2 | 连接配置 IP 填错（不通的 IP），等 polling 触发 | 日志反复报 timeout，但模块持续运行、可修改配置 | [ ] |
| 13.3 | 把 port 从 80 改成 99（误配置）后连 D350 | 连接失败日志清晰，不崩；改回后恢复 | [ ] |
| 13.4 | D350 上点 `Select Layout and Assign Source`（被 quirks 拦截的固件） | 日志警告，**不发出 HTTP 请求**，设备不崩 | [ ] |
| 13.5 | MG300V2 上拖 `Start Stream Playback` preset | preset 列表里**不应出现**此项（decoder-only）；若出现说明 profile 切换有 bug | [ ] |
| 13.6 | 拖 `Add RTMP Push` 但 body JSON 故意写错（删个引号） | 日志报 JSON parse error，模块不崩 | [ ] |
| 13.7 | 拖 `Add RTSP Source` 但 url 留 `rtsp://*.*.*.*/...`（占位符） | 设备返回错误，模块不崩，日志清晰 | [ ] |
| 13.8 | 模块连续运行 5 分钟，观察内存占用 | 无明显泄漏（Companion 进程内存稳定） | [ ] |

---

## 14. Migration（从旧模块升级）

| # | 操作 | 预期 | 通过 |
|---|---|---|---|
| 14.1 | 用旧 `kiloview-decoder` v1.x 的配置备份恢复到本模块 | 旧 action id 被迁移脚本映射为新 id，按钮可用 | [ ] |
| 14.2 | 用旧 `kiloview-mediagateway` 的配置备份恢复到本模块 | gateway action id 迁移成功 | [ ] |
| 14.3 | 迁移后检查日志 | 出现 `Migration: ...` 信息行，无 ERROR | [ ] |

---

## 15. 完成判定

通过条件（**全部满足**才算过关）：
- [ ] §1 可见性切换 5 项全过
- [ ] §4.2 D350 quirks 拦截生效
- [ ] §13.5 gateway profile 无 decoder-only preset 泄漏
- [ ] §13.1 / 13.6 / 13.7 三项兜底不崩模块
- [ ] §14 Migration 至少跑通一种旧模块
- [ ] 全程无 Companion 进程崩溃、无未捕获异常 stack trace

任一项失败：记录现象 → 修代码 → 重打包 → 仅复测相关项 + §1。

---

## 附录：失败记录区

```
# 在这里记录失败项，格式：
# [编号] 现象 / 复现步骤 / 设备 / 固件版本 / 日志片段

```
