# companion-module-kiloview-decoder

Companion module for **Kiloview decoders and media gateways** — merges the former
`companion-module-kiloview-decoder` and `companion-module-kiloview-mediagateway`
modules into a single connection with a `deviceType` profile fork.

## Supported devices

| Profile | Products |
|---|---|
| Decoder | D350, D260, RD350, RD260 (decoder-hi3536 firmware) |
| Media Gateway | MG300V2, MG300V2-OEM, RMG300V2, RMG300V2-OEM |

Select **Device Type** in the connection config, or leave it on **Auto detect** and
the module will identify the device after login.

## Architecture

- `index.js` — InstanceBase subclass; merges all modules via Object.assign
- `src/config.js` — configuration fields with profile-aware defaults
- `src/constants.js` — polling rates, error codes, choice arrays
- `src/state.js` — initial STATE and CHOICES reset
- `src/http/BaseClient.js` — unified HTTP client (keep-alive, auth, retry)
- `src/http/decoderProfile.js` / `gatewayProfile.js` — API route tables
- `src/http/decoderApi.js` / `gatewayApi.js` — API wrappers
- `src/device/factory.js` — creates client + API based on deviceType
- `src/device/detect.js` — auto-detect device type from `/info/get`
- `src/polling/connection.js` — connection lifecycle, polling setup
- `src/polling/pollDecoder.js` / `pollGateway.js` — profile-specific pollers
- `src/choices/common.js` / `decoderChoices.js` / `gatewayChoices.js` — dynamic choices
- `src/fields/optionFields.js` — reusable field builders with visibility expressions
- `src/definitions/` — actions, feedbacks, variables, presets (common + per-profile)
- `src/upgrades.js` — migration scripts from legacy module ids

## API reference

Decoder API routes follow `decoder-hi3536/multiview/src/interface/RegistHttpsRoute.cpp`.
Gateway API routes follow the MG300V2 HTTP API (port 99).

Default endpoints:
- Decoder: `http://<device-ip>:80/api/`
- Gateway: `http://<device-ip>:99/api/`
