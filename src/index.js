const TESTING = global.COMB !== undefined;
if (!TESTING) {
  COMB = require('@holo-host/comb').COMB;
}

const { EventEmitter } = require('events');

function makeUrlAbsolute(url) {
  return new URL(url, window.location).href
}

  // Child Msg Bus Alert Types:
  // - `sign-in` - emitted when the user completes a successful sign-in
  // - `sign-up` - emitted when the user completes a successful sign-up
  // - `sign-out` - emitted when the user competes a successful sign-out
  // - `canceled` - emitted when the user purposefully exits sign-in/up
  // - `signal` - emitted when a signal is passed from chaperone
  // - `available` - emitted when the WebSDK to chaperone and envoy are opened and hosted app is ready for zome calls
  // - `unavailable` - emitted when the ws WebSDK to chaperone and/or envoy is closed
  // - `unrecoverable-agent-state` - emitted when an unrecoverable error event is passed from chapeone

class WebSdkApi extends EventEmitter {
  constructor(child) {
    super();
    this.available = null;
    this.child = child;
    child.msg_bus.on("alert", (event, ...args) => this.emit(event));
    child.msg_bus.on("signal", signal => this.emit('signal', signal));
    child.msg_bus.on("unrecoverable-agent-state", () => this.emit('unrecoverable-agent-state'));
    child.msg_bus.on("unavailable", () => this.emit('unavailable'));
    child.msg_bus.on("available", () => {
      this.available()
      this.emit('available')
    });
  }

  ready = () => {
    return new Promise((resolve, reject) => {
      this.available = resolve
    });
  }

  static connect = async ({ chaperoneUrl, authFormCustomization } = {}) => {
    const hostname = window.location.hostname;
    const final_chaperone_url = new URL(chaperoneUrl || `http://${hostname}:24273`);
    if (authFormCustomization !== undefined) {
      if (authFormCustomization.logoUrl !== undefined) {
        chaperone_url.searchParams.set("logo_url", makeUrlAbsolute(authFormCustomization.logoUrl))
      }
      if (authFormCustomization.appName !== undefined) {
        chaperone_url.searchParams.set("app_name", authFormCustomization.appName)
      }
      if (authFormCustomization.infoLink !== undefined) {
        chaperone_url.searchParams.set("info_link", authFormCustomization.infoLink)
      }
      if (authFormCustomization.publisherName !== undefined) {
        chaperone_url.searchParams.set("publisher_name", authFormCustomization.publisherName)
      }
      if (authFormCustomization.anonymousAllowed !== undefined) {
        chaperone_url.searchParams.set("anonymous_allowed", authFormCustomization.anonymousAllowed)
      }
      if (authFormCustomization.registrationServer !== undefined) {
        chaperone_url.searchParams.set("registration_server_url", makeUrlAbsolute(authFormCustomization.registrationServer.url))
        chaperone_url.searchParams.set("registration_server_payload", JSON.stringify(authFormCustomization.registrationServer.payload))
      }
      if (authFormCustomization.skipRegistration !== undefined) {
        chaperone_url.searchParams.set("skip_registration", authFormCustomization.skipRegistration)
      }
    }

    let child
    try {
      child = await COMB.connect(chaperone_url.href, 60000);
    } catch (err) {
      if (err.name === "TimeoutError")
        console.log("Chaperone did not load properly. Is it running?");
      throw err;
    }

    // Set styles and history props when in production mode
    if (!TESTING) {
      this.iframe = document.getElementsByClassName("comb-frame-0")[0];
      this.iframe.setAttribute('allowtransparency', 'true');
  
      const style = this.iframe.style;
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
          this.iframe.style.display = "none"
        }
      });
    }

    return new WebSdkApi(child);
  }

  zomeCall = async (...args) => await this.child.call("zomeCall", ...args)

  appInfo = async (...args) => await this.child.call("appInfo", ...args)

  cellData = async (args) => await this.child.call("cellData", ...args)

  stateDump = async () => await this.child.call("stateDump")

  signUp = async (opts) => {
    const { cancellable = true } = opts || {}
    if (cancellable) {
      history.pushState("_web_sdk_shown", "")
    }
    this.iframe.style.display = "block";
    const result = await this.child.call("signUp", opts);
    if (cancellable) {
      if (history.state === "_web_sdk_shown") {
        history.back()
      }
    } else {
      this.iframe.style.display = "none";
    }
    return result;
  }

  signIn = async (opts) => {
    const { cancellable = true } = opts || {}
    if (cancellable) {
      history.pushState("_web_sdk_shown", "")
    }
    this.iframe.style.display = "block";
    const result = await this.child.call("signIn", opts);
    if (cancellable) {
      if (history.state === "_web_sdk_shown") {
        history.back()
      }
    } else {
      this.iframe.style.display = "none";
    }
    return result;
  }

  signOut = async () => await this.child.run("signOut")
}

module.exports = WebSdkApi
