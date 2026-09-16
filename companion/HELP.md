# Kiloview Decoder — Help

This Companion module controls two families of Kiloview devices from a single
connection:

- **Decoder** profile — D350 / D260 / RD350 / RD260 multiview decoders
- **Gateway** profile — MG300V2 / RMG300V2 media gateways

Pick the **Device Type** in the connection config (or leave it on **Auto detect**
and the module will identify the device after login). The actions, feedbacks,
variables and presets available change depending on the detected/selected type.

## Using variables

Reference variables in button text or actions as `$(KV-Decoder:variable)`,
e.g. `$(KV-Decoder:ip)` for the device IP or `$(KV-Decoder:device_name)` for
the device name. The prefix is the **connection label** — it defaults to
`KV-Decoder`; if you rename the connection, update the prefix accordingly.
Variables are populated by polling, so enable **Polling** and make sure the
connection is up.

## Configuration

| Field | Description |
|---|---|
| Device Type | `Auto detect`, `Dxx Decoder`, or `Media Gateway` |
| Device IP / Host | Hostname or IP of the device |
| Protocol | `http` or `https` |
| Port | Decoder default `80`, gateway default `99` |
| Use Authentication | Enable username/password login |
| Username / Password | Device credentials (default `admin` / `admin`) |
| Polling | Enable periodic state/source polling (required for feedbacks and variables) |
| Polling Rate (state) | How often to refresh device state (ms, default `1000`) |
| Polling Rate (sources) | How often to refresh the source list (ms, default `10000`) |
| Verbose Logging | Extra debug output to the log |

---

# Decoder profile (D350 / D260 / RD350 / RD260)

A multiview decoder renders multiple network streams into HDMI/SDI outputs
with selectable layouts, per-position audio mixing and PTZ control for NDI
sources.

## Actions

### System
- **Reboot Device** — restart the device
- **Restore Factory Settings** — restore factory defaults
- **Refresh Device Status** — re-poll state and sources immediately

### Layout
- **Select Layout for Output** — apply a layout to an output (current layout
  is marked `(Active)`)
- **Select Layout and Assign Source** — switch layout then assign a stream to
  a position in one action
- **Save Layout** — persist unsaved output changes to a layout preset
- **Reload Layout** — reload a layout preset, discarding unsaved changes

### Output & Source
- **Assign Source to Position** — put a stream into a window
- **Remove Source from Position** — clear a window
- **Start Stream Playback** — start playback of a stream (`/source/streams/startPlay`)
- **Stop Stream Playback** — stop playback of a stream (`/source/streams/stopPlay`)
- **Set Output Resolution** — set output resolution (current marked Active)
- **Set Position Mute** — mute/unmute a window position (`/output/mute/set`)

### Video Output Interface (HDMI/SDI)
- **Set / Toggle Video Interface Enable**
- **Set Video Interface Mode** (HDMI/DVI, HDMI1/HDMI2 only)
- **Set Video Interface Colorspace** (RGB444 / YCBCR444 / 422 / 420)

### Audio Output Interface (HDMI/SDI/Line Out)
- **Set / Toggle Audio Interface Enable**
- **Set / Toggle Audio Interface Mute**
- **Set Audio Interface Volume** (dB, -51 to 20)

### Source Management
- **Refresh Source List** — re-fetch the source list
- **Add Source Stream** — add an RTSP/RTMP/HTTP/UDP stream to a group
- **Modify Source Stream** — edit an existing stream
- **Remove Source Stream** — delete a stream from a group
- **Add Source Group** / **Remove Source Group**

### NDI
- **Add NDI Source** — add an NDI stream (HB/HX) to a group
- **NDI: Add Manual IP** — register a manual NDI discovery IP
- **NDI: Add Discovery Server** — register an NDI discovery server

### Audiomix
- **Set Audiomix Enable** — enable/disable a stream in output/preview mix
- **Set Audiomix Volume** (dB, -51 to 20)

### Preview
- **Assign Source to Preview** — add a stream to the preview panel
- **Remove Preview Source** — clear a preview slot

### PTZ (NDI sources only)
- **PTZ: Store Preset** — save current PTZ position to a preset slot (0–99)
- **PTZ: Recall Preset** — recall a stored preset with speed 0.0–1.0

## Feedbacks
All boolean feedbacks include a **Highlight When** toggle (`Condition is True`
or `Condition is False`).

- **Output Resolution Match** — output resolution equals selected value
- **Output Layout Active** — selected layout is active on the output
- **Position Stream Connected** — window has a connected stream
- **Position Stream Name Match** — window is playing the selected stream
- **Output Layout Modified** — output layout has unsaved changes
- **Preview Stream Connected** / **Preview Stream Match**
- **Audiomix Stream Enabled**
- **Video Interface Enabled** / **Audio Interface Enabled** / **Audio Interface Muted**

