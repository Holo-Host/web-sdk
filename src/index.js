const TESTING = global.COMB !== undefined
if (!TESTING) {
  COMB = require('@holo-host/comb').COMB
}

const { EventEmitter } = require('events')

function makeUrlAbsolute (url) {
  return new URL(url, window.location).href
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
class WebSdkApi extends EventEmitter {
  // Private constructor. Use `connect` instead.
  constructor (child) {
    super()
    this._child = child
    child.msg_bus.on('signal', signal => this.emit('signal', signal))
    child.msg_bus.on('agent-state', agent_state => {
      this._setShouldShowForm(agent_state.should_show_form)
      this.agent = presentAgentState(agent_state)
      this.emit('agent-state', this.agent)
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
    authFormCustomization: authOpts
  } = {}) => {
    const url = new URL(chaperoneUrl || 'https://chaperone.holo.host')
    if (authOpts !== undefined) {
      if (authOpts.logoUrl !== undefined) {
        url.searchParams.set('logo_url', makeUrlAbsolute(authOpts.logoUrl))
      }
      if (authOpts.appName !== undefined) {
        url.searchParams.set('app_name', authOpts.appName)
      }
      if (authOpts.infoLink !== undefined) {
        url.searchParams.set('info_link', authOpts.infoLink)
      }
      if (authOpts.publisherName !== undefined) {
        url.searchParams.set('publisher_name', authOpts.publisherName)
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
      if (authOpts.skipRegistration !== undefined) {
        url.searchParams.set('skip_registration', authOpts.skipRegistration)
      }
      // INTERNAL OPTION
      // anonymous_allowed is barely implemented in Chaperone, and is subject to change,
      // so exposing this in the documentation is misleading.
      // This is currently useful for some special hApps that can't support an anonymous instance.
      if (authOpts.anonymousAllowed !== undefined) {
        url.searchParams.set('anonymous_allowed', authOpts.anonymousAllowed)
      }
    }

    let child
    try {
      child = await COMB.connect(url.href, 60000)
    } catch (err) {
      if (err.name === 'TimeoutError')
        console.log('Chaperone did not load properly. Is it running?')
      throw err
    }

    const webSdkApi = new WebSdkApi(child)

    // Set styles and history props when in production mode
    // Note: Set styles and history props only when in production mode
    if (!TESTING) {
      webSdkApi.iframe = document.getElementsByClassName('comb-frame-0')[0]
      webSdkApi.iframe.setAttribute('allowtransparency', 'true')
      const style = webSdkApi.iframe.style
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
          webSdkApi.iframe.style.display = 'none'
        }
      })
    }

    // Chaperone either returns agent_state and happ_id (success case)
    // or error_message
    const { error_message, agent_state, happ_id } = await child.call(
      'handshake'
    )
    if (error_message) {
      webSdkApi.iframe.style.display = 'none'
      throw new Error(error_message)
    }

    webSdkApi.agent = presentAgentState(agent_state)
    webSdkApi.happId = happ_id

    return webSdkApi
  }

  _setShouldShowForm = should_show_form => {
    // Without this check, we call history.back() too many times and end up exiting the UI
    if (this._should_show_form === should_show_form) {
      return
    }

    this._should_show_form = should_show_form
    if (should_show_form) {
      if (this._cancellable) {
        history.pushState('_web_sdk_shown', '')
      }
      this.iframe.style.display = 'block'
    } else {
      if (this._cancellable) {
        if (history.state === '_web_sdk_shown') {
          history.back()
        }
      }
      this.iframe.style.display = 'none'
    }
  }

  zomeCall = async (...args) => await this._child.call('zomeCall', ...args)

  appInfo = async (...args) => await this._child.call('appInfo', ...args)

  stateDump = async () => await this._child.call('stateDump')

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
    this._cancellable = cancellable

    await this._child.call('signUp', opts)
  }

  /*
  Same as signUp, but starts on the "Login" page instead.
 */
  signIn = async opts => {
    const { cancellable = true } = opts || {}
    this._cancellable = cancellable

    await this._child.call('signIn', opts)
  }

  signOut = async () => {
    await this._child.run('signOut')
  }
}

module.exports = WebSdkApi
