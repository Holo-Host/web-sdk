import Emittery from "emittery"
import { AppInfoResponse, InstalledCell, AppAgentClient, AppAgentCallZomeRequest, AppCreateCloneCellRequest, CreateCloneCellResponse, AgentPubKey, AppEnableCloneCellRequest, AppDisableCloneCellRequest, EnableCloneCellResponse, DisableCloneCellResponse } from '@holochain/client'

const TESTING = (<any>global).COMB !== undefined
if (!TESTING) {
  if (typeof window !== "undefined") (<any>window).COMB = require('@holo-host/comb').COMB
}

function makeUrlAbsolute (url) {
  return new URL(url, window.location.href).href
}

// We make sure to only expose camelCase properties to the UI
const presentAgentState = agent_state => ({
  id: agent_state.id,
  isAnonymous: agent_state.is_anonymous,
  isAvailable: agent_state.is_available,
  unrecoverableError: agent_state.unrecoverable_error,
  hostUrl: agent_state.host_url
  // We're keeping shouldShowForm as an implementation detail
  // until there's a use-case for reacting to it in a UI.
  //
  // shouldShowForm: agent_state.should_show_form
})

/**
 * A `WebSdkApi` is a connection to a Chaperone iframe containing Holo's client logic.
 * @param child - The child process connecting to Chaperone that is being monitored.
 */
class WebSdkApi implements AppAgentClient {
  // Private constructor. Use `connect` instead.
  #child: any;
  agent: any
  #iframe: any;
  happId: string;
  #should_show_form: boolean;
  #cancellable: boolean;
  #emitter = new Emittery();
  myPubKey: AgentPubKey;

  constructor (child) {
    this.#child = child
    child.msg_bus.on('signal', (signal: HoloSignal) => this.#emitter.emit('signal', signal))
    child.msg_bus.on('agent-state', (agent_state: AgentState) => {
      this._setShouldShowForm(agent_state.should_show_form)
      this.agent = presentAgentState(agent_state)
      this.#emitter.emit('agent-state', this.agent)
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
    const { error_message, agent_state, happ_id } = await child.call(
      'handshake'
    )
    if (error_message) {
      webSdkApi.#iframe.style.display = 'none'
      throw new Error(error_message)
    }

    webSdkApi.agent = presentAgentState(agent_state)
    webSdkApi.happId = happ_id

    return webSdkApi
  }

  _setShouldShowForm = should_show_form => {
    // Without this check, we call history.back() too many times and end up exiting the UI
    if (this.#should_show_form === should_show_form) {
      return
    }

    this.#should_show_form = should_show_form
    if (should_show_form) {
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

  // _child.call returns a promise, so all of these functions do as well

  callZome = async (args: AppAgentCallZomeRequest): Promise<any> => {
    // translate Result type from chaperone into normal 
    const result = await this.#child.call('callZome', args)
    switch (result.type) {
      case 'ok':
        return result.data
      case 'error':
        throw new Error(result.data)
      default:
        throw new Error(`Unrecognized zome result type: ${result.type}`)
    }
  }

  appInfo = (): Promise<AppInfoResponse> => this.#child.call('appInfo')

  createCloneCell = (args: AppCreateCloneCellRequest): Promise<CreateCloneCellResponse> => this.#child.call('createCloneCell', args)

  disableCloneCell = (args: AppDisableCloneCellRequest): Promise<DisableCloneCellResponse> => this.#child.call('disableCloneCell', args)

  enableCloneCell = (args: AppEnableCloneCellRequest): Promise<EnableCloneCellResponse> => this.#child.call('enableCloneCell', args)
  
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
// This code is duplicated from Chaperone. There isn't a neat way to share the code directly without publishing these types as their own npm module, 
// so make sure they're up to date

export type HoloSignal = {
  data: unknown,
  cell: InstalledCell,
  zome_name: string,
}

export type AgentState = {
  id: string,
  is_anonymous: boolean,
  host_url: string,
  is_available: boolean,
  unrecoverable_error: any,
  should_show_form?: boolean
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
}
