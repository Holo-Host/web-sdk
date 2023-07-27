import Emittery from "emittery"
import semverSatisfies from 'semver/functions/satisfies'
import { AppInfoResponse, AppAgentClient, AppAgentCallZomeRequest, AppCreateCloneCellRequest, CreateCloneCellResponse, AgentPubKey, AppEnableCloneCellRequest, AppDisableCloneCellRequest, EnableCloneCellResponse, DisableCloneCellResponse, AppSignal, decodeHashFromBase64 } from '@holochain/client'

const COMPATIBLE_CHAPERONE_VERSION = '>=0.1.1 <0.2.0'

const TESTING = (<any>global).COMB !== undefined
if (!TESTING) {
  if (typeof window !== "undefined") (<any>window).COMB = require('@holo-host/comb').COMB
}

function makeUrlAbsolute (url) {
  return new URL(url, window.location.href).href
}

function checkChaperoneVersion (chaperoneVersion) {
  const isSatisfied = semverSatisfies(chaperoneVersion, COMPATIBLE_CHAPERONE_VERSION)

  if (!isSatisfied) {
    console.error(`!!!!! WARNING: you are connecting to an unsupported version of Chaperone. Expected version matching: ${COMPATIBLE_CHAPERONE_VERSION}. Actual version: ${chaperoneVersion} !!!!!`)
  }
}

/**
 * A `WebSdkApi` is a connection to a Chaperone iframe containing Holo's client logic.
 * @param child - The child process connecting to Chaperone that is being monitored.
 */
class WebSdkApi implements AppAgentClient {
  // Private constructor. Use `connect` instead.
  #child: any;
  agentState: AgentState;
  uiState: UIState;
  chaperoneState: ChaperoneState;
  #iframe: any;
  happId: string;
  #should_show_ui: boolean;
  #cancellable: boolean;
  #emitter = new Emittery();
  myPubKey: AgentPubKey;

