
var uuid = require('uuid'),
    engine = require('engine'),
    Ship = require('./objects/Ship'),
    AI = require('./AI')
    Utils = require('../utils'),
    Generator = require('../utils/Generator');

function ShipManager(game) {
  this.game = game;
  this.model = game.model;
  this.sockets = game.sockets;
  this.iorouter = game.sockets.iorouter;

  this.ships = {};
  this.count = {};

  this.game.on('ship/add', this.add, this);
  this.game.on('ship/remove', this.remove, this);
  this.game.on('ship/create', this.create, this);

  // activate ai
  this.game.clock.events.loop(1000, this._updateShips, this);
};

ShipManager.prototype.constructor = ShipManager;

ShipManager.prototype.init = function() {
  // ai manager
  this.ai = new AI(this);

  // io router
  this.sockets.iorouter.on('ship/data', this.data.bind(this));
  this.sockets.iorouter.on('ship/plot', this.plot.bind(this));
  this.sockets.iorouter.on('ship/attack', this.attack.bind(this));
  this.sockets.iorouter.on('ship/enhancement/*', this.enhancement.bind(this));

  // generate npcs
  this.generateRandomShips();
  // this.generatePirateShips();
};

ShipManager.prototype.add = function(ship) {
  if(this.ships[ship.uuid] === undefined) {
    this.ships[ship.uuid] = ship;
    if(this.count[ship.chassis]) {
      this.count[ship.chassis]++;
    } else {
      this.count[ship.chassis] = 1;
    }
  }
};

ShipManager.prototype.create = function(data, user, position) {
  var self = this, ship,
      position = position || this.generateRandomPosition(user ? 512 : 2048),
      data = Utils.extend({
        x: data.x || position.x,
        y: data.y || position.y
      }, data);
  ship = new Ship(this, data);
  ship.user = user;
  ship.init(function(err) {
    self.game.emit('ship/add', ship);
  });
};

ShipManager.prototype.remove = function(ship) {
  var index,
      ship = this.ships[ship.uuid];
  if(ship !== undefined) {
    delete this.ships[ship.uuid] && ship.destroy();

    this.count[ship.chassis] && this.count[ship.chassis]--;
    this.sockets.io.sockets.emit('ship/removed', {
      uuid: ship.uuid
    });
  }
};

ShipManager.prototype.plot = function(sock, args, next) {
  var user = sock.sock.handshake.session.user,
      data = args[1],
      ship = this.ships[data.uuid];
  if(ship && ship.user && ship.user.uuid === user.uuid) {
    ship.movement.plot(data.destination);
  }
};

ShipManager.prototype.attack = function(sock, args, next) {
  var ships = this.ships,
      sockets = this.sockets,
      session = sock.sock.handshake.session,
      user = session.user,
      data = args[1],
      ship = ships[data.uuid];
  if(ship && ship.user && ship.user.uuid === user.uuid) {
    ship.attack(data, session.rtt);
  }
};

ShipManager.prototype.enhancement = function(sock, args, next) {
  var ships = this.ships,
      sockets = this.sockets,
      session = sock.sock.handshake.session,
      user = session.user,
      path = args[0],
      data = args[1],
      ship = ships[data.uuid];
  switch(path) {
    case 'ship/enhancement/start':
      if(ship && ship.user && ship.user.uuid === user.uuid) {
        if(!ship.activate(data.enhancement)) {
          this.sockets.io.sockets.emit('ship/enhancement/cancelled', {
            uuid: ship.uuid,
            enhancement: data.enhancement
          });
        }
      }
      break;
    default:
      break;
  }
};

ShipManager.prototype.data = function(sock, args, next) {
  var ship,
      uuid, enhancements,
      uuids = args[1].uuids,
      user = sock.sock.handshake.session.user,
      ships = [];
  for(var u in uuids) {
    ship = this.ships[uuids[u]];
    if(ship) {
      ship.ignoreEnhancements = true;
      enhancements = Object.keys(ship.enhancements.available);
      ships.push({
        id: ship.id,
        x: ship.x,
        y: ship.y,
        uuid: ship.uuid,
        name: ship.data.name,
        user: ship.user ? ship.user.uuid : null,
        ai: ship.ai ? ship.ai.type : null,
        username: ship.user ? ship.user.data.username : null,
        chassis: ship.chassis,
        sector: ship.data.sector,
        rotation: ship.movement.rotation,
        credits: ship.data.credits,
        reputation: ship.data.reputation,
        kills: ship.data.kills,
        disables: ship.data.disables,
        assists: ship.data.assists,
        durability: ship.durability,
        capacity: ship.capacity,
        size: ship.size,
        energy: ship.energy,
        recharge: ship.recharge,
        health: ship.health,
        heal: ship.heal,
        armor: ship.armor,
        rate: ship.rate,
        speed: ship.speed,
        critical: ship.critical,
        evasion: ship.evasion,
        hardpoints: ship.hardpoints,
        enhancements: enhancements
      });
      ship.ignoreEnhancements = false;
    }
  }
  sock.emit('ship/data', {
    type: 'sync', ships: ships
  });
};

ShipManager.prototype.update = function() {
  var data, ship, position, movement,
      moving, ships = this.ships,
      arr = [];
  for(var s in ships) {
    ship = ships[s];
    movement = ship.movement;
    movement.update();
    position = movement.position;
    data = {
      uuid: ship.uuid,
      pos: { x: position.x, y: position.y },
      spd: ship.speed * movement.throttle
    };
    arr.push(data);
  }
  this.sockets.io.sockets.emit('ship/sync', {
    ships: arr
  });
};

