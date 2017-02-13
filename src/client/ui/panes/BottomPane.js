
var engine = require('engine'),
    Layout = require('../Layout'),
    Pane = require('../components/Pane'),
    EnhancementPane = require('./EnhancementPane'),
    ProgressBar = require('../components/ProgressBar');

function BottomPane(game) {
  Pane.call(this, game, {
    constraint: Layout.BOTTOM,
    padding: [4],
    layout: {
      type: 'flow',
      ax: Layout.CENTER, 
      ay: Layout.BOTTOM,
      direction: Layout.VERTICAL, 
      gap: 4
    },
    healthBar: {
      width: 377,
      height: 6,
      progress: {
        color: 0xAAFF00,
        fillAlpha: 0.6,
        modifier: {
          left: 1.0,
          top: 1.0,
          width: 0.0,
          height: 1.0
        }
      },
      bg: {
        fillAlpha: 0.4,
        color: 0x000000
      }
    },
    energyBar: {
      width: 377,
      height: 6,
      progress: {
        color: 0xFFAA00,
        fillAlpha: 0.6,
        modifier: {
          left: 1.0,
          top: 1.0,
          width: 0.0,
          height: 1.0
        }
      },
      bg: {
        fillAlpha: 0.4,
        color: 0x000000
      }
    }
  });

  this.enhancementPane = new EnhancementPane(game);
  this.healthBar = new ProgressBar(game, this.settings.healthBar);
  this.energyBar = new ProgressBar(game, this.settings.energyBar);
  
  this.addPanel(this.enhancementPane);
  this.addPanel(this.energyBar);
  this.addPanel(this.healthBar);

  this.game.on('ship/player', this._player, this);
};

BottomPane.prototype = Object.create(Pane.prototype);
BottomPane.prototype.constructor = BottomPane;

BottomPane.prototype._player = function(ship) {
  var stats = ship.config.stats,
      details = ship.details,
      game = this.game;

  this.ship = ship;

  this.data && this.data.removeListener('data', this._update, this);
  this.data = ship.details;
  this.data.on('data', this._update, this);

  this.healthBar.change(global.Math.min(1.0, details.health / stats.health));
  this.energyBar.change(global.Math.min(1.0, details.energy / stats.energy));

  this._update(this.data);
};

BottomPane.prototype._update = function(data) {
  var stats = this.ship.config.stats,
      healthBar = this.healthBar,
      energyBar = this.energyBar;

  data.health && healthBar.change('width', global.Math.min(1.0, data.health / stats.health));
  data.energy && energyBar.change('width', global.Math.min(1.0, data.energy / stats.energy));
};

// BottomPane.prototype._enabled = function(data) {
//   if(this.data && data.uuid === this.data.uuid) {
//     this.healthBar.setProgressBar(1);
//     this.energyBar.setProgressBar(1);
//   }
// };

// BottomPane.prototype._disabled = function(data) {
//   if(this.data && data.uuid === this.data.uuid) {
//     this.healthBar.setProgressBar(0);
//     this.energyBar.setProgressBar(0);
//   }
// };

module.exports = BottomPane;
