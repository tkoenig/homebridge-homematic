const EventEmitter = require('events')
class HomeMaticEventEmitter extends EventEmitter {}

const homematicEvents = new HomeMaticEventEmitter()

// prevents new properties from being added to the object
// Object.freeze(homematicEvents)

module.exports = homematicEvents