ShipManager.prototype.generateRandomShips = function() {
  var iterator = {
        'ubaidian-x01': { race: 'ubaidian', count: 0 },
        'ubaidian-x02': { race: 'ubaidian', count: 2 },
        'ubaidian-x03': { race: 'ubaidian', count: 4 },
        'ubaidian-x04': { race: 'ubaidian', count: 4 },
        'hederaa-x01': { race: 'hederaa', count: 0 },
        'mechan-x01': { race: 'mechan', count: 0 },
        'mechan-x02': { race: 'mechan', count: 0 },
        'mechan-x03': { race: 'mechan', count: 0 },
        'general-x01': { race: 'ubaidian', count: 0 },
        'general-x02': { race: 'ubaidian', count: 0 },
        'general-x03': { race: 'ubaidian', count: 0 }
      };
  for(var chassis in iterator) {
    for(var i=0; i<iterator[chassis].count; i++) {
      this.generateRandomShip(chassis, iterator[chassis].race);
    }
  }
};

ShipManager.prototype.generatePirateShips = function() {
  var base, ship,
      iterator = [{
        location: { x: -2048, y: 2048 },
        ships: [
          { name: 'xinli', chassis: 'general-x01', credits: 1500, reputation: -100 },
          { name: 'mocolo', chassis: 'general-x01', credits: 1500, reputation: -100 },
          { name: 'mavero', chassis: 'general-x02', credits: 1500, reputation: -100 },
          { name: 'saag', chassis: 'general-x02', credits: 1500, reputation: -100 }
        ]
      }, {
        location: { x: 6144, y: 2048 },
        ships: [
          { name: 'satel', chassis: 'general-x01', credits: 1500, reputation: -100 },
          { name: 'oeem', chassis: 'general-x01', credits: 1500, reputation: -100 },
          { name: 'thath', chassis: 'general-x02', credits: 1500, reputation: -100 },
          { name: 'zeus', chassis: 'general-x03', credits: 1500, reputation: -100 }
        ]
      }, {
        location: { x: 2048, y: -2048 },
        ships: [
          { name: 'manduk', chassis: 'general-x01', credits: 1500, reputation: -100 },
          { name: 'deuh', chassis: 'general-x01', credits: 1500, reputation: -100 },
          { name: 'talai', chassis: 'general-x02', credits: 1500, reputation: -100 },
          { name: 'kaan', chassis: 'general-x03', credits: 1500, reputation: -100 }
        ]
      }, {
        location: { x: 2048, y: 6144 },
        ships: [
          { name: 'theni', chassis: 'general-x01', credits: 1500, reputation: -100 },
          { name: 'zulu', chassis: 'general-x01', credits: 1500, reputation: -100 },
          { name: 'saroc', chassis: 'general-x02', credits: 1500, reputation: -100 },
          { name: 'malvo', chassis: 'general-x02', credits: 1500, reputation: -100 }
        ]
      }],
      len = iterator.length;

  // create pirates
  for(var i=0; i<len; i++) {
    base = iterator[i];
    for(var s=0; s<base.ships.length; s++) {
      ship = base.ships[s];
      this.create({
        name: ship.name,
        chassis: ship.chassis,
        credits:  global.Math.floor(ship.credits * global.Math.random() + 100),
        reputation: global.Math.floor(ship.reputation * (1 + global.Math.random())),
        throttle: 1.0,
        ai: 'pirate',
        x: base.location.x,
        y: base.location.y
      });
    }
  }
};

ShipManager.prototype.generateRandomShip = function(chassis, race, ai) {
  var name = Generator.getName(race).toUpperCase(),
      throttle = global.Math.random() * 0.5 + 0.5,
      ai = ai || 'basic';
      this.create({
        name: name,
        chassis: chassis,
        throttle: throttle,
        ai: ai,
        credits: global.Math.floor(global.Math.random() * 250 + 50),
        reputation: global.Math.floor(100 * (1 + global.Math.random()))
      });
};

ShipManager.prototype._updateShips = function() {
  var ship, delta,
      ships = this.ships,
      update, updates = [],
      stats;
  for(var s in ships) {
    if(ships[s].disabled) { continue; }

    ship = ships[s];
    stats = ship.config.stats;
    update = { uuid: ship.uuid };

    // update health
    if(ship.health < stats.health) {
      delta = ship.heal;
      ship.health = global.Math.min(stats.health, ship.health + delta);
      update.health = engine.Math.roundTo(ship.health, 1);
    }

    // update energy
    if(ship.energy < stats.energy) {
      delta = ship.recharge;
      ship.energy = global.Math.min(stats.energy, ship.energy + delta);
      update.energy = engine.Math.roundTo(ship.energy, 1);
    }

    if(delta !== undefined) {
      updates.push(update);
    }
  }
  if(updates.length > 0) {
    this.sockets.io.sockets.emit('ship/data', {
      type: 'update', ships: updates
    });
  }
};

ShipManager.prototype.getRandomShip = function() {
  var ships = this.ships,
      keys = Object.keys(ships),
      random = keys[Math.floor(keys.length * Math.random())];
  return ships[random];
};

ShipManager.prototype.generateRandomPosition = function(size) {
  var size = size || (global.Math.random() > 0.5 ? 2048 : 1024),
      halfSize = size/2,
      center = 2048,
      start = center - halfSize
      randX = global.Math.random() * size,
      randY = global.Math.random() * size;
  return new engine.Point(start + randX, start + randY);
};

module.exports = ShipManager;
