const EventEmitter = require('events')

class HomeMaticEventEmitter extends EventEmitter {}

const homematicEvents = new HomeMaticEventEmitter()

module.exports = homematicEvents
