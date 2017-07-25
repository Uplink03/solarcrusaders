
var engine = require('engine'),
    Station = require('./Station');

function StationManager(game) {
  this.game = game;
  this.socket = game.net.socket;
  this.stationNetManager = game.states.current.stationNetManager;
  this.stationsGroup = new engine.Group(game);

  this.game.world.foreground.add(this.stationsGroup);

  this.socket.on('station/sync', this.sync.bind(this));

  this.game.on('station/create', this.create, this);

  // stations
  this.stations = {};
}

StationManager.prototype.constructor = StationManager;

StationManager.prototype.create = function(data) {
  var game = this.game,
      station = new Station(this, data);
      station.boot();

  // add to group
  this.stations[data.uuid] = station;

  // console.log(station)

  // wait
  this.stationsGroup.add(this.stations[data.uuid]);
};

StationManager.prototype.sync = function(data) {
  var station, cached,
      game = this.game,
      stations = data.stations,
      stationNetManager = this.stationNetManager;
      // console.log(data)
  for(var s=0; s<stations.length; s++) {
    station = this.stations[stations[s].uuid];
    
    if(station) {
      // sync station
      // console.log(station)
      // console.log('in station manager, data is ', station.period)
      this.stations[station.data.uuid].period = stations[s].period;
      // console.log(this.stations[station.data.uuid].period)
    } else {
      data = stationNetManager.getStationData(stations[s].uuid);

      if(data) {
        this.game.emit('station/create', data);
      }
    }
  }
};

StationManager.prototype.remove = function(station) {
  //..
};

StationManager.prototype.destroy = function() {

};

module.exports = StationManager;
