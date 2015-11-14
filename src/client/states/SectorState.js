var engine = require('engine'),
    Background = require('../fx/Background'), // this should draw from objects/sector
    Planet = require('../fx/Planet'), // this should draw from /objects/sector/planet
    ShipManager = require('../objects/sector/ShipManager'),
    Share = require('../utils/Share'); // this should be moved to StateManager?
    
function SectorState() {}

SectorState.prototype = Object.create(engine.State.prototype);
SectorState.prototype.constructor = engine.State;

SectorState.prototype.init = function(args) {
  global.state = this;

  this.ships = [];
  
  this.scrollVelocityX = 0;
  this.scrollVelocityY = 0;

  this.scrollLock = false;
};

SectorState.prototype.preload = function() {
  var load = this.game.load;

  // load background
  load.image('space', 'imgs/game/space/sector-a.jpg');

  // load.image('draghe', 'imgs/game/planets/draghe.jpg');
  // load.image('eamon', 'imgs/game/planets/eamon-alpha.jpg');
  load.image('eamon', 'imgs/game/planets/ichor.jpg');
  load.image('clouds', 'imgs/game/planets/clouds.jpg');

  load.image('vessel-x01', 'imgs/game/ships/vessel-x01.png');
  load.image('vessel-x02', 'imgs/game/ships/vessel-x02.png');
  load.image('vessel-x03', 'imgs/game/ships/vessel-x03.png');
  load.image('vessel-x04', 'imgs/game/ships/vessel-x04.png');
  load.image('vessel-x05', 'imgs/game/ships/vessel-x05.png');
  load.image('vessel-x01-shields', 'imgs/game/ships/vessel-x01-shields.jpg');

  load.image('engine-glow', 'imgs/game/fx/engine-glow.png');
  // load.image('engine-smoke', 'imgs/game/fx/engine-smoke.png');
  // load.image('laser-red', 'imgs/game/fx/laser-red.png');
  // load.image('laser-blue', 'imgs/game/fx/laser-blue.png');
  // load.image('explosion-a', 'imgs/game/fx/explosion-a.png');
  // load.image('explosion-b', 'imgs/game/fx/explosion-b.png');
  // load.image('explosion-c', 'imgs/game/fx/explosion-c.png');
  // load.image('explosion-d', 'imgs/game/fx/explosion-d.png');
  // load.image('explosion-flash', 'imgs/game/fx/explosion-flash.png');
  // load.image('damage-a', 'imgs/game/fx/damage-a.png');

  load.image('laser-a', 'imgs/game/turrets/laser-a.png');

  load.json('ship-configuration', 'data/ship-configuration.json');

  // load.image('station-mining', 'imgs/game/stations/station-mining.png');

  // test load sound
  load.audio('background', 'imgs/game/sounds/mood.mp3');
  // load.audio('computer', 'imgs/game/sounds/computer-1.m4a');

  // load tilemap
  load.image('sector', 'imgs/game/tilesets/sector.png');
  load.tilemap('sector', 'data/sector.json');
};

// loadUpdate = function() {};
// loadRender = function() {};