  constructor (child) {
    this.#child = child
    child.msg_bus.on('signal', (signal: AppSignal) => this.#emitter.emit('signal', signal))

    child.msg_bus.on('agent-state', (agent_state: AgentState) => {      
      this.agentState = agent_state
      this.myPubKey = decodeHashFromBase64(agent_state.id)
      this.#emitter.emit('agent-state', this.agentState)
    })

    child.msg_bus.on('ui-state', (ui_state: UIState) => {      
      this.uiState = ui_state
      this._setShouldShowUI(ui_state.isVisible)
      this.#emitter.emit('ui-state', this.uiState)
    })

    child.msg_bus.on('chaperone-state', (chaperone_state: ChaperoneState) => {      
      this.chaperoneState = chaperone_state
      this.#emitter.emit('chaperone-state', this.chaperoneState)
    })
  }

  /**
   * The `static connect` function is a helper function that connects to the Chaperone server and returns a WebSdkApi object
   * @param []
   * - chaperoneUrl: The URL of the Chaperone server.
   * - authFormCustomization: The optional app customizations to display when authorizing the user
   * @returns The `connect` function returns a `WebSdkApi` object.
   */
  static connect = async ({
    chaperoneUrl,
    authFormCustomization: authOpts = {}
  }: { chaperoneUrl: string, authFormCustomization?: AuthFormCustomization }) => {
    const url = new URL(chaperoneUrl || 'https://chaperone.holo.host')

    if (authOpts !== undefined) {
      if (authOpts.logoUrl !== undefined) {
        url.searchParams.set('logo_url', makeUrlAbsolute(authOpts.logoUrl))
      }
      if (authOpts.appName !== undefined) {
        url.searchParams.set('app_name', authOpts.appName)
      }
      if (authOpts.membraneProofServer !== undefined) {
        url.searchParams.set(
          'membrane_proof_server_url',
          makeUrlAbsolute(authOpts.membraneProofServer.url)
        )
        url.searchParams.set(
          'membrane_proof_server_payload',
          JSON.stringify(authOpts.membraneProofServer.payload)
        )
      }
      if (authOpts.requireRegistrationCode !== undefined) {
        url.searchParams.set('require_registration_code', String(authOpts.requireRegistrationCode))
      }
      // INTERNAL OPTION
      // anonymous_allowed is barely implemented in Chaperone, and is subject to change,
      // so exposing this in the documentation is misleading.
      // This is currently useful for some special hApps that can't support an anonymous instance.
      if (authOpts.anonymousAllowed !== undefined) {
        url.searchParams.set('anonymous_allowed', String(authOpts.anonymousAllowed))
      }

      if (authOpts.integrationTestMode !== undefined) {
        url.searchParams.set('integration_test_mode', String(authOpts.integrationTestMode))
      }
    }

    let child
    try {
      child = await ((<any>window).COMB || (<any>global).COMB).connect(url.href, 60000)
    } catch (err) {
      if (err.name === 'TimeoutError')
        console.log('Chaperone did not load properly. Is it running?')
      throw err
    }

    const webSdkApi = new WebSdkApi(child)

    // Set styles and history props when in production mode
    // Note: Set styles and history props only when in production mode
    if (!TESTING) {
      webSdkApi.#iframe = document.getElementsByClassName('comb-frame-0')[0]
      webSdkApi.#iframe.setAttribute('allowtransparency', 'true')
      const style = webSdkApi.#iframe.style
      style.zIndex = '99999999'
      style.width = '100%'
      style.height = '100%'
      style.position = 'absolute'
      style.top = '0'
      style.left = '0'
      style.display = 'none'

      window.addEventListener('popstate', event => {
        if (event.state === '_web_sdk_shown') {
          history.back()
        } else {
          webSdkApi.#iframe.style.display = 'none'
        }
      })
    }

    // Chaperone either returns agent_state and happ_id (success case)
    // or error_message
    const { error_message, chaperone_state, happ_id, chaperone_version } = await child.call(
      'handshake'
    )

    checkChaperoneVersion(chaperone_version)

    if (error_message) {
      webSdkApi.#iframe.style.display = 'none'
      throw new Error(error_message)
    }

    const { agentState, uiState } = chaperone_state

    webSdkApi.agentState = agentState
    webSdkApi.myPubKey = decodeHashFromBase64(agentState.id)
    webSdkApi.uiState = uiState
    webSdkApi.chaperoneState = chaperone_state
    webSdkApi.happId = happ_id

    return webSdkApi
  }

  _setShouldShowUI = should_show_ui => {
    // Without this check, we call history.back() too many times and end up exiting the UI
    if (this.#should_show_ui === should_show_ui) {
      return
    }

    this.#should_show_ui = should_show_ui
    if (should_show_ui) {
      if (this.#cancellable) {
        history.pushState('_web_sdk_shown', '')
      }
      this.#iframe.style.display = 'block'
    } else {
      if (this.#cancellable) {
        if (history.state === '_web_sdk_shown') {
          history.back()
        }
      }
      this.#iframe.style.display = 'none'
    }
  }

  appInfo = (): Promise<AppInfoResponse> => this.#child.call('appInfo')

  callZome = async (args: AppAgentCallZomeRequest): Promise<any> => this.#child.call('callZome', args).then(unwrap)

  createCloneCell = (args: AppCreateCloneCellRequest): Promise<CreateCloneCellResponse> => this.#child.call('createCloneCell', args).then(unwrap)

  disableCloneCell = (args: AppDisableCloneCellRequest): Promise<DisableCloneCellResponse> => this.#child.call('disableCloneCell', args).then(unwrap)

  enableCloneCell = (args: AppEnableCloneCellRequest): Promise<EnableCloneCellResponse> => this.#child.call('enableCloneCell', args).then(unwrap)
  
  stateDump = () => this.#child.call('stateDump')

  on(eventName, listener) {
    return this.#emitter.on(eventName, listener);
  }

  /*
  Triggers a request to show the credentials form
  and start on the "Create Credentials" page.
  
  The returned promise resolves as soon as the iframe (Chaperone)
  has received the request.
  
  If cancellable == true, then the form will have a close button
  and if the user clicks it or presses the back arrow,
  the credentials overlay will close.
  */
  signUp = async opts => {
    const { cancellable = true } = opts || {}
    this.#cancellable = cancellable

    await this.#child.call('signUp', opts)
  }

  /*
  Same as signUp, but starts on the "Login" page instead.
 */
  signIn = async opts => {
    const { cancellable = true } = opts || {}
    this.#cancellable = cancellable

    await this.#child.call('signIn', opts)
  }

  signOut = () => this.#child.run('signOut')
}

export default WebSdkApi

// DUPLICATION START
// This is a duplication of the type AgentState from Chaperone. There isn't a neat way to share the code directly without publishing these types as their own npm module, 
// so make sure they're up to date

export type AgentState = {
  id: string
  isAnonymous: boolean
  hostUrl: string
  isAvailable: boolean
  unrecoverableError: any
}

export type UIState = {
  isVisible: boolean,
  uiMode: UIMode
}

export type UIMode = 'login' | 'signup' | 'hidden'

export type ChaperoneState = {
  agentState: AgentState,
  uiState: UIState
}

// DUPLICATION END

type AuthFormCustomization = {
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
  },
  // INTERNAL OPTION
  // anonymous_allowed is barely implemented in Chaperone, and is subject to change,
  // so exposing this in the documentation is misleading.
  // This is currently useful for some special hApps that can't support an anonymous instance.
  anonymousAllowed?: boolean
  integrationTestMode?: boolean
}

type Result<T> = {
  type: 'ok'
  data: T
} | {
  type: 'error'
  data: string
} | {
  type: 'unexpected'
}

function unwrap<T> (result: Result<T>): T {
  switch (result.type) {
    case 'ok':
      return result.data
    case 'error':
      throw new Error(result.data)
    default:
      throw new Error(`Unrecognized result type: ${result.type}`)
  }
}
