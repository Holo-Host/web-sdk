const TESTING = global.COMB !== undefined;
if (!TESTING) {
  COMB = require('@holo-host/comb').COMB;
}

const { EventEmitter } = require('events');

function makeUrlAbsolute(url) {
  return new URL(url, window.location).href
}

class WebSDKAPI extends EventEmitter {

  constructor() {
    super();
    this.child = null;
    this.available = null
  }

  ready = () => {
    return new Promise((resolve, reject) => {
      this.available = resolve
    });
  }

  connect = async ({ chaperoneUrl, authFormCustomization } = {}) => {
    const hostname = window.location.hostname;
    this.chaperone_url = new URL(chaperoneUrl || `http://${hostname}:24273`);
    if (authFormCustomization !== undefined) {
      if (authFormCustomization.logoUrl !== undefined) {
        this.chaperone_url.searchParams.set("logo_url", makeUrlAbsolute(authFormCustomization.logoUrl))
      }
      if (authFormCustomization.appName !== undefined) {
        this.chaperone_url.searchParams.set("app_name", authFormCustomization.appName)
      }
      if (authFormCustomization.infoLink !== undefined) {
        this.chaperone_url.searchParams.set("info_link", authFormCustomization.infoLink)
      }
      if (authFormCustomization.publisherName !== undefined) {
        this.chaperone_url.searchParams.set("publisher_name", authFormCustomization.publisherName)
      }
      if (authFormCustomization.anonymousAllowed !== undefined) {
        this.chaperone_url.searchParams.set("anonymous_allowed", authFormCustomization.anonymousAllowed)
      }
      if (authFormCustomization.registrationServer !== undefined) {
        this.chaperone_url.searchParams.set("registration_server_url", makeUrlAbsolute(authFormCustomization.registrationServer.url))
        this.chaperone_url.searchParams.set("registration_server_payload", JSON.stringify(authFormCustomization.registrationServer.payload))
      }
      if (authFormCustomization.skipRegistration !== undefined) {
        this.chaperone_url.searchParams.set("skip_registration", authFormCustomization.skipRegistration)
      }
    }

    try {
      this.child = await COMB.connect(this.chaperone_url.href, 60000);
    } catch (err) {
      if (err.name === "TimeoutError")
        console.log("Chaperone did not load properly. Is it running?");
      throw err;
    }

    if (TESTING) return;

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
    })

    // Alert Types:
    // - `signin` - emitted when the user completes a successful sign-in
    // - `signup` - emitted when the user completes a successful sign-up
    // - `signout` - emitted when the user competes a successful sign-out
    // - `canceled` - emitted when the user purposefully exits sign-in/up
    // - `signal` - emitted when a signal is passed from chaperone
    // - `available` - emitted when the WebSDK to chaperone and envoy are opened and hosted app is ready for zome calls
    // - `unavailable` - emitted when the ws WebSDK to chaperone and/or envoy is closed
    // - `unrecoverableAgentState` - emitted when an unrecoverable error event is passed from chapeone
    this.child.msg_bus.on("alert", (event, ...args) => this.emit(event));
    this.child.msg_bus.on("available", () => this.available());
    return
  }

  callZome = async (...args) => {
    const response = await this.child.call("callZome", ...args);
    return response;
  }

  appInfo = async (...args) => {
    const response = await this.child.call("appInfo", ...args);
    return response;
  }

  cellData = async (args) => {
    return await this.child.call("cellData", ...args);
  }

  stateDump = async () => {
    const response = await this.child.call("stateDump");
    return response;
  }

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

  signOut = async () => {
    return await this.child.run("signOut");
  }
}

module.exports = {
  WebSDKAPI,
};
