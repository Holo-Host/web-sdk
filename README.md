# Holo Hosting Web SDK

Web SDK is the core interface for accessing Holo-Hosted Holochain apps from a web UI. Web SDK provides the same methods for manipulating a Holochain agent as `AppWebsocket` from [holochain-client-js][] (`callZome` and `appInfo`), but additionally provides methods for determining *which hosted agent* to access (`signIn`, `signUp`, and `signOut`).

[holochain-client-js]: https://github.com/holochain/holochain-client-js

**Prelease warning**: These docs are for a prelease version of web sdk. [See here for docs for the latest released verson (0.5.3)](https://github.com/Holo-Host/web-sdk/blob/a93777967f9e2f1310bbf47a511952dd83a1cb26/README.md)

## Credentials overlay

Web SDK is not just a library for connecting to a HoloPort. It also inserts an iframe into the web page. This iframe is `display: none` by default, but when you call `signIn` or `signUp`, it covers the whole screen with a "Create Credentials" overlay.

[!["Create Credentials" sign up form][signup-form]][signup-form]
[![login form][login-form]][login-form]


We guard Login inside of an iframe so that the happ UI cannot directly access the agent's private keys or passwords. The web page contained in this iframe is called "Chaperone". The URL for the official production Chaperone is <https://chaperone.holo.hosting>. ([Chaperone source repository][envoy-chaperone])

[signup-form]: docs_images/create-credentials.png
[login-form]: docs_images/login.png
[envoy-chaperone]: https://github.com/Holo-Host/envoy-chaperone


## Local dev environment (holo-dev-server)

The production Chaperone at <https://chaperone.holo.hosting> is configured to connect to real HoloPorts, so it only works if you've already published your hApp to the Holo Hosting network. If you're still developing your happ, you can create a local Chaperone which directs all agents to a locally simulated HoloPort using a program called [`holo-dev-server`](https://holo-host.github.io/envoy-chaperone/).


## Examples

If you have access to its repo, check out [dummy-ui](https://github.com/Holo-Host/envoy-chaperone/tree/main/dummy-ui/), especially [holo.js](https://github.com/Holo-Host/envoy-chaperone/blob/main/dummy-ui/src/stores/holo.js).

### Commiting to the source chain

```js
import WebSdk from '@holo-host/web-sdk'

const main = async () => {
  // Establish a connection to a chaperone iframe
  const client = await WebSdk.connect({
    chaperoneUrl: 'http://localhost:24274' // Connect to holo-dev-server
    
    // Alternatively, connect to a production holoport:
    //
    // chaperoneUrl: 'https://chaperone.holo.hosting'

    // Customize the Credentials Overlay
    authFormCustomization: {
      logoUrl: "my-logo.png",
      appName: "My App",
      requireRegistrationCode: false
    }
  })

  // Check what kind of agent we have
  console.log(client.agent)
  /*
  {
    "id": "uhCAkFUJ7PAIodGIzUjeHOAu5K8vUizQqZYgmig5PL05G8QPTpyce",
    "isAnonymous": true,
    "isAvailable": false,
    "hostUrl": "localhost:9999",
    "unrecoverableError": null
  }
  */

  // We just started up, so we're still connecting. Let's wait for isAvailable == true
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  while (!client.agent.isAvailable) {
    await sleep(50)
    // ATTN! This is not production quality code. In a real UI, you should register an event handler for `client.on('agent-state')`
    // and store the agent state in reactive state so that your components can just branch on isAvailable.
  }

  // Check what kind of agent we have
  console.log(client.agent)
  /*
  {
    "id": "uhCAkFUJ7PAIodGIzUjeHOAu5K8vUizQqZYgmig5PL05G8QPTpyce",
    "isAnonymous": true,
    "isAvailable": true,
    "hostUrl": "localhost:9999",
    "unrecoverableError": null
  }
  */

  // WebSdk defaults to an anonymous connection where you can't write to the source chain. Sign in so we can commit something
  await client.signIn()
  
  // The credentials overlay is now visible to the user. Wait for them to sign in
  while (client.agent.isAnonymous || !client.agentState.isAvailable) {
    await sleep(50)
    // Again, this while/sleep pattern is for demo only. See comment above about doing this using an event handler
  }

  console.log(client.agentState)
  /*
  {
    "id": "uhCAkRr1W12kUrY7SlSfwUpH_eJOxQGTZrIQxTQaV5-7kkh15Ewwg",
    "isAnonymous": false,
    "isAvailable": true,
    "hostUrl": "localhost:9999",
    "unrecoverableError": null
  }
  */

  // Commit an entry to the test DNA
  const result = await client.callZome({
    roleId: "test",
    zomeName: "test",
    fnName: "create_link",
    payload: null
  })
  console.log(result)
  /*
  {
    "type": "ok",
    "data": null
  }
  */

  // Any error returned by Holochain or the DNA itself is passed through as a normal value
  const error_result = await client.callZome({
    roleId: "test",
    zomeName: "test",
    fnName: "create_link",
    payload: { some_garbage_payload: true }
  })
  console.log(error_result)
  /*
  {
    "type": "error",
    "data": "Holochain returned error response: RibosomeError(\"Wasm error while working with Ribosome: Deserialize([129, 180, 115, 111, 109, 101, 95, 103, 97, 114, 98, 97, 103, 101, 95, 112, 97, 121, 108, 111, 97, 100, 195])\")"
  }
  */
}
```

## Javascript API

TypeScript-style API reference

```ts
// Inserts a Chaperone iframe into the DOM and returns an object for sending requests to it.
export async function connect (opts?: {
  // The URL for the Chaperone iframe
  //
  // Defaults to `"https://chaperone.holo.hosting"`
  // If using holo-dev-server, then you want `"http://localhost:24274"`
  //
  // It is good practice make this a build-time parameter of your UI,
  // and then have a variety of scripts in `package.json` that specify different Chaperone URLs for different use-cases
  chaperoneUrl?: string
  // Customization parameters for the Credentials Overlay (all fields OPTIONAL)
  //
  // The above screenshots of the Login and Create Credentials screens
  // were generated with
  // {
  //   appName: 'appName',
  //   logoUrl: '/docs_images/placeholder-logo.png',
  // }
  // So you can check those to see where these fields will end up.
  authFormCustomization?: {
    // The name of the hosted hApp. Currently shows up as "appName Login"
    appName?: string
    // The URL of the hApp logo. Currently displayed on a white background with no `width` or `height` constraints.
    logoUrl?: string
    // Determines whether the "REGISTRATION CODE" field is shown.
    // 
    // Set this to `true` if you want to prompt the user for a registration code that will be passed directly to your happ as a mem_proof (ie, not using a memproof server). This field does nothing if the membraneProofServer option (see below) is set.
    requireRegistrationCode?: boolean
    // Publishers may provide a "Membrane Proof Server" if they want control over sign-ups of new agents in the hApp.
    //
    // If `membraneProofServer` is not specified, then the "REGISTRATION CODE" field will be base64 decoded and passed as a Membrane Proof when installing the DNA for the hApp.
    //
    // If `membraneProofServer` is specified, it works as follows:
    // 1. When the user clicks "Submit" on the "Create Credentials" form, an HTTP request is made to `membraneProofServer.url` containing information like
    //   - The public key of newly created agent
    //   - The value entered into the "REGISTRATION CODE" field
    //   - The contents of `membraneProofServer.payload`
    // 2. The `membraneProofServer` returns with a Membrane Proof or an error.
    //
    // See here for an example implementation of the unstable Membrane Proof Server Protocol https://github.com/Holo-Host/holo-nixpkgs/tree/develop/overlays/holo-nixpkgs/membrane-proof-service
    membraneProofServer?: {
      url: string
      // An arbitrary value that will be passed to the Membrane Proof Server as additional information
      payload: unknown
    }
  }
}): Promise<WebSdk>

// Methods for switching hosted agents, querying state about the current agent, and making Zome Calls on the agent
interface WebSdk {
  // Triggers a request to show the credentials form
  // and start on the "Create Credentials" page.
  //  
  // The returned promise resolves as soon as the iframe (Chaperone)
  // has received the request.
  //  
  // - If `cancellable == true`,
  //   - the form will have a close button.
  //   - if the user clicks on it or presses the back arrow,
  //     the credentials overlay will close.
  //
  // If `cancellable == false`, then there is no way to for the user to close the overlay without logging in (aside from closing the tab/refreshing).
  //
  // Tip: If you want to do something once the user has signed up/in, write an event handler for the `agent-state` event.
  async signUp(opts?: { cancellable?: boolean }): Promise<void>
  // Same as signUp, but starts on the "Login" page instead.
  async signIn(opts?: { cancellable?: boolean }): Promise<void>
  // Triggers a request to switch to an anonymous agent.
  //
  // The returned promise resolves as soon as the iframe (Chaperone)
  // has received the request.
  async signOut(): Promise<void>
  // Makes a zome call on the installed hApp for the current agent.
  //
  // The returned promise resolves when the client has received a response from the host.
  //
  // This returns the zome call result directly on success, and throws an error on failure
  //
  // `zomeName`, `fnName` and `payload` have the same meaning as in [AppWebsocket.callZome].
  //
  // [AppWebsocket.callZome]: https://github.com/holochain/holochain-client-js/blob/develop/docs/API_appwebsocket.md#appwebsocketcallzome-cell_id-zome_name-fn_name-payload-provenance-cap-
  async callZome(args: {
    // The role ID of the DNA to call into. Determined by the `happ.yaml` for your hApp
    roleId: string
    // The name of the zome to call into. Determined by the `dna.yaml` of your hApp
    zomeName: string
    // The name of the Zome Function to call. Determined by the Rust source
    fnName: string
    // The payload to pass to the function.
    // 
    // The HDK will produce a MessagePack deserialization error if does not match the format expected by the DNA. You can `msgpack.decode()` the bytes in the error message to debug.
    payload: unknown,
    // A CapSecret, returned from a holochain `generate_cap_secret` call. Internally it's a 64 byte Uint8Array
    capSecret?: CapSecret
  }): Promise<any>
  // The state of the current hosted agent. See `AgentState` below for structure.
  agent: AgentState
  // The unique ID within the Holo Hosting network for the current hApp. 
  happId: string
  // Emitted whenever any field of `this.agentState` changes.
  //
  // The event passes one argument, the current value of `this.agent`.
  // It's possible for duplicate `agent-state` events to be emitted.
  on(event: 'agent-state', callback: (agentState: AgentState) => void): void
  // Emitted whenever the Chaperone UI becomes visible or hidden, and whenever the particular UI page shown changes.
  //
  // It's possible for duplicate `ui-state` events to be emitted.
  on(event: 'ui-state', callback: (uiState: UIState) => void): void
  // Emitted whenever either of the above events is emitted. This event is passed a combination of the above two values.
  //
  // It's possible for duplicate `chaperone-state` events to be emitted.
  on(event: 'chaperone-state', callback: (chaperoneState: ChaperoneState) => void): void
  // Emitted whenever the DNA emits a signal.
  //
  // `callback` takes an object containing the payload and the hash of the DNA which emitted it.
  on(event: 'signal', callback: (signal: Signal) => void): void

  // Returns the InstalledAppInfo for the initial agent.
  //
  // (May 2022: Due to a bug in the current implementation, this does not update if you switch agents, so this can only return the app info for the first agent that Chaperone tries to create after `connect` is called)
  //
  // Known issue: This promise will currently never resolve if the initial agent fails to load.
  //
  // The main use case for appInfo is determining what roleId to use for Zome calls, but now that it's recommeneded to hardcode the roleId in the UI, there is not much reason to use this method.
  async appInfo(): Promise<InstalledAppInfo>
  // (NOT IMPLEMENTED) Calls StateDump using the Holochain admin websocket on the hosted agent's sourcechain, and returns the result.
  async stateDump(): Promise<StateDump>
}

// AgentState type is exported from this package

type AgentState = {
  // The base64-encoded public key of the current hosted agent
  id: string
  // If true, then the agent is anonymous.
  // This means that the user did not have to log in, and will have limited access to mutating the source chain.
  isAnonymous: boolean
  // If true, the agent is connected to a host, the app is installed, and you can make zome calls.
  isAvailable: boolean
  // If defined, then the agent has encountered an unrecoverable state, and the best course of action may be to notify the user or sign out.
  unrecoverableError: UnrecoverableError | undefined
  // The URL of the HoloPort that is hosting the current agent. Useful for debugging.
  hostUrl: string
}

export type UIState = {
  // true when the Chaperone UI overlay is visible
  isVisible: boolean,
  // the particular Chaperone UI page that's displayed, or 'hidden'
  uiMode: UIMode
}

export type UIMode = 'login' | 'signup' | 'hidden'

export type ChaperoneState = {
  agentState: AgentState,
  uiState: UIState
}

type UnrecoverableError = {
  // Returned if the *publisher* has paused the happ in Publisher Portal. 
  type: 'paused'
} | {
  // Returned if envoy cannot find the happ, likely because the publisher hasn't published it to the Holo network
  type: 'not_hosted'
} | {
  // Internal holochain error
  type: 'error_getting_app_info'
  data: string
} | {
  // Internal holochain error
  type: 'error_enabling'
  data: string
} | 

// TODO: Once this feature is implemented, update this to match the state dump structure in holochain-client-js 
type StateDump = void

// BELOW THIS LINE COPIED FROM
// https://github.com/holochain/holochain-client-js/blob/develop/src/api/types.ts
type InstalledCell = {
  cell_id: [Uint8Array, Uint8Array]
  role_id: string
}

type InstalledAppInfo = {
  installed_app_id: string
  cell_data: Array<>
  status: InstalledAppInfoStatus
}

type InstalledAppInfoStatus =
  | {
      paused: { reason: { error: string } }
    }
  | {
      disabled: {
        reason: DisabledAppReason
      }
    }
  | {
      running: null
    }

type DisabledAppReason =
  | {
      never_started: null
    }
  | { user: null }
  | { error: string }

```