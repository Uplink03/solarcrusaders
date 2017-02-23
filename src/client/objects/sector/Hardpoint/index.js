
var engine = require('engine'),
    Energy = require('./Energy'),
    Projectile = require('./Projectile'),
    Pulse = require('./Pulse');

function Hardpoint(parent, data, config) {
  this.parent = parent;
  this.game = parent.game;
  this.ship = parent.ship;
  this.config = config;
  this.data = data;

  this.actives = [];
  this.isRunning = false;
  this.types = {
    rocket: Projectile,
    energy: Energy,
    pulse: Pulse
  }

  this.target = new engine.Point();
  this.origin = new engine.Point();

  this.cap = new engine.Sprite(this.game, 'texture-atlas', 'turret-cap-' + this.ship.config.race + '.png');
  
  this.sprite = new engine.Sprite(this.game, 'texture-atlas', data.sprite + '.png');
  this.sprite.position.set(config.position.x, config.position.y);
  this.sprite.pivot.set(config.pivot.x, config.pivot.y);
  
  this.ship.addChild(this.sprite);
  this.sprite.addChild(this.cap);

  if(config.type && config.type.indexOf('projectile') >= 0) {
    this.sprite.visible = false;
  }
};

Hardpoint.prototype.constructor = Hardpoint;

Hardpoint.prototype.fire = function(targ) {
  var launcher, origin,
      data = this.data,
      ship = this.ship,
      types = this.types,
      target = this.target,
      actives = this.actives,
      length = actives.length,
      spawn = data.spawn,
      distance = engine.Point.distance(ship.position, targ);

  if(distance <= data.range) {
    target.copyFrom(targ);

    for(var i=0; i<length; i++) {
      launcher = actives[i];

      if(!launcher.isDone) {
        spawn--;
      }
      if(launcher.continue) {
        launcher.continue(target);
      }
    }

    for(var i=0; i<spawn; i++) {
      launcher = new types[data.type](this);
      launcher.start(target, distance, spawn, i);

      actives.push(launcher);
    }
  }

  this.isRunning = true;
};

Hardpoint.prototype.hit = function(ship, target) {
  var launcher,
      rnd = this.game.rnd,
      actives = this.actives,
      length = actives.length;
      vector = ship.movement._vector,
      speed = ship.movement._speed

  for(var i=0; i<length; i++) {
    launcher = actives[i];
    launcher.hit && launcher.hit(ship, target);
  }

  this.explosionEmitter.small(vector, speed);
  this.explosionEmitter.at({ center: target });
  this.explosionEmitter.explode(rnd.integerInRange(1,2));
  
  this.flashEmitter.attack(vector, speed);
  this.flashEmitter.at({ center: target });
  this.flashEmitter.explode(rnd.integerInRange(1,2));
};

Hardpoint.prototype.update = function() {
  if(!this.isRunning) { return; }

  var launcher,
      remove = [],
      actives = this.actives,
      length = actives.length;

  for(var i=0; i<length; i++) {
    launcher = actives[i];
    
    if(launcher.isRunning) {
      launcher.update();
    } else {
      launcher.destroy();
      remove.push(launcher);
    }
  }

  while(remove.length > 0) {
    launcher = remove.pop();
    actives.splice(actives.indexOf(launcher), 1);
  }

  // stop
  if(length == 0) {
    this.isRunning = false;
  }
};

Hardpoint.prototype.updateTransform = function(target) {
  var game = this.game,
      ship = this.ship,
      sprite = this.sprite,
      origin = this.origin,
      target = target || this.target;

  // absolute origin
  ship.updateTransform();
  game.world.worldTransform.applyInverse(ship.worldTransform.apply(sprite), origin);
  engine.Line.pointAtDistance({ x: origin.x, y: origin.y }, target, 18, origin);
  sprite.rotation = engine.Point.angle(origin, target)-ship.rotation;

  return origin;
};

Hardpoint.prototype.destroy = function() {
  var launcher,
      actives = this.actives;
  for(var i=0; i<this.actives.length; i++) {
    launcher = actives[i];
    launcher.destroy();
  }
  this.parent = this.game = this.ship =
    this.config = this.target = this.cap =
    this.position = this.sprite = this.launcher =
    this.data = undefined;
};

module.exports = Hardpoint;
