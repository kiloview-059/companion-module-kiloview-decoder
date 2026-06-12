# Kiloview Decoder

This module controls Kiloview Dxx decoders with **decoder-hi3536** firmware via its native HTTP API (`/api/*` on port **99**).

## Configuration

- **Device IP / Host** — IP address of the decoder
- **Protocol** — HTTP (decoder-hi3536 listens on port 99)
- **Port** — Default **99** (`HTTP_PORT` in decoder-hi3536)
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
- **Select Layout** — Apply a layout template to an output window
- **Save Layout** — Save current output changes to a layout preset
- **Reload Layout** — Reload layout from saved preset (discards unsaved changes)

### Output & Source
- **Assign Source to Position** — Bind a stream to a window position
- **Remove Source from Position** — Clear a stream from a window position
- **Set Output Resolution** — Change output timing/resolution
- **Set Position Mute** — Mute or unmute audio on a position
- **Start Stream Playback** / **Stop Stream Playback** — Control stream decode
- **Refresh Source List** — Trigger source/NDI discovery refresh

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

## Variables

- Device info: name, firmware, hardware, serial, software version
- Per-output: name, layout, resolution, modified flag
- Per-position: stream name, status, resolution
- Per-preview-slot: stream name, status

## Presets

- Layout selection buttons
- Save Current Layout
- Refresh Sources
- PTZ Recall Preset 0–3
- Refresh Status / Reboot

## API Reference

Implemented against **decoder-hi3536** (`RegistHttpsRoute.cpp`). Base URL:

`http://<ip>:99/api/`

See also `decoder-hi3536/api/Dxx解码器Api文档.md`.
