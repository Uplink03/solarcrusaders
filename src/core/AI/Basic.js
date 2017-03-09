
var engine = require('engine');

function Basic(ship) {
  this.type = 'basic';

  this.ship = ship;
  this.game = ship.game;
  this.manager = ship.manager;

  this.timer = null;
  this.target = null;
  this.sensor = new engine.Circle();
  this.rnd = new engine.RandomGenerator();

  this.settings = {
    aim: 1.5,
    respawn: 10000,
    disengage: 7680,
    friendly: ['user', 'basic'],
    escape: {
      health: 0.2,
      position: {
        radius: 256,
        x: 2048,
        y: 2048
      }
    },
    sensor: {
      range: 4096,
      pursuit: 512
    }
  };
};

Basic.prototype.constructor = Basic;

Basic.prototype.update = function() {
  var ship = this.ship,
      ships = this.manager.ships,
      sensor = this.sensor,
      settings = this.settings,
      p1, p2, destination, scan,
      targets, course,
      priority = {
        enemy: {}
      };

  p1 = ship.movement.position;
  sensor.setTo(p1.x, p1.y, settings.sensor.range);

  // disengage due to damage
  if(ship.data.health / ship.config.stats.health < settings.escape.health) {
    this.disengage();
  } else if(this.rnd.frac() > 0.5) {
    // scan nearby ships
    for(var s in ships) {
      scan = ships[s];
      p2 = scan.movement.position;

      if(scan.disabled) { continue; }
      if(sensor.contains(p2.x, p2.y)) {
        if(!this.friendly(scan)) {
          priority.enemy[scan.data.health] = scan;
        }
      }
    }

    // find weakest
    targets = Object.keys(priority.enemy);
    if(targets.length > 0) {
      this.engage(priority.enemy[targets.sort()[0]]);
    }
  }
  
  // plot destination
  if(this.target) {
    p2 = this.target.movement.position;
    ship.movement.plot({ x: p2.x-p1.x, y: p2.y-p1.y });
  } else {
    p2 = this.getHomePosition();
    ship.movement.plot({ x: p2.x-p1.x, y: p2.y-p1.y });
  }
};

Basic.prototype.friendly = function(target) {
  var settings = this.settings;
  if(target.ai && settings.friendly.indexOf(target.ai.type) >= 0) { return true; }
  if(target.user && settings.friendly.indexOf('user') >= 0) { return true; }
  return false;
};

Basic.prototype.engage = function(target) {
  var settings = this.settings,
      ship = this.ship;

  // finish attack
  if(this.target == null && !this.friendly(target)) {
    this.target = target;

    this.attacker && this.game.clock.events.remove(this.attacker);
    this.attacker = this.game.clock.events.loop(ship.data.rate, this.attack, this);

    this.disengager && this.game.clock.events.remove(this.disengager);
    this.disengager = this.game.clock.events.add(settings.disengage, this.disengage, this);
  }

  // engage countermeasures
  if(ship.data.health < 0.5) {
    ship.activate('shield');
  }
  if(ship.data.health < 0.25) {
    ship.activate('heal');
  }
  if(this.rnd.frac() > 0.8) {
    ship.activate('booster');
  }
};

Basic.prototype.disengage = function() {
  this.target = null;
  this.attacker && this.game.clock.events.remove(this.attacker);
};

Basic.prototype.attack = function() {
  var sensor = this.sensor,
      ship = this.ship,
      target, movement,
      point = {};
  if(this.target && this.target.data) {
    target = this.target;
    position = target.movement.position;

    // aim
    sensor.setTo(position.x, position.y, target.data.size * this.settings.aim);
    sensor.random(false, point);

    // attack
    ship.attack({
      uuid: ship.uuid,
      targ: point
    });
  }
};

Basic.prototype.getHomePosition = function() {
  return this.manager.generateRandomPosition(1024);
};

Basic.prototype.destroy = function() {
  this.timer && this.game.clock.events.remove(this.timer);
  this.ship = this.game = this.manager =
    this.timer = this.target = this.aim = undefined;
};

module.exports = Basic;
