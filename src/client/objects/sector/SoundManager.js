var engine = require('engine'),
    Ship = require('./Ship'),
    ShipManager = require('./ShipManager'),
    EnhancementManager = require('./EnhancementManager'),
    ExplosionEmitter = require('./emitters/ExplosionEmitter'),
    FlashEmitter = require('./emitters/FlashEmitter'),
    GlowEmitter = require('./emitters/GlowEmitter'),
    ShockwaveEmitter = require('./emitters/ShockwaveEmitter'),
    FireEmitter = require('./emitters/FireEmitter'),
    Indicator = require('./misc/Indicator');


function SoundManager(game) {
  this.game = game;
  this.clock = game.clock;
  this.net = game.net;
  this.socket = game.net.socket;
  this.game.soundManager = this;
  // this.shipManager = this.game.states.current.shipManager;

  this.sounds = {};

  this.isLooping = [];  

  this.game.on('ship/player', this._player, this);
  this.game.on('ship/sound/attack', this.generateAttackSound, this);
  this.game.on('ship/sound/thrusters', this.generateThrusterSound, this);
  this.game.on('ship/sound/death', this.generateExplosionSound, this);
  this.game.on('ship/sound/growl', this.generateQueenGrowl, this);
  this.game.on('ship/enhancement/started', this.generateEnhancementSound, this);
  this.game.on('ship/sound/stop', this.stopSoundLoop, this);
  this.game.on('ship/sound/spawn', this.generateSpawnSound, this);
  this.game.on('ship/sound/damageCritical', this.generateDamageCriticalSound, this);

  this.game.on('ship/hardpoint/fire', this.generateFireSound, this);
  this.game.on('ship/hardpoint/stopfire', this.stopFireSound, this);

  this.game.on('squad/sound/engage', this.generateSquadEngageSound, this);

  this.game.on('global/sound/spawn', this.generateSpawnSound, this);

  this.game.on('game/backgroundmusic', this.generateBackgroundMusic, this);

  this.dangerAlert = false
}

SoundManager.prototype.constructor = SoundManager;

SoundManager.prototype.init = function() { 
  console.log('in SoundManager init()')
};


