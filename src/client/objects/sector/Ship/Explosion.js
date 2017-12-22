
var engine = require('engine');

function Explosion(ship, isStation) {
  this.ship = ship;
  this.game = ship.game;
  this.events = ship.events;

  this.temp = new engine.Point();

  if(isStation){
    this.isStation = true;
  }
  // create hit area
  this.hit = new engine.Circle(this.ship.width/2, this.ship.height/2, this.ship.data.size/2);
};

Explosion.prototype.constructor = Explosion;

Explosion.prototype.create = function() {
  
};

Explosion.prototype.start = function() {
  var temp = this.temp,
      events = this.events,
      ship = this.ship,
      hit = this.hit,
      rnd = this.game.rnd,
      manager = ship.manager, player;

  if(this.ship.manager.state.shipManager.player){
    player = this.ship.manager.state.shipManager.player;
  }
  if(player && this.isStation){
    manager.shockwaveEmitter.explosion(player);
  } else {
    manager.shockwaveEmitter.explosion(ship);
  }
  manager.shockwaveEmitter.at({ center: ship.position });
  manager.shockwaveEmitter.explode(1);
  // manager.shockwaveEmitter.explode(2);
  if(player && this.isStation){
      manager.fireEmitter.pulse(["0xFFFFFF", "0x12def9"]);
      manager.fireEmitter.at({ center: ship.position });
      manager.fireEmitter.explode(1);
      manager.shockwaveEmitter.explode(1);
    this.game.clock.events.add(250, function(){
      manager.fireEmitter.explode(2);
      manager.shockwaveEmitter.explode(2);
      this.game.clock.events.add(250, function(){
        manager.fireEmitter.explode(3);
        manager.shockwaveEmitter.explode(3);
        this.game.clock.events.add(500, function(){
          manager.fireEmitter.explode(10);
          manager.shockwaveEmitter.explode(10);
        }, this)
      }, this)
    }, this)
  };


  var explosionValue = rnd.frac()+0.075

  if(player && this.isStation){
    manager.glowEmitter.explosion(player);
  } else {
    manager.glowEmitter.explosion(ship);
  };
  manager.glowEmitter.at({ center: ship.position });
  // manager.glowEmitter.explode(explosionValue);

  manager.glowEmitter.explode(3);

  events.repeat(50, 100, function() {
    if(rnd.frac() > 0.35) {
      if(player && this.isStation){
        manager.explosionEmitter.explosion(player);
      } else {
        manager.explosionEmitter.explosion(ship);
      }
      manager.explosionEmitter.at({ center: hit.random(false, temp) });
      manager.explosionEmitter.explode(2);
    }
  });

  // this.game.emit('fx/shockwave', {
  //   object: ship,
  //   width: ship.data.size * 18,
  //   height: ship.data.size * 18,
  //   duration: 1024
  // });
};

Explosion.prototype.update = function() {
    this.hit.x = this.ship.x;
    this.hit.y = this.ship.y; 
};

Explosion.prototype.destroy = function() {
  
};

module.exports = Explosion;
