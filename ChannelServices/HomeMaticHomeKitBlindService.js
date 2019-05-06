'use strict'

var HomeKitGenericService = require('./HomeKitGenericService.js').HomeKitGenericService
var util = require('util')

function HomeMaticHomeKitBlindService (log, platform, id, name, type, adress, special, cfg, Service, Characteristic) {
  HomeMaticHomeKitBlindService.super_.apply(this, arguments)
}

util.inherits(HomeMaticHomeKitBlindService, HomeKitGenericService)

HomeMaticHomeKitBlindService.prototype.createDeviceService = function (Service, Characteristic) {
  var that = this
  var blind = new Service.WindowCovering(this.name)
  this.delayOnSet = 750
  this.observeInhibit = this.getClazzConfigValue('observeInhibit', false)
  this.minValueForClose = this.getClazzConfigValue('minValueForClose', 0)
  this.maxValueForOpen = this.getClazzConfigValue('maxValueForOpen', 100)
  this.ignoreWorking = true
  this.currentLevelInterval
  this.currentLevel = 0
  this.targetLevel = undefined;

  if (this.minValueForClose > 0) {
    this.log.debug('there is a custom closed level of %s', this.minValueForClose)
  }

  if (this.maxValueForOpen < 100) {
    this.log.debug('there is a custom open level of %s', this.maxValueForOpen)
  }

  this.inhibit = false
  this.services.push(blind)

  this.currentPos = blind.getCharacteristic(Characteristic.CurrentPosition)
    .on('get', function (callback) {
      that.query('LEVEL', function (value) {
        that.log.warn('QUERYING LEVEL for currentPOS: %s', value)
        if (value < that.minValueForClose) {
          value = 0
        }
        if (value > that.maxValueForOpen) {
          value = 100
        }
        if (callback) callback(null, value)
      })
    })

  this.currentPos.eventEnabled = true

  this.targetPos = blind.getCharacteristic(Characteristic.TargetPosition)
    .on('get', function (callback) {
      that.query('LEVEL', function (value) {
        that.log.warn('QUERYING LEVEL for targetPOS: %s', value)
        if (callback) {
          if (value <= that.minValueForClose) {
            value = 0
          }
          if (value >= that.maxValueForOpen) {
            value = 100
          }
          callback(null, value)
        }
      })
    })
    .on('set', function (value, callback) {
      if ((that.inhibit === false) || (that.observeInhibit === false)) {
        that.log.warn('setting level to: %s', value)
        that.targetLevel = value
        that.delayed('set', 'LEVEL', value, that.delayOnSet)
      } else {
      // wait one second to resync data
        that.log.warn('inhibit is true wait to resync')
        setTimeout(function () {
          that.queryData()
        }, 1000)
      }

      callback()
    })

  this.pstate = blind.getCharacteristic(Characteristic.PositionState)
    .on('get', function (callback) {
      that.log.warn('getting pstate!')
      that.query('DIRECTION', function (value) {
        if (callback) {
          var result = 2
          if (value !== undefined) {
            switch (value) {
              case 0:
                result = 2 // Characteristic.PositionState.STOPPED
                break
              case 1:
                result = 0 // Characteristic.PositionState.DECREASING
                break
              case 2:
                result = 1 // Characteristic.PositionState.INCREASING
                break
              case 3:
                result = 2 // Characteristic.PositionState.STOPPED
                break
            }
            callback(null, result)
          } else {
            callback(null, '0')
          }
        }
      })
    })

    // this.pstate.eventEnabled = true

  // only add if ObstructionDetected is used
  if (this.observeInhibit === true) {
    this.obstruction = blind.getCharacteristic(Characteristic.ObstructionDetected)
      .on('get', function (callback) {
        callback(null, that.inhibit)
      })
    this.obstruction.eventEnabled = true
    this.platform.registerAdressForEventProcessingAtAccessory(this.adress + '.INHIBIT', this)
  }

  this.platform.registerAdressForEventProcessingAtAccessory(this.adress + '.DIRECTION', this)
  this.platform.registerAdressForEventProcessingAtAccessory(this.adress + '.LEVEL', this)
  this.deviceAdress = this.adress.slice(0, this.adress.indexOf(':'))
  this.queryData()
}

