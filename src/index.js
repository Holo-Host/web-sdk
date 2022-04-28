const TESTING = global.COMB !== undefined;
if (!TESTING) {
  COMB = require('@holo-host/comb').COMB;
}

const { EventEmitter } = require('events');

function makeUrlAbsolute(url) {
  return new URL(url, window.location).href
}

const presentAgentState = agent_state => ({
  id: agent_state.id,
  isAnonymous: agent_state.is_anonymous,
  isAvailable: agent_state.is_available,
  unrecoverableError: agent_state.unrecoverable_error,
  hostUrl: agent_state.host_url
})

/**
 * The `WebSdkApi` class is a wrapper around the COMB.js library that provides a JavaScript API for Holo-Hosted web apps to call Holochain.
 * @param child - The child process connecting to Chaperone that is being monitored.
 */
class WebSdkApi extends EventEmitter {
  constructor(child) {
    super();
    this.child = child;
    child.msg_bus.on("signal", signal => this.emit('signal', signal));
    child.msg_bus.on("agent-state", agent_state => {
      const agent = presentAgentState(agent_state)
      this.agent = agent
      this.emit('agent-state', agent)
    })
  }

  /**
   * The `static connect` function is a helper function that connects to the Chaperone server and returns a WebSdkApi object
   * @param []
   * - chaperoneUrl: The URL of the Chaperone server.
   * - authFormCustomization: The optional app customizations to display when authorizing the user
   * @returns The `connect` function returns a `WebSdkApi` object.
   */
  static connect = async ({ chaperoneUrl, authFormCustomization: authOpts } = {}) => {
    const hostname = window.location.hostname;
    const url = new URL(chaperoneUrl || `http://${hostname}:24273`);
    if (authOpts !== undefined) {
      if (authOpts.logoUrl !== undefined) {
        url.searchParams.set("logo_url", makeUrlAbsolute(authOpts.logoUrl))
      }
      if (authOpts.appName !== undefined) {
        url.searchParams.set("app_name", authOpts.appName)
      }
      if (authOpts.infoLink !== undefined) {
        url.searchParams.set("info_link", authOpts.infoLink)
      }
      if (authOpts.publisherName !== undefined) {
        url.searchParams.set("publisher_name", authOpts.publisherName)
      }
      if (authOpts.anonymousAllowed !== undefined) {
        url.searchParams.set("anonymous_allowed", authOpts.anonymousAllowed)
      }
      if (authOpts.membraneProofServer !== undefined) {
        url.searchParams.set("membrane_proof_server_url", makeUrlAbsolute(authOpts.membraneProofServer.url))
        url.searchParams.set("membrane_proof_server_payload", JSON.stringify(authOpts.membraneProofServer.payload))
      }
      if (authOpts.skipRegistration !== undefined) {
        url.searchParams.set("skip_registration", authOpts.skipRegistration)
      }
    }

    let child
    try {
      child = await COMB.connect(url.href, 60000);
    } catch (err) {
      if (err.name === "TimeoutError")
        console.log("Chaperone did not load properly. Is it running?");
      throw err;
    }

    const webSdkApi = new WebSdkApi(child);

    // Set styles and history props when in production mode
    // Note: Set styles and history props only when in production mode
    if (!TESTING) {
      webSdkApi.iframe = document.getElementsByClassName("comb-frame-0")[0];
      webSdkApi.iframe.setAttribute('allowtransparency', 'true');
      const style = webSdkApi.iframe.style;
      style.zIndex = "99999999";
      style.width = "100%";
      style.height = "100%";
      style.position = "absolute";
      style.top = "0";
      style.left = "0";
      style.display = "none";
      window.addEventListener('popstate', (event) => {
        if (event.state === "_web_sdk_shown") {
          history.back()
        } else {
          webSdkApi.iframe.style.display = "none"
        }
      });
    }

    // Note: Based on discussed model, chaperone either returns null or an error message (string)
    const { error_message, agent_state, happ_id } = await child.call("handshake")
    if (error_message) {
      webSdkApi.iframe.style.display = "none"
      throw new Error(error_message)
    }

    webSdkApi.agent = presentAgentState(agent_state)
    webSdkApi.happId = happ_id

    return webSdkApi
  }

  zomeCall = async (...args) => await this.child.call("zomeCall", ...args)

  appInfo = async (...args) => await this.child.call("appInfo", ...args)

  cellData = async (args) => await this.child.call("cellData", ...args)

  stateDump = async () => await this.child.call("stateDump")

  /* The `signUp` function is called by the `signUp` button in the UI. The `signUp`
  function is async, so it returns a promise. The promise is resolved when the user is signed up. The
  promise is rejected if a Holo error occurs or the user cancels the sign up process (when the cancellable opt is provided). */
  signUp = async (opts) => {
    const { cancellable = true } = opts || {}
    if (cancellable) {
      history.pushState("_web_sdk_shown", "")
    }
    this.iframe.style.display = "block";

    const waitForAgentState = new Promise(resolve => {
      this.once("agent-state", () => {
        resolve()
      })
    })

    await this.child.call("signUp", opts);
    await waitForAgentState

    if (cancellable) {
      if (history.state === "_web_sdk_shown") {
        history.back()
      }
    } else {
      this.iframe.style.display = "none"
    }

    return this.agent
  }

  /* The `signIn` function is called by the `signIn` button in the UI. The `signIn`
  function is async, so it returns a promise. The promise is resolved when the user is signed in. The
  promise is rejected if a Holo error occurs or the user cancels the sign in process (when the cancellable opt is provided). */
  signIn = async (opts) => {
    const { cancellable = true } = opts || {}

    if (cancellable) {
      history.pushState("_web_sdk_shown", "")
    }
    this.iframe.style.display = "block";

    const waitForAgentState = new Promise(resolve => {
      this.once("agent-state", () => {
        resolve()
      })
    })

    await this.child.call("signIn", opts)
    await waitForAgentState

    if (cancellable) {
      if (history.state === "_web_sdk_shown") {
        history.back()
      }
    } else {
      this.iframe.style.display = "none";
    }
    return this.agent
  }

  signOut = async () => {
    const waitForAgentState = new Promise(resolve => {
      this.once("agent-state", () => {
        resolve()
      })
    })

    await this.child.run("signOut")
    await waitForAgentState

    return this.agent
  }
}

module.exports = WebSdkApi
