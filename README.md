# Holo Hosting Web SDK

This module is designed so that web UIs can work directly with Holochain, or in the context of the
Holo Hosting network.

This package contains every component required to develop and test your web UI against your
Holochain App Bundle.

## Install

```bash
npm install @holo-host/web-sdk
```

## Setup

### Run the Chaperone development server

There is also a script to run a local development version of Chaperone that implements all the same
flows, but shuttles the requests to a local Conductor instead of a Host. [(documentation)](https://github.com/Holo-Host/chaperone/#npx-chaperone-server---config-configruation)

Example usage

```bash
npx chaperone-server --config chaperone.json
```

## Usage
> Check out an example client usage of the file at [index.html](tests/index.html)

### Javascript API

### `new WebSdkApi(child) -> WebSdkApi`
Returns the `WebSdkApi` Object

```javascript
const WebSdkApi = require("@holo-host/web-sdk");
const holo = await WebSdkApi.connect();
```

### `await WebSdkApi.connect({ chaperone_url, auth_form_customization }) -> WebSdkApi`
Connects to Chaperone and instantiate the WebSdkApi type with child process.
The `chaperone_url` and `auth_form_customization` options are both optional.
The `auth_form_customization` options include:
- `url` is the url of [chaperone](https://github.com/Holo-Host/chaperone), and is used to specify a development chaperone server. Normally should just be `null`.
- `opts` is an object with the following fields each used for configuring the log in/sign-up screen:
  - `app_name` (required)
  - `logo_url` (optional)
  - `info_link` (optional) shows an info button with the specified link next to the Joining Code field
  - `publisher_name` (optional) displays "published by X" underneath the log in/sign-up page header
  - `anonymous_allowed` (optional) provides boolean value determining whether or not the hosted app allows anonymous/public use. If false, the app will not be enabled and hosted for use until an agent has logged-in. If value is not provided, the value will default to true.
  - `registration_server` (optional) is an object describing what server to contact in order to translate the Registration Code entered during sign up into a Membrane Proof suitable for Holochain ([Read more](https://github.com/Holo-Host/holo-nixpkgs/tree/develop/overlays/holo-nixpkgs/holo-registration-service))
    - `url` (required)
    - `payload` (optional; defaults to `undefined`) is an arbitrary value that will be passed to the registration server as additional information
  - `skip_registration` (optional) if false or undefined, a registration code field is shown on the the sign up form. The behavior of this field depends on whether `registration_server `(above)` has been set. If `registration_server` is set, the registration code is sent to the registration server to exchange for a membrane proof. If `registration_server` is not set, the registration code entered is treated as a membrane proof itself and used directly in installing the happ.

```javascript
const holo = await WebSdkApi.connect({
  chaperone_url: null,
  auth_form_customization: {
    logo_url: "my-logo.png",
    app_name: "My App",
    skip_registration: true,
    anonymous_allowed: false
  }
});
```

### `.ready() -> Promise<null>`
Waits for the app to be ready.
Asynchronous short-hand for available event.
```javascript
.on('available', () => { fulfill() });
```

### `.zomeCall( dna_handle, zome_name, function_name, args ) -> Promise<any>`

Calls a zome function on the respective DNA instance.

### `.appInfo( installed_app_id ) -> Promise<InstalledAppInfo>`

Calls appInfo on the conductor with the provided id.

### `.cellData( role_id ) -> Promise<CellData>`

Returns the cell data by role id for the respective DNA instance.

### `.stateDump() -> Promise<any>`

Calls the state dump function on user's sourcechain of the respective DNA instance.

### `.signIn( opts? ) -> Promise<HostedAppInfo>`

Triggers Chaperone's sign-in prompt.

If `opts.cancellable`, then the prompt can be exited to remain anonymous. Default = `true`.

### `.signUp( opts? ) -> Promise<HostedAppInfo>`

Triggers Chaperone's sign-up prompt.

If `opts.cancellable`, then the prompt can be exited to remain anonymous. Default = `true`.

### `.signOut() -> Promise<HostedAppInfo || null>`
Triggers Chaperone's sign-out process.
> Note: We would expect a null value to be returned whenever `anonymous_allowed` is set to false

#### Return Types
```typescript
type AgentInfo = {
  id: string, // pub key
  is_anonymous: boolean,
  host_url: string
}

type HostedAppInfo = {
  is_connected: boolean,
  hha_id: string,
  agent_info: AgentInfo
}

type InstalledCell = {
  cell_id: CellId
  role_id: RoleId
};

type DisabledAppReason =
  | { never_started: null }
  | { user: null }
  | { error: string }

type InstalledAppInfoStatus = 
  | { disabled: { reason: DisabledAppReason } }
  | { paused: { reason: { error: string } } }
  | { running: null }

type InstalledAppInfo = {
  installed_app_id: string
  cell_data: Array<InstalledCell>
  status: InstalledAppInfoStatus
}
```

### `on( event, callback )`
**Events**
- `sign-in` - emitted when the user completes a successful sign-in
- `sign-up` - emitted when the user completes a successful sign-up
- `sign-out` - emitted when the user competes a successful sign-out
- `canceled` - emitted when the user purposefully exits sign-in/up
- `signal` - emitted when a signal is passed from chaperone
- `available` - emitted when the connection to chaperone and envoy are opened and hosted app is ready for zome calls
- `unavailable` - emitted when the ws connection to chaperone and/or envoy is closed
- `unrecoverable-agent-state` - emitted when an unrecoverable error event is passed from chapeone


