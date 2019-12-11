'use strict'

const homematicEvents = require('../HomeMaticEventEmitter.js')
class HmIPTemperatureAndHumidityControl {
  constructor (
    log,
    platform,
    id,
    name,
    type,
    address,
    special,
    cfg,
    service,
    characteristic,
    deviceType
  ) {
    Object.assign(this, { log, platform, id, name, type, address, special, cfg, service, characteristic, deviceType })
    // log.warn('platform: %(s)', platform)
    // log.warn('id: %(s)', id)
    // log.warn('name: %(s)', name)
    // log.warn('type: %(s)', type)
    // log.warn('address: %(s)', address)
    // log.warn('special: %(s)', special)
    // log.warn('cfg: %(s)', cfg)
    // log.warn('characteristic: %(s)', characteristic)
    // log.warn('deviceType: %(s)', deviceType)
    // adress = 'HmIP-RF.000E58A991F047:1'
    let homematicId = address.match(/.+\.(.*):/)[1]

    homematicEvents.on(homematicId + ':0', this.handleEvent)
    homematicEvents.on(homematicId + ':1', this.handleEvent)
  }

  handleEvent (data) {
    this.log.warn('received data:', data)
  }

  // Used in HomeMaticChannelLoader:91..
  setReadOnly (_read) { }
  // this will only be added to foundAccesories if > 1
  getServices () {
    return []
  }
  set serviceClassName (_name) {}

  event (address, dp, value) { }
}

module.exports = HmIPTemperatureAndHumidityControl
