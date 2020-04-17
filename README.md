
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

### Starting your Holochain App Bundle
A quick and simple script for running a hApp bundle is included in the web SDK.  This will setup and
run a local Conductor configured to work with Chaperone's call specifications.

```bash
npx sdk-conductor --config conductor.json
```

Example `conductor.json`
```javascript
{
    "key_store_file": "./happ-dev-keystore.key", // generated keystore file is saved here
    "agent_id_file": "./happ-dev-agent-id.hcid", // generated keystore agent ID is saved here
    "storage_dir": "./holochain-conductor/",     // instance memory is stored here
    "log_level": null,
    "sim2h_server": "http://localhost:9000",
    "bundle": {
        "id": "QmUgZ8e6xE1h9fH89CNqAXFQkkKyRh2Ag6jgTNC8wcoNYS",
        "dnas": [{
            "id": "holofuel",
            "hash": "QmWvWtw1P2nduQqk8uKpfhAeUd72bSU2gFH7TLrQm1Bbfw",
            "file": "../holofuel/dist/holofuel.dna.json"
        }]
    }
}
```

For more complex hApp or multi-hApp configurations, Chaperone can be configured to use an existing
Holochain Conductor instead of using this method.  Follow the instance ID guidelines to ensure
compatibility with Chaperone's call specification.

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

### `.zomeCall( dna_handle, zome_name, function_name, args ) -> Promise<any>`
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
