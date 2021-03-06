
var engine = require('engine');

function Asteroid(game) {
  engine.Sprite.call(this, game, 'texture-atlas', 'asteroid-x0' + (global.Math.floor(global.Math.random() * 5) + 1) + '.png');

  this.angle = global.Math.random() * 2 * global.Math.PI;
  this.movspeed = (global.Math.random() * 0.001) - 0.0005;
  this.rotspeed = (global.Math.random() * 0.01) - 0.005;
  this.orbit = this.createOrbit();
  this.tempPoint = new engine.Point();

  this.scale.copy(this.createScale());
  this.pivot.set(this.texture.frame.width/2, this.texture.frame.height/2);
  this.rotation = this.angle;

  // activate culling
  this.autoCull = true;
  this.checkWorldBounds = true;
};

Asteroid.prototype = Object.create(engine.Sprite.prototype);
Asteroid.prototype.constructor = Asteroid;

Asteroid.prototype.update = function() {
  engine.Sprite.prototype.update.call(this);

  if(this.renderable) {
    var position = this.orbit.circumferencePoint(this.angle, false, this.tempPoint);
    this.position.copy(position);
    this.rotation += this.rotspeed;
    this.angle += this.movspeed;
  }
};

Asteroid.prototype.createOrbit = function() {
  var width = global.Math.random() * 2048 + 128,
      height = global.Math.random() * 2048 + (width > 1024 ? 128 : 1024),
      ellipse = new engine.Ellipse(2048 / 4, 2048 / 4, width, height);
  return ellipse;
};

Asteroid.prototype.createScale = function() {
  var scale = global.Math.random() * 0.6 + 0.4,
      point = { x: scale, y: scale };
  return point;
};

module.exports = Asteroid;
