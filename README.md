
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

### Javascript API

```javascript
const { Connection } = require('@holo-host/web-sdk');

const envoy = new Connection();
```

### `.ready( timeout ) -> Promise<null>`
Wait for the connection to be ready with optional timeout.

Asynchronous short-hand for connection event with support for timeout.
```javascript
.on('connected', () => { fulfill(); });
```

### `.context() -> Promise<number>`
Returns the context indicator which will match `Connection.AUTONOMOUS`,
`Connection.HOSTED_ANONYMOUS` or `Connection.HOSTED_AGENT`.

`callZome` and `appInfo` have the same signature as the methods on AppWebsocket in [holochain-condutor-api](https://github.com/holochain/holochain-conductor-api/blob/develop/src/websocket/app.ts). Type defs can be found [here](https://github.com/holochain/holochain-conductor-api/blob/develop/src/api/types.ts).

### ```
.callZome({
  cap: CapSecret | null,
  cell_id: CellId,
  zome_name: string,
  fn_name: string,
  payload: Payload,
  provenance: AgentPubKey,
}) -> Promise<any>
```
Call a zome function on the respective DNA instance.

### `.appInfo({ app_id: string }) -> Promise<any>`
Call a zome function on the respective DNA instance.

### `.signIn() -> Promise<boolean>`
Trigger Chaperone's sign-in prompt.

> **WARNING:** This will throw an error if the context is `Connection.AUTONOMOUS`.

### `.signUp() -> Promise<boolean>`
Trigger Chaperone's sign-up prompt.

> **WARNING:** This will throw an error if the context is `Connection.AUTONOMOUS`.

### `.signOut() -> Promise<boolean>`
Trigger Chaperone's sign-out process.

> **WARNING:** This will throw an error if the context is `Connection.AUTONOMOUS`.

### `on( event, callback )`

**Events**

- `signin` - emitted when the user completes a successful sign-in
- `signup` - emitted when the user completes a successful sign-up
- `signout` - emitted when the user competes a successful sign-out
- `canceled` - emitted when the user purposefully exits sign-in/up
- `connected` - emitted when the connection is opened
- `disconnected` - emitted when the connection is closed

> **NOTE:** `signin`, `signup`, and `signout` will never be emitted when the context is
> `Connection.AUTONOMOUS`.
