'use strict'

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
    log.warn('platform: %(s)', platform)
    log.warn('id: %(s)', id)
    log.warn('id: %(s)', id)
    log.warn('name: %(s)', name)
    log.warn('type: %(s)', type)
    log.warn('address: %(s)', address)
    log.warn('special: %(s)', special)
    log.warn('cfg: %(s)', cfg)
    log.warn('characteristic: %(s)', characteristic)
    log.warn('deviceType: %(s)', deviceType)
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
