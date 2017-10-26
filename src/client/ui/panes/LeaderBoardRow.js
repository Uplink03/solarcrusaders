var engine = require('engine' ),
    Layout = require('../Layout'),
    Pane = require('../components/Pane'),
    Label = require('../components/Label');

function LeaderBoardRow(game, settings) {
  Pane.call(this, game, {
    constraint: Layout.STRETCH,
    padding: [0],
    layout: {
      type: 'border',
      gap: [0, 0]
    },
    usernameLabel: {
      constraint: Layout.LEFT,
      width: 156,
      padding: [2],
      font: {
        name: 'full',
        tint: 0x66aaff
      }
    },
    scoreLabel: {
      constraint: Layout.RIGHT,
      padding: [2],
      font: {
        name: 'full',
        tint: 0xffffff
      }
    }
  });
};

LeaderBoardRow.MAXIMUM_USERS = 9;

LeaderBoardRow.prototype = Object.create(Pane.prototype);
LeaderBoardRow.prototype.constructor = LeaderBoardRow;

LeaderBoardRow.prototype.create = function() {
  var game = this.game,
      settings = this.settings;

  this.usernameLabel = new Label(game, settings.usernameLabel);
  this.scoreLabel = new Label(game, settings.scoreLabel);

  this.addPanel(this.usernameLabel);
  this.addPanel(this.scoreLabel);
};

LeaderBoardRow.prototype.refresh = function(username, score) {
  this.usernameLabel.text = username;
  this.scoreLabel.text = score;
};

module.exports = LeaderBoardRow;