## Variables
`alias`, `device_name`, `ip`, `firmware_version`, `hardware_version`,
`serial_number`, `software_version`, and per output: `output_N_name`,
`output_N_layout_id`, `output_N_layout_name`, `output_N_resolution`,
`output_N_modified`, `output_N_pos_X_stream_name`,
`output_N_pos_X_stream_status`, `output_N_pos_X_resolution`, plus
`preview_X_stream_name`, `preview_X_stream_status`.

---

# Gateway profile (MG300V2 / RMG300V2)

A media gateway decodes network streams and re-encodes/pushes them out as
RTMP/SRT/RTSP/HLS/TS/RTP services, with multi-output switching.

## Actions

### Gateway Push
- **Start Gateway Push** — bind a source to a gateway stream and enable it
- **Stop Gateway Push** — disable an active push (only active pushes listed)
- **Add Gateway Stream Service** — add a push service from a JSON body; the
  Protocol dropdown helps pick a template
- **Remove Gateway Stream Service** — delete a gateway stream

### Multi Out
- **Multi Out Switch** — switch the active output (current marked Active)

### Decode Source (JSON advanced)
- **Add Decode Source (JSON)** — add a decode source from a JSON body; the
  Protocol dropdown helps pick a template (RTMP/RTSP/UDP/SRT/HLS/Zixi/RTP)
- **Remove Decode Source** — remove a decode source stream

### Source Group
- **Add Source Group** / **Remove Source Group**

### Output & Common
- **Set Position Mute** — mute/unmute a window position (`/output/mute/set`)
- **Reboot Device**, **Refresh Device Status**, **Select Layout for Output**,
  **Assign/Remove Source**, **Add/Remove Source Stream/Group**,
  **Preview assign/remove**

> Note: **Start/Stop Stream Playback** are decoder-only actions — MG300
> gateway firmware returns 404 for `/source/streams/startPlay|stopPlay`.
> On the gateway, playback starts when a source is assigned to an output
> window (**Assign Source to Position**).

## Feedbacks
- **Audio Mute Status** — device mute status equals selected value
- **Background Type** — background type equals selected value
- **Guide Status (experimental)** — guide status equals selected value.
  The `/guide/get` endpoint may not exist on all firmware; if it errors, this
  feedback and the `guide_status` variable will be empty.

## Variables
`device_name`, `ip`, `firmware_version`, `hardware_version`,
`serial_number`, `software_version`, `alias`, `output_name`, `mute_status`,
`output_resolution`, `background_type`, `guide_status`, `sources_count`,
`layouts_count`, `gateway_streams_count`, `group_list`, `layout_list`,
`gateway_stream_list`, `mem_used`, `mem_total`, `cpu_usage`, `uptime`.

> Background type is derived from `/output/background/get`: disabled →
> `black`, a hex value (e.g. `#9A2525`) → `color`, any other value → `image`.

---

# Dynamic options

Most dropdowns are dynamic: **Position** only shows positions for the selected
**Output**, and **Stream** only shows streams for the selected **Source Group**.
Long stream lists automatically show a search box. The current layout,
resolution and active multi-output are annotated with `(Active)`.

# Troubleshooting

- **No actions appear** — before a device type is known, the module defaults
  to the full **Decoder** action/feedback/preset set. If your device is a
  Media Gateway, set **Device Type** to `Media Gateway` explicitly (or let
  auto-detect complete) and the set will switch to the gateway one.
- **Wrong port** — decoder uses `80`, gateway uses `99`. The module auto-fixes
  the port when you pick a Device Type.
- **Authentication errors** — verify credentials; the module re-logins
  automatically when the device reports an invalid token.
- **Guide Status feedback empty (gateway)** — the endpoint may not exist on
  your firmware; this is expected on some builds.
- **Select Layout blocked on D350 (firmware bug)** — D350 firmware
  `2.20.0732.1221` (and older) hard-crashes its API service on
  `POST /layout/select` — the device starts returning HTTP 502 and only
  recovers after a **power cycle**. The crash happens even when switching to
  a genuinely different layout. Firmware `2.20.0732.1222` (verified on D260)
  fixes the issue. On affected firmware the module blocks **Select Layout**
  and **Select Layout and Assign Source** and logs a warning asking you to
  upgrade; please switch layouts from the device web UI until the firmware
  is updated.
- **Migration from `kiloview-decoder` v1.x / `kiloview-mediagateway`** — this
  module replaces both. Old decoder connections upgrade in place (same module
  id); old gateway connections are picked up automatically via the
  `kiloview-mediagateway` legacy id in the manifest. Action/feedback ids are
  renamed on upgrade; any `previewSources` no-op actions are dropped and the
  `outputResolution` feedback is converted to `resolutionMatch` and must be
  reconfigured (see the log after upgrade).
