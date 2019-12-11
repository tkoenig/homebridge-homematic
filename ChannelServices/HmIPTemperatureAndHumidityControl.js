'use strict'

const homematicEvents = require('../HomeMaticEventEmitter.js')
class HmIPTemperatureAndHumidityControl {
  constructor (log, platform, id, name, type, address, special, cfg, Service, Characteristic, deviceType) {
    Object.assign(this, { log, platform, id, name, type, address, special, cfg, deviceType })
    // log.warn('platform: %(s)', platform)
    // log.warn('id: %(s)', id)
    // log.warn('name: %(s)', name)
    // log.warn('type: %(s)', type)
    // log.warn('address: %(s)', address)
    // log.warn('special: %(s)', special)
    // log.warn('cfg: %(s)', cfg)
    // log.warn('characteristic: %(s)', characteristic)
    // log.warn('deviceType: %(s)', deviceType)
    // this.address = 'HmIP-RF.000E58A991F047:1'
    this.defaultChannel = this.address.match(/.+\.(.*)/)[1] // returns 000E58A991F047:1
    // Service and Characteristic are from hap-nodejs
    // Service = homebridge.hap.Service;
    // Characteristic = homebridge.hap.Characteristic;

    this.setupServices(Service, Characteristic)
    this.setupEvents()
  }

  setupServices (Service, Characteristic) {
    this.services = []

    var informationService = new Service.AccessoryInformation()

    informationService
      .setCharacteristic(Characteristic.Manufacturer, 'EQ-3')
      .setCharacteristic(Characteristic.Model, this.type)
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.SerialNumber, this.address)
    this.services.push(informationService)

    // Temperature
    var temp = new Service.TemperatureSensor(this.name)
    this.tempCharacteristic = temp.getCharacteristic(Characteristic.CurrentTemperature)
    this.tempCharacteristic
      .on('get', this.getTemperatureState.bind(this))
    this.services.push(temp)

    // Humidity
    var humidity = new Service.HumiditySensor(this.name)
    this.humidityCharacteristic = humidity.getCharacteristic(Characteristic.CurrentRelativeHumidity)
    this.humidityCharacteristic
      .on('get', this.getHumidityState.bind(this))
    this.services.push(humidity)

  }

  setupEvents () {
    // this.address = 'HmIP-RF.000E58A991F047:1'
    let homematicId = this.address.match(/.+\.(.*):/)[1] // returns 000E58A991F047
    homematicEvents.on(homematicId + ':0', (data) => { this.handleEvent(data) })
    homematicEvents.on(homematicId + ':1', (data) => { this.handleEvent(data) })
  }

  handleEvent (data) {
    this.log.warn('received data:', data)
    const { datapoint, value } = data
    switch (datapoint) {
    case 'ACTUAL_TEMPERATURE':
      this.currentTemperatureState = JSON.parse(value)
      break
    case 'HUMIDITY':
      this.currentHumidityState = JSON.parse(value)
      break
    default:
      this.log.warn('received unhandled event: %s with value %s', datapoint, JSON.parse(value))
      break
    }

  }

  getTemperatureState (callback) {
    callback(null, this.currentTemperatureState)
  }

  getHumidityState (callback) {
    callback(null, this.currentHumidityState)
  }

  get currentTemperatureState () {
    if (this._currentTemperatureState !== undefined) {
      return this._currentTemperatureState
    }
    // no value found - get remote value
    this.getRemoteValue(this.defaultChannel, 'ACTUAL_TEMPERATURE', (value) => {
      this.currentTemperatureState = JSON.parse(value)
    })

    return this._currentTemperatureState
  }

  set currentTemperatureState (current) {
    if (this._currentTemperatureState !== current) {
      this.tempCharacteristic.updateValue(current)
    }
    this._currentTemperatureState = current
  }

  get currentHumidityState () {
    if (this._currentHumidityState !== undefined) {
      return this._currentHumidityState
    }
    // no value found - get remote value
    this.getRemoteValue(this.defaultChannel, 'HUMIDITY', (value) => {
      this.currentHumidityState = JSON.parse(value)
    })

    return this._currentHumidityState
  }


  set currentHumidityState (current) {
    if (this._currentHumidityState !== current) {
      this.humidityCharacteristic.updateValue(current)
    }
    this._currentHumidityState = current
  }

  getRemoteValue(channel, datapoint, callback) {
    // RPC getValue (000E58A991F047:1 ACTUAL_TEMPERATURE) Response 21.9  | Errors: null
    this.platform.xmlrpchmip.client.methodCall('getValue', [channel, datapoint], (error, value) => {
      this.log.warn('RPC getValue (%s %s) Response %s  | Errors: %s', channel, datapoint, JSON.stringify(value), error)
      callback(value)
    })
  }

  /*
     * The getServices function is called by Homebridge and should return an array of Services this accessory is exposing.
     * It is also where we bootstrap the plugin to tell Homebridge which function to use for which action.
     */
  getServices () {
    return this.services
  }

  // Somewhere used ....
  // Used in HomeMaticChannelLoader:91..
  // eslint-disable-next-line no-unused-vars
  setReadOnly (_read) { }

  set serviceClassName (_name) {}
  // eslint-disable-next-line no-unused-vars
  event (address, dp, value) { }
}

module.exports = HmIPTemperatureAndHumidityControl