SoundManager.prototype.preload = function(game) {
  var game = this.game,
      load = game.load;


  
  // load sound
  console.log('loading sounds')

  load.audio('background1', 'sounds/mood.mp3');
  load.audio('background2', 'sounds/background_music/eerie1.mp3');
  load.audio('background3', 'sounds/background_music/eerie2.mp3');
  load.audio('background4', 'sounds/background_music/Spacetheme1.mp3');

 
  load.audio('capitalLaser','sounds/lasers/capitalShipLaser.mp3');
  load.audio('cruiserLaser','sounds/lasers/cruiserLaser1.mp3');
  load.audio('multiLaser','sounds/lasers/midSizeMultiLaser.mp3');

  load.audio('nucleon_pulse','sounds/pulses/nucleon_pulse.mp3');
  load.audio('quantum_pulse','sounds/pulses/quantum_pulse.mp3');
  load.audio('tarkin_pulse','sounds/pulses/tarkin_pulse.mp3');
  load.audio('grenlin_pulse','sounds/pulses/grenlin_pulse.mp3');
  load.audio('bazuko_pulse','sounds/pulses/bazuko_pulse.mp3');
  load.audio('vulcan_pulse','sounds/pulses/vulcan_pulse.mp3')
 
  load.audio('rocket1','sounds/rockets/rocket1.mp3');
  load.audio('rocket2','sounds/rockets/rocket2.mp3');
  load.audio('rocket3','sounds/rockets/rocket3.mp3');

  load.audio('mediumThrusters1','sounds/thrusters/mediumThrusters1.mp3');
  load.audio('mediumThrusters2','sounds/thrusters/mediumThrusters2.mp3');
  load.audio('mediumThrusters3','sounds/thrusters/mediumThrusters3.mp3');

  load.audio('basicBeam','sounds/beamWeapons/basicBeam.mp3');
  // load.audio('smallBeam','sounds/beamWeapons/green_beam.mp3');
  load.audio('capitalBeam','sounds/beamWeapons/capitalBeam.mp3');
  load.audio('smallBeam','sounds/beamWeapons/smallBeamBounced.mp3');
  load.audio('repairBeam','sounds/beamWeapons/repairBeams/ubadianRepair1.mp3');
  load.audio('harvesterBeam1','sounds/beamWeapons/scavBeams/hrvstr1.mp3');
  load.audio('harvesterBeam2','sounds/beamWeapons/scavBeams/hrvstr2.mp3');
  load.audio('harvesterBeam3','sounds/beamWeapons/scavBeams/hrvstr3.mp3');
  load.audio('harvesterBeam4','sounds/beamWeapons/scavBeams/hrvstr4.mp3');
  load.audio('harvesterBeam5','sounds/beamWeapons/scavBeams/hrvstr5.mp3');
  load.audio('disintegratorBeam','sounds/beamWeapons/scavBeams/Disintegrator1.1.mp3');
  
  load.audio('beam7','sounds/beamWeapons/beam7.mp3');
  load.audio('beam9','sounds/beamWeapons/beam9.mp3');
  load.audio('beam11','sounds/beamWeapons/beam11.mp3');

  load.audio('booster','sounds/thrusters/heavyOverdrive.mp3');
  load.audio('booster-advanced','sounds/thrusters/heavyOverdrive.mp3');
  load.audio('growl1','sounds/thrusters/scavThrusters/scavThrust1.mp3');
  load.audio('growl2','sounds/thrusters/scavThrusters/scavThrust2.mp3');
  load.audio('growl3','sounds/thrusters/scavThrusters/scavThrust3.mp3');

  load.audio('queenSpawn','sounds/misc/queenSpawn.mp3');

  load.audio('shield','sounds/shields/heavyShieldsUp.mp3');

  load.audio('piercing','sounds/piercingDamage/PiercingEngaged.mp3');
  // load.audio('heal','sounds/piercingDamage/component2.mp3');


  load.audio('heal','sounds/repair/healthSFX99.mp3');
  load.audio('detect','sounds/scanner/scanner.mp3');

  // EXPLOSIONS
  load.audio('explosion1','sounds/explosions/explosion_new_1.mp3');
  load.audio('explosion2','sounds/explosions/explosion_new_2.mp3');
  load.audio('explosion3','sounds/explosions/explosion_new_3.mp3');
  load.audio('explosion4','sounds/explosions/explosion_new_3.pitched2.mp3');
  load.audio('explosion5','sounds/explosions/explosion_new_3.pitched3.mp3');
  load.audio('explosion6','sounds/explosions/explosion_new_3.rerepitched.mp3');

  load.audio('capitalShipExplosion','sounds/explosions/deathExplosion.mp3');
  load.audio('capitalShipExplosion2','sounds/explosions/actionExplosion.mp3');
  load.audio('capitalShipExplosion3','sounds/explosions/explosionBig100.mp3');

  load.audio('queenDeath','sounds/explosions/queenDeath.mp3');
  load.audio('overseerDeath','sounds/explosions/overseerDeath3.mp3');
  load.audio('harvesterDeath1','sounds/explosions/collectorDeath.mp3');
  load.audio('harvesterDeath2','sounds/explosions/larvaDeath.mp3');

  load.audio('dangerAlert','sounds/misc/lowHealthDangerSFX.mp3');
};

SoundManager.prototype.create = function(manager) {
  this.config = this.game.cache.getJSON('item-configuration', false);
  this.manager = manager;
  this.shipManager = manager.shipManager;
  this.ships = this.shipManager.ships;
};

SoundManager.prototype.generateBackgroundMusic = function(){
  // this.generateSound('background', 0.1, true);
  var num = Math.floor((Math.random() * 3)+1);
  // this.generateSound('background'+'num', 0.30, true);

  // this.generateSound('background4', 0.30, true);
};

