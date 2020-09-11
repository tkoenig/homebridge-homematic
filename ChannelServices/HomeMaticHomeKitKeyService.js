'use strict'

const HomeKitGenericService = require('./HomeKitGenericService.js')
  .HomeKitGenericService

class HomeMaticHomeKitKeyService extends HomeKitGenericService {
  createDeviceService (Service, Characteristic) {
    this.ignoreWorking = true
    this.address = this.adress // fix spelling

    var service = new Service.StatelessProgrammableSwitch(this.name)
    var cc = this.programmableSwitchCharacteristic = service.getCharacteristic(Characteristic.ProgrammableSwitchEvent)

    // this.currentStateCharacteristic['PRESS_SHORT'] = cc
    // this.currentStateCharacteristic['PRESS_LONG'] = cc
    this.log.debug('Creating new HomekitKey service for %s: %s, : %s', this.name, this.deviceAdress, this.address)
    this.services.push(service)
  }

  event (address, dp, value) {
    if (this.address !== address) {
      return // skip not related events...
    }

    if (dp === 'STATE') {
      this.currentState = value
    }
    this.log.warn('received  event: %s with value %s', dp, value)
    switch (dp) {
      case 'PRESS_SHORT':
        this.programmableSwitchCharacteristic.updateValue(0)
        break;
      case 'PRESS_LONG':
        this.programmableSwitchCharacteristic.updateValue(2)
        break;

      default:
        this.log.warn('received unhandled event: %s with value %s', dp, value)
        break;
    }
  }
}

module.exports = HomeMaticHomeKitKeyService

