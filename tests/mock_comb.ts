const { inspect } = require("util");

let next_response;
let event_listeners = {}


;(<any>global).COMB = {
  async connect() {
    return Promise.resolve({
      // Test event listener set with callback
      msg_bus: {
        on(event, callback) {
          event_listeners[event] = callback
          return
        }
      },
      call() {
        if (next_response === undefined)
          return Promise.resolve({
            type: 'error',
            data: 'Next response is undefined'
          })
        else {
          const value = next_response;
          next_response = undefined;
          return Promise.resolve(value)
        }
      },
    });
  }
}

export default {
  nextResponse(value) {
    next_response = value;
  },
  triggerEvent(event_name) {
    const event_callback = event_listeners[event_name]
    if (!event_callback) {
      throw new Error(`Expected to find event listener ${event_name}, but none found.  Current event listeners: ${inspect(event_listeners)}`)
    }
    setTimeout(() => {
      event_callback()
    }, 0)
    return
  }
}