SoundManager.prototype.generateThrusterSound = function(){
  var num = Math.floor((Math.random() * 3)+1);
  this.generateSound('mediumThrusters'+num, 1, false);
};

SoundManager.prototype.generateQueenGrowl = function(ship){
  var num = Math.floor((Math.random() * 3)+1),
      player = this.player,
      distance, volume;
  if(player) {   
    distance = engine.Point.distance(ship, player);    
    volume = global.Math.max(1.4 - (distance / 2000), 0);
  };
  if(volume > 0){
    this.generateSound('growl'+num, volume, false);
  };

  ship.events.loop(4000, growlTimer = function(){
    var num = Math.floor((Math.random() * 3)+1),
        player = this.player;
    if(player) {   
      distance = engine.Point.distance(ship, player);    
      volume = global.Math.max(1.4 - (distance / 2000), 0);
    };
    if(volume > 0){
      // console.log('growl'+num, volume)
      this.generateSound('growl'+num, volume, false); 
    //put in a graphic pulse effect
    };  
  }, this);
};

SoundManager.prototype.generateEnhancementSound = function(data){
  if(!this.config){
    return
  };
  
  var enhancements = this.config.enhancement,
      enhancement = data.enhancement,
      subtype = data.subtype,
      sound = enhancements[enhancement][subtype].sound,
      volume = sound.volume,
      player = this.player,
      manager = this.shipManager,
      ship = this.ships[data.uuid],
      distance = 0.1,
      num = Math.floor((Math.random() * 3)+1);

  if(player && player !== ship) {   
    distance = engine.Point.distance(ship, player);    
    volume = global.Math.max(1 - (distance / 2000), 0);
  };
  if(volume > 0){
      this.generateSound(sound.name, volume, sound.loop); 
  };
};

SoundManager.prototype.generateExplosionSound = function(data){
  var explosionsArray = ['explosion2','explosion3','explosion4','explosion5','explosion6'],
      bigExplosionsArray = ['capitalShipExplosion','capitalShipExplosion2','capitalShipExplosion3'],
      player = this.player,
      ship = data,
      volume = 0.3,
      bigExplosion = bigExplosionsArray[Math.floor(Math.random() * bigExplosionsArray.length)],
      smallExplosion = explosionsArray[Math.floor(Math.random() * explosionsArray.length)],
      num = Math.floor((Math.random() * 2)+1),
      sound, distance;
      
  if(player && player === ship){
    sound = bigExplosion;
  };
  if(player && player !== ship) {   
    distance = engine.Point.distance(ship, player);    
    volume = global.Math.max(1 - (distance / 5000), 0);
    if(data.data.size > 127) {
      sound = bigExplosion
      if(volume >.5){volume = .5}
      if(volume>.1){console.log(sound, volume)}
      // if(sound === 'capitalShipExplosion2'){
      //   volume = global.Math.max(1.8 - (distance / 5000), 0);
      // };
      
    
    } else {sound = smallExplosion};
    if(data.data.chassis === 'scavengers-x04d'){
      sound = 'queenDeath';
    };
    if(data.data.chassis === 'scavengers-x03c'){
      sound = 'overseerDeath';
      volume = global.Math.max(0.85 - (distance / 5000), 0);
    };
    if(data.data.chassis === 'scavengers-x02' || data.data.chassis === 'scavengers-x01'){
      sound = 'harvesterDeath' + num;
      volume = global.Math.max(0.7 - (distance / 5000), 0);
    };
  }; 
  if(volume > 0){
    // if(sound === 'harvesterDeath1' || sound === 'harvesterDeath2'){
    // console.log(sound, volume)
    // }
    this.generateSound(sound, volume, false);
  };
};

