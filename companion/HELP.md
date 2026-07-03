# Kiloview Decoder

This module controls Kiloview Dxx decoders with **decoder-hi3536** firmware via its native HTTP API (`/api/*` on port **80**).

## Configuration

- **Device IP / Host** — IP address of the decoder
- **Protocol** — HTTP (decoder-hi3536 listens on port 80)
- **Port** — Default **80**
- **Use Authentication** — Enable/disable login credentials
- **Username / Password** — Device login credentials (default: admin/admin)
- **Enable Polling** — Required for feedbacks and variables to update automatically
- **Polling Rates** — Intervals for device state and source list polling
- **Verbose Logging** — Enable debug-level logging

## Actions

### System
- **Refresh Device Status** — Manually refresh outputs, layouts, preview, and device info
- **Reboot Device** — Reboot the decoder
- **Restore Factory Settings** — Restore factory defaults

### Layout
- **Select Layout** — Apply a layout template to Output 1 or Output 2 (Output & Layout)
- **Select Layout and Assign Source** — Switch layout, then assign a stream to a position
- **Save Layout** — Save current output changes to a layout preset (Output & Layout)
- **Reload Layout** — Reload layout from saved preset (discards unsaved changes)

### Output & Source
- **Assign Source to Position** — Bind a stream to Output 1/2 window position (starts playback)
- **Remove Source from Position** — Clear a stream from a window position
- **Set Output Resolution** — Change output timing/resolution
- **Set Position Mute** — Mute or unmute audio on a position
- **Start Stream Playback** / **Stop Stream Playback** — Control stream decode
- **Refresh Source List** — Trigger source/NDI discovery refresh
- **Add Source Stream** — Add RTSP/RTMP/HTTP/HTTPS/UDP stream to a group
- **Add NDI Source** — Add an NDI stream to a group
- **Modify Source Stream** — Update name, URL, or credentials of an existing stream
- **Remove Source Stream** — Delete a stream from a source group

### Video Output (HDMI/SDI)
- **Toggle Video Interface** — Turn HDMI1, HDMI2, or SDI video on/off
- **Set Video Interface Enable** — Explicit on/off
- **Set Video Interface Mode** — Set HDMI or DVI mode on HDMI1/HDMI2
- **Set Video Interface Colorspace** — Set RGB444/YCBCR colorspace on HDMI/SDI

### Audio Output (HDMI/SDI/Line Out)
- **Toggle Audio Interface** — Turn HDMI1, HDMI2, SDI, or Line Out audio on/off
- **Set Audio Interface Enable** — Explicit on/off
- **Set Audio Interface Mute** — Mute on/off per output interface (Output + Interface + Mute On/Off)
- **Set Audio Interface Volume** — Volume in dB (-51 to 20)

### NDI Discovery
- **NDI: Add Manual IP** — Add manual NDI discovery IP and group
- **NDI: Add Discovery Server** — Add NDI discovery server address

### Preview
- **Assign Source to Preview** — Add a stream to the preview panel
- **Remove Preview Source** — Remove a stream from a preview slot

### Audiomix
- **Set Audiomix Enable** — Enable/disable a stream in output or preview mix
- **Set Audiomix Volume** — Set mix volume in dB (-51 to 20)

### PTZ (NDI sources only)
- **PTZ: Store Preset** — Store current PTZ position (preset 0–99)
- **PTZ: Recall Preset** — Recall a stored PTZ preset with speed

## Feedbacks

- **Output Layout Active** — Layout is active on an output
- **Output Layout Modified** — Output has unsaved layout changes
- **Position Stream Connected** / **Stream Name Match** — Output window stream state
- **Output Resolution Match** — Output resolution matches selection
- **Preview Stream Connected** / **Stream Match** — Preview panel stream state
- **Audiomix Stream Enabled** — Stream enabled in audiomix panel
- **Video Interface Enabled** — HDMI/SDI video interface is on
- **Audio Interface Enabled** — HDMI/SDI/Line Out audio interface is on
- **Audio Interface Muted** — Audio output interface is muted

## Variables

- Device info: name, firmware, hardware, serial, software version
- Per-output: name, layout, resolution, modified flag
- Per-position: stream name, status, resolution
- Per-preview-slot: stream name, status

## Presets

Presets are grouped hierarchically by output:

- **Output 1 / Output 2**
  - **Layout** — layout switch and save
  - **Video** — HDMI1/HDMI2/SDI toggle, HDMI/DVI mode
  - **Audio** — HDMI1/HDMI2/SDI/Line Out toggle and mute
  - **Sources** — assign streams to window positions
- **Device**
  - **Sources** — refresh, NDI discovery, start/stop/remove streams
  - **PTZ** — recall presets 0–3
  - **System** — refresh status, reboot

## API Reference

Implemented against **decoder-hi3536** (`RegistHttpsRoute.cpp`). Base URL:

`http://<ip>:80/api/`

See also `decoder-hi3536/api/Dxx解码器Api文档.md`.