SectorState.prototype.create = function() {
  var sensitivity = 1000,
      game = this.game,
      mouse = game.input.mouse;
      mouse.capture = true;
      mouse.mouseWheelCallback = function(event) {
        var delta = event.deltaY / sensitivity,
            scale = engine.Math.clamp(this.world.scale.x - delta, 0.5, 1.2),
            gridLayer = global.state.gridLayer;

        this.world.scale.set(scale, scale);
        
        // show/hide sector grid
        if(scale >= 1.0) {
          gridLayer.visible = true;
        } else {
          gridLayer.visible = false;
        }
      };

  // store gui reference
  this.gui = game.state.getBackgroundState('gui');

  game.world.setBounds(0, 0, 4096, 4096);
  game.world.scale.set(0.5, 0.5);

  game.camera.bounds = null;
  game.camera.focusOnXY(2048, 2048);

  //.. tilemap test
  this.grid = new engine.Tilemap(game, 'sector');
  this.grid.addTilesetImage('sector');
  this.gridLayer = this.grid.createLayer('grid', game.width, game.height);
  this.gridLayer.visible = false;
  //..

  // create sector
  this.createSector();
  // this.createStations();
  this.createShips();

  //.. test culling
  // this.ship = new engine.Sprite(game, 'vessel-x02');
  // this.ship.position.set(2048, 2048);
  // this.ship.pivot.set(128, 128);
  // this.ship.autoCull = true;
  // this.ship.rotation = global.Math.PI;
  // game.world.add(this.ship);

  //.. ship test
  // this.shipTilemap = new engine.Tilemap(game, 'ship');
  // this.shipTilemap.addTilesetImage('deck');
  // this.shipTilemap.addTilesetImage('wall');
  // this.shipTilemapLayer = this.shipTilemap.createSprite('deck');
  //..

  // AUDIO TEST
  this.sound = game.sound.add('background', 0.5, true);
  // this.computer = game.sound.add('computer', 0.5);
  
  this.sound.onDecoded = function() {
    this.fadeIn(12000, true);
  };

  // this.computer.onDecoded = function() {
  //   var self = this;
  //   setTimeout(function() {
  //     self.play();
  //   }, 2000);
  // }

  // start zoom in
  var zoom = game.tweens.create(game.world.scale);
      zoom.to({x: 1.0, y: 1.0}, 8000, engine.Easing.Quadratic.InOut, true);
      zoom.on('complete', function() {
        this.gridLayer.visible = true;

        // share buttons
        // this.share = new Share();
      }, this);

  // show gui
  this.gui && this.gui.toggle(true);
};

SectorState.prototype.createSector = function() {
  var game = this.game;

  this.background = new Background(game, game.width, game.height);
  
  self.planet = new Planet(game, 'eamon');
  self.planet.position.set(0, 0);
  
  game.world.background.add(self.planet);

  game.stage.addChildAt(this.background, 0);
};

SectorState.prototype.createShips = function() {
  // networking and ship movement
  this.shipManager = new ShipManager(this.game);
  // this.shipManager.createShips();
  // this.shipManager.startAI();
};

SectorState.prototype.createStations = function() {
  var game = this.game;

  this.station1 = new engine.Sprite(game, 'station-mining');
  this.station1.pivot.set(256, 256);
  this.station1.position.set(2048 + 256, 2048);

  // game.world.add(this.station1);
  game.world.foreground.add(this.station1);
};

SectorState.prototype.update = function() {
  var game = this.game,
      camera = game.camera,
      keyboard = game.input.keyboard,
      // fix this :(
      // timeStep = this.game.clock.elapsedMS / 1000,
      move = 1.04;// * timeStep;

  if(this.scrollLock) { return; }

  // add velocity on keypress
  if(keyboard.isDown(engine.Keyboard.A) || keyboard.isDown(engine.Keyboard.LEFT)) {
    this.scrollVelocityX += move;
  }
  if(keyboard.isDown(engine.Keyboard.D) || keyboard.isDown(engine.Keyboard.RIGHT)) {
    this.scrollVelocityX -= move;
  }
  if(keyboard.isDown(engine.Keyboard.W) || keyboard.isDown(engine.Keyboard.UP)) {
    this.scrollVelocityY += move;
  }
  if(keyboard.isDown(engine.Keyboard.S) || keyboard.isDown(engine.Keyboard.DOWN)) {
    this.scrollVelocityY -= move;
  }

  // apply velocity
  camera.view.x -= this.scrollVelocityX;
  camera.view.y -= this.scrollVelocityY;
  
  // apply friction
  if(this.scrollVelocityX > 0 || this.scrollVelocityX < 0) {
    this.scrollVelocityX /= 1.1;
  }
  if(this.scrollVelocityX > -0.05 && this.scrollVelocityX < 0.05) {
    this.scrollVelocityX = 0;
  }
  if(this.scrollVelocityY > 0 || this.scrollVelocityY < 0) {
    this.scrollVelocityY /= 1.1;
  }
  if(this.scrollVelocityY > -0.05 && this.scrollVelocityY < 0.05) {
    this.scrollVelocityY = 0;
  }
};

// preRender = function() {};

// render = function() {};

SectorState.prototype.resize = function(width, height) {
  if(this.background !== undefined && this.gridLayer !== undefined) {
    this.background.resize(width, height);
    this.gridLayer.resize(width, height);
  }
};

// paused = function() {};

// resumed = function() {};

// pauseUpdate = function() {};

SectorState.prototype.shutdown = function() {
  this.stage.removeChild(this.background);
  this.background.destroy();
};

module.exports = SectorState;