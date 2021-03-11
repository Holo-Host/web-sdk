
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

### `new Connection( url, signalCb, branding ) -> Connection`
Returns a connection object.
- `url` is the url of [chaperone](https://github.com/Holo-Host/chaperone), and is used to specify a development chaperone server. Normally should just be `null`.
- `signalCb` is a callback that is called whenever the conductor sends a signal to your app. The callback is passed a single argument, the signal object.
- `branding` is an object with the following fields each used for configuring the branding shown on the log in/sign-up screen:
    - `app_name` (required)
    - `logo_url` (optional)
    - `info_link` (optional) shows an info button with the specified link next to the Joining Code field
    - `publisher_name` (optional) displays "published by X" underneath the log in/sign-up page header

```javascript
const envoy = new Connection(
    null,
    signal => console.log('Got signal', signal),
    {
        logo_url: 'my-logo.png',
        app_name: 'My App'
    }
)
```

### `.ready( ) -> Promise<null>`
Wait for the connection to be ready.

Asynchronous short-hand for connection event.
```javascript
.on('connected', () => { fulfill(); });
```

### `.context() -> Promise<number>`
Returns the context indicator which will match `Connection.AUTONOMOUS`,
`Connection.HOSTED_ANONYMOUS` or `Connection.HOSTED_AGENT`.

### `.zomeCall( dna_handle, zome_name, function_name, args ) -> Promise<any>`
Call a zome function on the respective DNA instance.

### `.appInfo( installed_app_id ) -> Promise<any>`
Calls appInfo on the conductor with the provided id.

### `.holoInfo() -> Promise<any>`
Returns `{
  url: string
}`

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
