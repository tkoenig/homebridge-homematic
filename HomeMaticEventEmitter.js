const EventEmitter = require('events')
class HomeMaticEventEmitter extends EventEmitter {
  constructor () {
    // the class constructor
    if (!HomeMaticEventEmitter.instance) {
      HomeMaticEventEmitter.instance = this
    }
    return HomeMaticEventEmitter.instance
  }
}

const homematicEvents = new HomeMaticEventEmitter()

// prevents new properties from being added to the object
Object.freeze(homematicEvents)

module.exports = homematicEvents