HomeMaticHomeKitBlindService.prototype.queryData = function (newValue) {
  let that = this
  //trigger new event
  this.remoteGetValue('LEVEL', () => {}) // trigger events

  if (this.observeInhibit === true) {
    this.remoteGetValue('INHIBIT', function (newValue) {
      // that.datapointEvent('1:INHIBIT', newValue)
    })
  }
}

// https://github.com/thkl/homebridge-homematic/issues/208
// if there is a custom close level and the real level is below homekit will get the 0% ... and visevera for max level
HomeMaticHomeKitBlindService.prototype.setFinalBlindLevel = function (newValue) {
  if (newValue < this.minValueForClose) {
    newValue = 0
  }
  if (newValue > this.maxValueForOpen) {
    newValue = 100
  }

  this.log.warn('setting new value: %s', newValue)
  this.currentPos.updateValue(newValue, null)
  this.targetPos.updateValue(newValue, null)
  this.targetLevel = undefined
}

HomeMaticHomeKitBlindService.prototype.datapointEvent = function (dp, newValue) {
  let that = this
  this.log.warn('recieving event for %s: %s value: %s', this.adress, dp, newValue)

  if (this.isDataPointEvent(dp, 'INHIBIT')) {
    this.inhibit = newValue
    if (this.obstruction !== undefined) {
      this.obstruction.updateValue(newValue, null)
    }
  }

  if (this.isDataPointEvent(dp, 'DIRECTION')) {
      // 0 = NONE (Standard)
      // 1=UP
      // 2=DOWN
      // 3=UNDEFINED
    switch (newValue) {
      case 0:
        this.pstate.updateValue(2, null)
        break
      case 1: //opening - INCREASING
        this.pstate.updateValue(1, null)
        this.updateTargetPostion(100) // set target position to 100
        break
      case 2: //closing - DECREASING
        this.pstate.updateValue(0, null)
        this.updateTargetPostion(0)
        break
      case 3:
        this.pstate.updateValue(2, null)
        break
    }
  }

  // if (this.isDataPointEvent(dp, 'WORKING_SLATS')) {
  //   if (newValue === false) {
  //     this.remoteGetValue('LEVEL', function (value) {
  //       that.currentPos.updateValue(value, null)
  //       that.targetPos.updateValue(value, null)
  //     })
  //   }
  // }

  if (this.isDataPointEvent(dp, 'LEVEL')) {
    this.currentLevel = newValue
    this.currentPos.updateValue(newValue, null)
  }

  if (this.isDataPointEvent(dp, 'WORKING')) {
    // Working - query for new level
    if (newValue === true) {
      //Force triggering new events every 750 ms
      // clearInterval(this.currentLevelInterval)
      // this.currentLevelInterval = setInterval(() => {
      //   this.remoteGetValue('LEVEL', () => {}) // trigger events
      //   }, 750)
    } else { // STOPPED - stop quering and set tagetPosition
      // clearInterval(this.currentLevelInterval);
      this.log.warn('Work DONE, setting current LEVEL: %s', this.currentLevel)
      this.setFinalBlindLevel(this.currentLevel)
      this.pstate.updateValue(2, null) // STOPPED
    }
  }
}

HomeMaticHomeKitBlindService.prototype.updateTargetPostion = function (value) {
  this.log.warn('setting targetpos to %s, current: %s',value, this.targetLevel)
  if (this.targetLevel === undefined){
    this.log.warn('updating target position!')
    this.targetPos.updateValue(value, null)
  }
}

module.exports = HomeMaticHomeKitBlindService
