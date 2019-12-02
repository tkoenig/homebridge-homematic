'use strict'

const HomeKitGenericService = require('./HomeKitGenericService.js')
  .HomeKitGenericService

class HmIPTemperatureAndHumiditySensor extends HomeKitGenericService {
  createDeviceService (Service, Characteristic) {
    this.ignoreWorking = true
    this.address = this.adress // fix spelling

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

    this.enableLoggingService('weather')
    this.log.debug('Created new Temperature & Humidity Sensor service for %s: %s, : %s', this.name, this.deviceAdress, this.address)
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
    this.remoteGetValue('ACTUAL_TEMPERATURE', (value) => {
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
    this.remoteGetValue('HUMIDITY', (value) => {
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

  event (address, dp, value) {
    if (this.address !== address) {
      return // skip not related events...
    }

    switch (dp) {
      case 'ACTUAL_TEMPERATURE_STATUS':
        this.currentTemperatureState = JSON.parse(value)
        break
      case 'HUMIDITY_STATUS':
        this.currentHumidityState = JSON.parse(value)
        break
      default:
        this.log.warn('received unhandled event: %s', dp)
        break
    }
    this.addLogEntry({ temp: this.currentTemperatureState, pressure: 0, humidity: this.currentHumidityState })
  }
}

module.exports = HmIPTemperatureAndHumiditySensor
