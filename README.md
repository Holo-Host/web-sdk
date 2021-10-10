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
const { Connection } = require("@holo-host/web-sdk");

const envoy = new Connection();
```

### `new Connection( url, signalCb, opts ) -> Connection`

Returns a connection object.

- `url` is the url of [chaperone](https://github.com/Holo-Host/chaperone), and is used to specify a development chaperone server. Normally should just be `null`.
- `signalCb` is a callback that is called whenever the conductor sends a signal to your app. The callback is passed a single argument, the signal object.
- `opts` is an object with the following fields each used for configuring the log in/sign-up screen:
  - `app_name` (required)
  - `logo_url` (optional)
  - `info_link` (optional) shows an info button with the specified link next to the Joining Code field
  - `publisher_name` (optional) displays "published by X" underneath the log in/sign-up page header
  - `registration_server` (optional) is an object describing what server to contact in order to translate the Registration Code entered during sign up into a Membrane Proof suitable for Holochain ([Read more](https://github.com/Holo-Host/holo-nixpkgs/tree/develop/overlays/holo-nixpkgs/holo-registration-service))
    - `url` (required)
    - `payload` (optional; defaults to `undefined`) is an arbitrary value that will be passed to the registration server as additional information
  - `skip_registration` (optional)

```javascript
const envoy = new Connection(
  null,
  (signal) => console.log("Got signal", signal),
  {
    logo_url: "my-logo.png",
    app_name: "My App",
    skip_registration: true,
  }
);
```

### `.ready( ) -> Promise<null>`

Wait for the connection to be ready.

Asynchronous short-hand for connection event.

```javascript
.on('connected', () => { fulfill(); });
```

### `.agentInfo() -> Promise<object>`

Returns an object with properties of an agent created in chaperone:

```
{
  anonymous: boolean,
  agent_id: string, // in multicodec encoding
  agent_id_base64: string // base64 encoded
}
```

### `.zomeCall( dna_handle, zome_name, function_name, args ) -> Promise<any>`

Call a zome function on the respective DNA instance.

### `.appInfo( installed_app_id ) -> Promise<any>`

Calls appInfo on the conductor with the provided id.

### `.holoInfo() -> Promise<any>`

Returns `{ url: string }`

### `.signIn( opts? ) -> Promise<boolean>`

Trigger Chaperone's sign-in prompt.

If `opts.cancellable`, then the prompt can be exited to remain anonymous. Default = `true`.

> **WARNING:** This will throw an error if the context is `Connection.AUTONOMOUS`.

### `.signUp( opts? ) -> Promise<boolean>`

Trigger Chaperone's sign-up prompt.

If `opts.cancellable`, then the prompt can be exited to remain anonymous. Default = `true`.

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