SoundManager.prototype.generateFireSound = function(data) {
  var actives = data.actives,
      loop = false,
      player = this.player,
      manager = this.shipManager, ship = data.ship,
      num = Math.floor((Math.random() * 5)+1), 
      key, volume;
  for(var i = 0; i<actives.length; i++){
    if(actives[i].data.sound){
      var key = actives[i].data.sound;
      if(actives[i].data.subtype === 'harvester'){
       var key = 'harvesterBeam'+num;
      }
      volume = actives[i].data.default_volume;
    };
    if(player && ship !== player){   
      distance = engine.Point.distance(ship, player);    
      volume = global.Math.max(volume - (distance / 10000), 0);
      if(actives[0].data.subtype === 'disintegrator'){
        volume = global.Math.max(volume - (distance / 45000), 0)
      }
    }; 
  };
  if(key && data.spawn > 0 && volume > 0){
    // if(actives[0].data.subtype === 'disintegrator'){
    //   console.log('key is ', key, 'vol is ', volume)
    // }
    this.game.clock.events.create(global.Math.random() * 200, false, actives.length, function(key,volume,loop){
      var sound = this.generateSound(key, volume, loop);
    }, this, [key, volume, loop])
  };
};

SoundManager.prototype.stopFireSound = function(launcher){
};

SoundManager.prototype.generateSquadEngageSound = function(){
  
  var sound = 'callbackSound',
      volume = 0.5,
      num = Math.floor((Math.random() * 3)+1);

  // if(player && player !== ship) {   
  //   distance = engine.Point.distance(ship, player);    
  //   volume = global.Math.max(1 - (distance / 2000), 0);
  // };
  if(volume > 0){
      // this.generateSound(sound, volume, false); 
  };
};

// SoundManager.prototype.generateAttackSound = function(data){
//   var manager = this.game.sound,
//       player = this.player,
//       camera = this.game.camera,
//       cache = this.game.cache,
//       ship = data.ship,
//       hardpoints = ship.details.hardpoints,
//       hardpoint = hardpoints[data.slot],
//       distance, loop,volume, sound;

//       hardpoint.sound === 'capitalBeam' ? loop = false : loop = false;

//   if(player && player !== ship) {   
//     distance = engine.Point.distance(ship, player);    
//     volume = global.Math.max(1 - (distance / 3000), 0);
//   } else {
//     volume = 0.3;
//     if(hardpoint.sound === 'grenlin_pulse'){
//       volume = 0.2;
//     }
//     if(hardpoint.sound === 'bazuko_pulse'){
//       volume = 0.2;
//     }
//   };
//   this.game.clock.events.create(data.sound.runtime*global.Math.random(), false, hardpoint.spawn, function(key,volume,loop){
//     var sound = this.generateSound(key, volume, loop);
//     if(sound && hardpoint.sound === 'capitalBeam'){
//       this.sounds[data.ship.uuid] = sound
//     }
//   }, this, [hardpoint.sound, volume, loop])


// };

SoundManager.prototype.generateSpawnSound = function(data){
  console.log('Playing ', data, 'spawn sound')
  this.generateSound(data, 0.2, false);
  this.game.camera.shake(5000);
};

SoundManager.prototype.generateSound = function(key, volume, loop = false){
  return this.game.sound.play(key, volume, loop);
};

SoundManager.prototype.stopSoundLoop = function(data){
  // console.log(this.sounds[data.ship.uuid])
  // this.game.sound.stop(sound)
  // var pauseThis = this.sounds[data.ship.uuid],
  //     loopArr = this.isLooping;
  // for(var i = 0; i<loopArr.length; i++){
  //   if (loopArr.indexOf(sound)){
  //     console.log('it exists')
  //   }
  // }
  // console.log(this.sounds[data.ship.uuid], 'stop!')
  // this.sounds[data.ship.uuid].loop = false;
  // this.sounds[data.ship.uuid].destroy();
  // this.game.soundToPause.pause();
};


SoundManager.prototype.play = function(){
  pulseArr[0].play('', 0, volume, false)
}
SoundManager.prototype.generateDamageCriticalSound = function() {
  this.generateSound('dangerAlert', 0.5, false);
};

SoundManager.prototype._player = function(ship){
  this.player = ship;
};

SoundManager.prototype.shutdown = function() {
  //.. properly destroy
};

module.exports = SoundManager;