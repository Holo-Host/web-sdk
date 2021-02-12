const TESTING = global.COMB !== undefined;

if (!TESTING)
  COMB = require('@holo-host/comb').COMB;

const { EventEmitter } = require('events');

function appendQueryParameter (url, name, value) {
  if (!url.includes("?")) {
    url += "?"
  } else {
    url += "&"
  }
  const urlEscaper = new URLSearchParams()
  urlEscaper.set(name, value)
  url += urlEscaper.toString()
  return url
}
function makeUrlAbsolute (url) {
  const link = document.createElement("a");
  link.href = url;
  return (link.protocol + "//" + link.host + link.pathname)
}

class Connection extends EventEmitter {

  constructor(url, signalCb, branding) {
    super();

    const hostname = window.location.hostname;
    this.chaperone_url = url || `http://${hostname}:24273`;
    if (branding !== undefined) {
      if (branding.logo_url !== undefined) {
        this.chaperone_url = appendQueryParameter(this.chaperone_url, "logo_url", makeUrlAbsolute(branding.logo_url))
      }
      if (branding.app_name !== undefined) {
        this.chaperone_url = appendQueryParameter(this.chaperone_url, "app_name", branding.app_name)
      }
    }


    this.waiting = [];
    this.child = null;
    this.signalCb = signalCb
    this.connecting = this.connect();
  }

  ready() {
    return new Promise((resolve, reject) => {
      this.connecting.catch(reject)
      this.child !== null
        ? resolve()
        : this.waiting.push(resolve);
    });
  }

  async connect() {
    try {
      this.child = await COMB.connect(this.chaperone_url, 5000, this.signalCb);
    } catch (err) {
      if (err.name === "TimeoutError")
        console.log("Chaperone did not load properly. Is it running?");
      throw err;
    }

    let f;
    while (f = this.waiting.shift()) {
      f();
    }

    if (TESTING)
      return;

    // Alerts:
    //   signin		- emitted when the user completes a successful sign-in
    //   signup		- emitted when the user completes a successful sign-up
    //   signout		- emitted when the user competes a successful sign-out
    //   canceled		- emitted when the user purposefully exits sign-in/up
    //   connected		- emitted when the connection is opened
    //   disconnected	- emitted when the connection is closed
    this.child.msg_bus.on("alert", (event, ...args) => {
      this.emit(event);
    });

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
  }

  async context() {
    return Connection.HOSTED_ANONYMOUS;
  }

  async zomeCall(...args) {
    const response = await this.child.call("zomeCall", ...args);
    return response;
  }

  async appInfo(...args) {
    const response = await this.child.call("appInfo", ...args);
    return response;
  }

  async signUp() {
    this.iframe.style.display = "block";
    const result = await this.child.call("signUp");
    this.iframe.style.display = "none";
    return result;
  }

  async signIn() {
    this.iframe.style.display = "block";
    const result = await this.child.call("signIn");
    this.iframe.style.display = "none";
    return result;
  }

  async signOut() {
    return await this.child.run("signOut");
  }
}

Connection.AUTONOMOUS = 1;
Connection.HOSTED_ANONYMOUS = 2;
Connection.HOSTED_AGENT = 3;

module.exports = {
  Connection,
};
