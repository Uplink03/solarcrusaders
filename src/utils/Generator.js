
var uuid = require('uuid'),
    syllables = {
      ubaidian: [
        'tu', 'nos', 'vos', 'is', 'ea', 'id', 'suus',
        'meus', 'ipse', 'a', 'um', 'pro', 'nam', 'nunc',
        'ita', 'ous', 'galle', 'nte'],
      general: [
        'ma', 'kima', 'mala', 'ma', 'su', 'lu', 'am',
        'ayu', 'minu', 'ghu', 'dru', 'innu', 'sag', 'ga', 'ka'],
      mechan: [
        'x', 'z', 'y', 'a', 'b', '18', '27',
        '34', '46', '55', '64', '73', '82', '91', '00']
    };

var Generator = {
  rfloor: function(value) {
    return global.Math.floor(global.Math.random() * value);
  },

  getGuest: function() {
    var ids = uuid.v4().split('-');
    return 'guest (' + ids[0] + ')';
  },

  getName: function(race) {
    var r, s, num = Generator.rfloor(3) + 2,
        parts = [];
    for(var i=0; i<num; i++) {
      s = syllables[race];
      r = Generator.rfloor(s.length);
      parts.push(s[r]);
    }
    switch(race) {
      case 'ubadian':
        if(parts.length >= 4) {
          parts.splice(2, 0, ' ');
        }
        break;
      case 'mechan':
        if(parts.length >= 3) {
          parts.splice(2, 0, '-');
        }
        break;
      default:
        parts.splice(1, 0, '\'');
        break;
    }
    return parts.join('');
  }
};

module.exports = Generator;
