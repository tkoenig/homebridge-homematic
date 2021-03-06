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

    /*
    this.addCharacteristic(Characteristic.CurrentHeatingCoolingState);
    this.addCharacteristic(Characteristic.TargetHeatingCoolingState);
    this.addCharacteristic(Characteristic.CurrentTemperature);
    this.addCharacteristic(Characteristic.TargetTemperature);
    this.addCharacteristic(Characteristic.TemperatureDisplayUnits);

    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.CurrentRelativeHumidity);

    */
    // Thermostat
    var thermo = new Service.Thermostat(this.name)
    this.currentHeatingCooling = thermo.getCharacteristic(Characteristic.CurrentHeatingCoolingState)


    this.currentHeatingCooling
      .on('get', (callback) => { callback(null, this.currentHeatingCoolingState) })
    this.targetHeatingCooling = thermo.getCharacteristic(Characteristic.TargetHeatingCoolingState)
    // Enable Heatonly mode
    this.targetHeatingCooling.setProps({ maxValue: Characteristic.TargetHeatingCoolingState.HEAT })
    this.targetHeatingCooling
      .on('get', (callback) => { callback(null, this.targetHeatingCoolingState) })
      .on('set', (value, callback) => {
        this.setTargetHeatingCooling(value, callback)
      })

    this.currentTemperature = thermo.getCharacteristic(Characteristic.CurrentTemperature)
    this.currentTemperature
      .on('get', (callback) => { callback(null, this.currentTemperatureState) } )

    this.targetTemperature = thermo.getCharacteristic(Characteristic.TargetTemperature)
    this.targetTemperature
      .on('get', (callback) => { callback(null, this.targetTemperatureState) } )
      .on('set', (value, callback) => {
        this.setTargetTemperature(value, callback)
      })

    thermo.getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .on('get', (callback) => {
        callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS)
      })


    this.currentHumidity = thermo.getCharacteristic(Characteristic.CurrentRelativeHumidity)
    this.currentHumidity
      .on('get', (callback) => { callback(null, this.currentHumidityState) })


    this.services.push(thermo)


  }

  setupEvents () {
    // this.address = 'HmIP-RF.000E58A991F047:1'
    let homematicId = this.address.match(/.+\.(.*):/)[1] // returns 000E58A991F047
    homematicEvents.on(homematicId + ':0', (data) => { this.handleEvent(data) })
    homematicEvents.on(homematicId + ':1', (data) => { this.handleEvent(data) })
  }

  handleEvent (data) {
    let { dataPoint, value } = data
    value = JSON.parse(value)
    this.log.warn('received event: %s with value %s (%s)', dataPoint, value, typeof(value))
    switch (dataPoint) {
    case 'ACTUAL_TEMPERATURE':
      this.currentTemperatureState = value
      break
    case 'HUMIDITY':
      this.currentHumidityState = value
      break
    case 'SET_POINT_TEMPERATURE':
      //Target temperature
      this.currentHeatingCoolingState = (value < 5) ? 0 : 1
      this.targetTemperatureState = value
      break
    case 'SET_POINT_MODE':
      if (value == 0) { // Set to automatic
        this.targetHeatingCoolingState = 1; //Characteristic.TargetHeatingCoolingState.HEAT
      } else { // Set on or off depending on current temperature
        // if the temperature is set below 5, show that it is turned off.
        this.targetHeatingCoolingState = (this.targetTemperatureState < 5) ? 0 : 1
      }
      break

    default:
      break
    }

  }

  get currentTemperatureState () {
    if (this._currentTemperatureState !== undefined) {
      return this._currentTemperatureState
    }
    // no value found - get remote value
    this.getRemoteValue(this.defaultChannel, 'ACTUAL_TEMPERATURE', (value) => {
      this.currentTemperatureState = value
    })

    return this._currentTemperatureState
  }

  set currentTemperatureState (current) {
    if (this._currentTemperatureState !== current) {
      this.currentTemperature.updateValue(current)
    }
    this._currentTemperatureState = current
  }

  get targetTemperatureState () {
    if (this._targetTemperatureState !== undefined) {
      return this._targetTemperatureState
    }
    // no value found - get remote value
    this.getRemoteValue(this.defaultChannel, 'SET_POINT_TEMPERATURE', (value) => {
      this.targetTemperatureState = value
    })

    return this._targetTemperatureState
  }

  set targetTemperatureState (current) {
    if (this._targetTemperatureState !== current) {
      this.targetTemperature.updateValue(current)
    }
    this._targetTemperatureState = current
  }

  get currentHumidityState () {
    if (this._currentHumidityState !== undefined) {
      return this._currentHumidityState
    }
    // no value found - get remote value
    this.getRemoteValue(this.defaultChannel, 'HUMIDITY', (value) => {
      this.currentHumidityState = value
    })

    return this._currentHumidityState
  }

  set currentHumidityState (current) {
    if (this._currentHumidityState !== current) {
      this.currentHumidity.updateValue(current)
    }
    this._currentHumidityState = current
  }

  /*
  * Returns the current heating cooling state: 0 = OFF; 1 = HEAT
  */
  get currentHeatingCoolingState () {
    if (this._currentHeatingCoolingState !== undefined) {
      return this._currentHeatingCoolingState
    }
    // Homematic does not know about ON or OFF, only the temperature is set
    // if the temperature is set below 5, show that it is turned off.
    this.currentHeatingCoolingState = (this.targetTemperatureState < 5) ? 0 : 1

    return this._currentHeatingCoolingState

  }

  set currentHeatingCoolingState (current) {
    if (this._currentHeatingCoolingState !== current) {
      this.currentHeatingCooling.updateValue(current)
    }
    this._currentHeatingCoolingState = current
  }

  /*
  * Returns the target heating cooling state: 0 = OFF; 1 = HEAT; 2 = COOL; 3 = AUTO
  */
  get targetHeatingCoolingState () {
    if (this._targetHeatingCoolingState !== undefined) {
      return this._targetHeatingCoolingState
    }
    // no value found - get remote value
    // Homematic does not know about ON or OFF, SET_POINT_MODE 0 = AUTO, 1 = MANUAL
    this.getRemoteValue(this.defaultChannel, 'SET_POINT_MODE', (automatic) => {
      if (automatic == 0 || (this.targetTemperatureState > 5)) { // Set to HEAT // if the temperature is set below 5, show that it is turned off.
        this.targetHeatingCoolingState = 1; //Characteristic.TargetHeatingCoolingState.HEAT
      } else { // Set on or off depending on current temperature
        this.targetHeatingCoolingState = 0; //Characteristic.TargetHeatingCoolingState.OFF
      }
    })

    return this._targetHeatingCoolingState

  }

  set targetHeatingCoolingState (current) {
    if (this._targetHeatingCoolingState !== current) {
      this.currentHeatingCooling.updateValue(current)
    }
    this._targetHeatingCoolingState = current
  }

  // Set the target heating mode - HOmematic only knows about AUTO or NO AUTO
  setTargetHeatingCooling (value, callback) {
    if(value == 1) { // HEATING
      this.setRemoteValue(this.defaultChannel, 'CONTROL_MODE', 0, callback)
    } else { // OFF
      this.setRemoteValue(this.defaultChannel, 'CONTROL_MODE', 1)
      this.setRemoteValue(this.defaultChannel, 'SET_POINT_TEMPERATURE', 4.5, callback)
    }

  }

  // Set the target temperature
  setTargetTemperature (value, callback) {
    this.setRemoteValue(this.defaultChannel, 'SET_POINT_TEMPERATURE', value, callback)
  }


  getRemoteValue(channel, dataPoint, callback) {
    // RPC getValue (000E58A991F047:1 ACTUAL_TEMPERATURE) Response 21.9  | Errors: null
    this.platform.xmlrpchmip.client.methodCall('getValue', [channel, dataPoint], (error, value) => {
      this.log.warn('RPC getValue (%s %s) Response %s (%s)  | Errors: %s', channel, dataPoint, JSON.parse(value), typeof(JSON.parse(value)), error)
      callback(JSON.parse(value))
    })
  }

  setRemoteValue(channel, dataPoint, value, callback) {
    // RPC getValue (000E58A991F047:1 ACTUAL_TEMPERATURE) Response 21.9  | Errors: null
    this.platform.xmlrpchmip.client.methodCall('setValue', [channel, dataPoint, value], (error, response) => {
      this.log.warn('RPC setValue (%s %s) value %s  | Errors: %s | Response: %s', channel, dataPoint, value, error, JSON.stringify(response))
      if (callback) callback()
    })
  }

  /*
     * The getServices function is called by Homebridge and should return an array of Services this accessory is exposing.
     * It is also where we bootstrap the plugin to tell Homebridge which function to use for which action.
     */
  getServices () {
    return this.services
  }

  // Somewhere used in homebridge homematic -- should be deprecated....
  // Used in HomeMaticChannelLoader:91..
  // eslint-disable-next-line no-unused-vars
  setReadOnly (_read) { }

  set serviceClassName (_name) {}
  // eslint-disable-next-line no-unused-vars
  event (address, dp, value) { }
}

module.exports = HmIPTemperatureAndHumidityControl
