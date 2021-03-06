var Const = require('../const'),
    DeviceButton = require('./DeviceButton'),
    Point = require('../geometry/Point'),
    Mouse = require('./Mouse');

function Pointer(game, id, mode) {
  this.game = game;
  this.id = id;
  
  this.type = Const.POINTER;
  this.exists = true;
  this.identifier = 0;

  this.pointerId = null;
  this.target = null;
  this.button = null;

  this.mode = mode || Pointer.MODE.CURSOR;

  this.leftButton = new DeviceButton(this, Pointer.LEFT_BUTTON);
  this.middleButton = new DeviceButton(this, Pointer.MIDDLE_BUTTON);
  this.rightButton = new DeviceButton(this, Pointer.RIGHT_BUTTON);
  this.backButton = new DeviceButton(this, Pointer.BACK_BUTTON);
  this.forwardButton = new DeviceButton(this, Pointer.FORWARD_BUTTON);
  this.eraserButton = new DeviceButton(this, Pointer.ERASER_BUTTON);

  this._holdSent = false;
  this._nextDrop = 0;
  this._stateReset = false;

  this.withinGame = false;

  this.clientX = -1;
  this.clientY = -1;

  this.pageX = -1;
  this.pageY = -1;
  this.screenX = -1;
  this.screenY = -1;

  this.rawMovementX = 0;
  this.rawMovementY = 0;
  this.movementX = 0;
  this.movementY = 0;

  this.x = -1;
  this.y = -1;

  this.isMouse = (id === 0);
  this.isDown = false;
  this.isUp = true;

  this.timeDown = 0;
  this.timeUp = 0;
  this.previousTapTime = 0;
  this.totalTouches = 0;
  this.msSinceLastClick = global.Number.MAX_VALUE;

  this.targetObject = null;
  this.active = false;
  this.dirty = false;

  this.position = new Point();
  this.positionDown = new Point();
  this.positionUp = new Point();
  // this.circle = new Circle(0, 0, 44);

  this._history = [];
  this._clickTrampolines = null;
  this._trampolineTargetObject = null;
};

Pointer.NO_BUTTON = 0;
Pointer.LEFT_BUTTON = 1;
Pointer.RIGHT_BUTTON = 2;
Pointer.MIDDLE_BUTTON = 4;
Pointer.BACK_BUTTON = 8;
Pointer.FORWARD_BUTTON = 16;
Pointer.ERASER_BUTTON = 32;

Pointer.MODE = {
  CURSOR: 1 << 0,
  CONTACT: 1 << 1
}

Pointer.prototype = {

  resetButtons: function() {
    this.isDown = false;
    this.isUp = true;

    if(this.isMouse) {
      this.leftButton.reset();
      this.middleButton.reset();
      this.rightButton.reset();
      this.backButton.reset();
      this.forwardButton.reset();
      this.eraserButton.reset();
    }
  },

  processButtonsDown: function(buttons, event) {
    // Note: These are bitwise checks, not booleans
    if(Pointer.LEFT_BUTTON & buttons) {
      this.leftButton.start(event);
    }
    if(Pointer.RIGHT_BUTTON & buttons) {
      this.rightButton.start(event);
    }
    if(Pointer.MIDDLE_BUTTON & buttons) {
      this.middleButton.start(event);
    }
    if(Pointer.BACK_BUTTON & buttons) {
      this.backButton.start(event);
    }
    if(Pointer.FORWARD_BUTTON & buttons) {
      this.forwardButton.start(event);
    }
    if(Pointer.ERASER_BUTTON & buttons) {
      this.eraserButton.start(event);
    }
  },

  processButtonsUp: function(button, event) {
    if(button === Mouse.LEFT_BUTTON) {
      this.leftButton.stop(event);
    }
    if(button === Mouse.RIGHT_BUTTON) {
      this.rightButton.stop(event);
    }
    if(button === Mouse.MIDDLE_BUTTON) {
      this.middleButton.stop(event);
    }
    if(button === Mouse.BACK_BUTTON) {
      this.backButton.stop(event);
    }
    if(button === Mouse.FORWARD_BUTTON) {
      this.forwardButton.stop(event);
    }
    if(button === 5) {
      this.eraserButton.stop(event);
    }
  },

  updateButtons: function(event) {
    this.button = event.button;
    var down = (event.type.toLowerCase().substr(-4) === 'down');

    if(event.buttons !== undefined) {
      if(down) {
        this.processButtonsDown(event.buttons, event);
      } else {
        this.processButtonsUp(event.button, event);
      }
    } else {
      //  No buttons property (like Safari on OSX when using a trackpad)
      if(down) {
        this.leftButton.start(event);
      } else {
        this.leftButton.stop(event);
        this.rightButton.stop(event);
      }
    }

    this.isUp = true;
    this.isDown = false;

    if(this.leftButton.isDown || this.rightButton.isDown ||
        this.middleButton.isDown || this.backButton.isDown ||
        this.forwardButton.isDown || this.eraserButton.isDown) {
      this.isUp = false;
      this.isDown = true;
    }
  },

  start: function(event) {
    if(event['pointerId']) {
      this.pointerId = event.pointerId;
    }

    this.identifier = event.identifier;
    this.target = event.target;

    if(this.isMouse) {
      this.updateButtons(event);
    } else {
      this.isDown = true;
      this.isUp = false;
    }

    this._history = [];
    this.active = true;
    this.withinGame = true;
    this.dirty = false;
    this._clickTrampolines = null;
    this._trampolineTargetObject = null;

    // Work out how long it has been since the last click
    this.msSinceLastClick = this.game.clock.time - this.timeDown;
    this.timeDown = this.game.clock.time;
    this._holdSent = false;

    // This sets the x/y and other local values
    this.move(event, true);

    // x and y are the old values here?
    this.positionDown.setTo(this.x, this.y);

    var input = this.game.input,
        Input = require('./Input');
    if(input.multiInputOverride === Input.MOUSE_OVERRIDES_TOUCH ||
        input.multiInputOverride === Input.MOUSE_TOUCH_COMBINE || (
        input.multiInputOverride === Input.TOUCH_OVERRIDES_MOUSE && input.totalActivePointers === 0)) {
      input.x = this.x;
      input.y = this.y;
      input.position.setTo(this.x, this.y);
      input.emit('onDown', this, event);
      input.resetSpeed(this.x, this.y);
    }

    this._stateReset = false;
    this.totalTouches++;

    if(this.targetObject !== null) {
      this.targetObject._touchedHandler(this);
    }

    return this;
  },

  update: function() {
    if(this.active) {
      var input = this.game.input;

      // Force a check?
      if(this.dirty) {
        if(input.interactiveItems.total > 0) {
          this.processInteractiveObjects(false);
        }
        this.dirty = false;
      }

      var Input = require('./Input');
      if(this._holdSent === false && this.duration >= input.holdRate) {
        if(input.multiInputOverride === Input.MOUSE_OVERRIDES_TOUCH ||
            input.multiInputOverride === Input.MOUSE_TOUCH_COMBINE || (
            input.multiInputOverride === Input.TOUCH_OVERRIDES_MOUSE && input.totalActivePointers === 0)) {
          input.emit('onHold', this);
        }
        this._holdSent = true;
      }

      // Update the droppings history
      if(input.recordPointerHistory && this.game.clock.time >= this._nextDrop) {
        this._nextDrop = this.game.clock.time + input.recordRate;

        this._history.push({
          x: this.position.x,
          y: this.position.y
        });

        if(this._history.length > input.recordLimit) {
          this._history.shift();
        }
      }
    }
  },

  move: function(event, fromClick) {
    var i, input = this.game.input;

    if(input.pollLocked) { return; }
    if(fromClick === undefined) { fromClick = false; }

    if(event.button !== undefined) {
      this.button = event.button;
    }

    if(fromClick && this.isMouse) {
      this.updateButtons(event);
    }

    this.clientX = event.clientX;
    this.clientY = event.clientY;

    this.pageX = event.pageX;
    this.pageY = event.pageY;

    this.screenX = event.screenX;
    this.screenY = event.screenY;

    if(this.isMouse && input.mouse.locked && !fromClick) {
      this.rawMovementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      this.rawMovementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

      this.movementX += this.rawMovementX;
      this.movementY += this.rawMovementY;
    }

    // TODO: reactivate once we have scale
    // this.x = (this.pageX - this.game.scale.offset.x) * input.scale.x;
    // this.y = (this.pageY - this.game.scale.offset.y) * input.scale.y;
    this.x = (this.pageX - 0) * input.scale.x;
    this.y = (this.pageY - 0) * input.scale.y;

    this.position.setTo(this.x, this.y);
    // this.circle.x = this.x;
    // this.circle.y = this.y;

    var Input = require('./Input');
    if(input.multiInputOverride === Input.MOUSE_OVERRIDES_TOUCH ||
        input.multiInputOverride === Input.MOUSE_TOUCH_COMBINE || (
        input.multiInputOverride === Input.TOUCH_OVERRIDES_MOUSE && input.totalActivePointers === 0)) {
      input.activePointer = this;
      input.x = this.x;
      input.y = this.y;
      input.position.setTo(input.x, input.y);
      // input.circle.x = input.x;
      // input.circle.y = input.y;
    }

    // TODO: reactivate once we have scale
    // this.withinGame = this.game.scale.bounds.contains(this.pageX, this.pageY);
    this.withinGame = true;

    // If the game is paused we don't process any target objects or callbacks
    if(this.game.paused) {
      return this;
    }

    i = input.moveCallbacks.length;
    while(i--) {
      input.moveCallbacks[i].callback.call(input.moveCallbacks[i].context, this, this.x, this.y, fromClick);
    }

    // Easy out if we're dragging something and it still exists
    if(this.targetObject !== null && this.targetObject.isDragged === true) {
      if(this.targetObject.update(this) === false) {
        this.targetObject = null;
      }
    } else if(input.interactiveItems.total > 0) {
      this.processInteractiveObjects(fromClick);
    }

    return this;
  },

  processInteractiveObjects: function(fromClick) {

    // Work out which object is on the top
    var highestRenderOrderID = global.Number.MAX_VALUE,
        highestInputPriorityID = -1,
        candidateTarget = null,
        input = this.game.input;

    // First pass gets all objects that the pointer is over that DON'T use pixelPerfect checks and get the highest ID
    // We know they'll be valid for input detection but not which is the top just yet

    var currentNode = input.interactiveItems.first;
    while(currentNode) {
      // Reset checked status
      currentNode.checked = false;

      if(currentNode.validForInput(highestInputPriorityID, highestRenderOrderID, false)) {
        // Flag it as checked so we don't re-scan it on the next phase
        currentNode.checked = true;

        if((fromClick && currentNode.checkPointerDown(this, true)) ||
            (!fromClick && currentNode.checkPointerOver(this, true))) {
          highestRenderOrderID = currentNode.sprite.renderOrderID;
          highestInputPriorityID = currentNode.priorityID;
          candidateTarget = currentNode;
        }
      }

      currentNode = input.interactiveItems.next;
    }

    // Then in the second sweep we process ONLY the pixel perfect ones that are checked and who have a higher ID
    // because if their ID is lower anyway then we can just automatically discount them
    // (A node that was previously checked did not request a pixel-perfect check.)
    var currentNode = input.interactiveItems.first;
    while(currentNode) {
      if(!currentNode.checked &&
        currentNode.validForInput(highestInputPriorityID, highestRenderOrderID, true)) {
        if((fromClick && currentNode.checkPointerDown(this, false)) ||
            (!fromClick && currentNode.checkPointerOver(this, false))) {
          highestRenderOrderID = currentNode.sprite.renderOrderID;
          highestInputPriorityID = currentNode.priorityID;
          candidateTarget = currentNode;
        }
      }

      currentNode = input.interactiveItems.next;
    }

    // Now we know the top-most item (if any) we can process it
    if(candidateTarget === null) {
      // The pointer isn't currently over anything, check if we've got a lingering previous target
      if(this.targetObject) {
        this.targetObject._pointerOutHandler(this);
        this.targetObject = null;
      }
    } else {
      if(this.targetObject === null) {
        // And now set the new one
        this.targetObject = candidateTarget;
        candidateTarget._pointerOverHandler(this);
      } else {
        // We've got a target from the last update
        if(this.targetObject === candidateTarget) {
          // Same target as before, so update it
          if(candidateTarget.update(this) === false) {
            this.targetObject = null;
          }
        } else {
          // The target has changed, so tell the old one we've left it
          this.targetObject._pointerOutHandler(this);

          // And now set the new one
          this.targetObject = candidateTarget;
          this.targetObject._pointerOverHandler(this);
        }
      }
    }

    return (this.targetObject !== null);
  },

  leave: function(event) {
    this.withinGame = false;
    this.move(event, false);
  },

  stop: function(event) {
    var game = this.game,
        input = game.input;

    if(this._stateReset && this.withinGame) {
      event.preventDefault();
      return;
    }

    this.timeUp = game.clock.time;

    var Input = require('./Input');
    if(input.multiInputOverride === Input.MOUSE_OVERRIDES_TOUCH ||
        input.multiInputOverride === Input.MOUSE_TOUCH_COMBINE || (
        input.multiInputOverride === Input.TOUCH_OVERRIDES_MOUSE && input.totalActivePointers === 0)) {
      input.emit('onUp', this, event);

      // Was it a tap?
      if(this.duration >= 0 && this.duration <= input.tapRate) {
        // Was it a double-tap?
        if(this.timeUp - this.previousTapTime < input.doubleTapRate) {
          // Yes, let's dispatch the signal then with the 2nd parameter set to true
          input.emit('onTap', this, true);
        } else {
          // Wasn't a double-tap, so dispatch a single tap signal
          input.emit('onTap', this, false);
        }
        this.previousTapTime = this.timeUp;
      }
    }

    if(this.isMouse) {
      this.updateButtons(event);
    } else {
      this.isDown = false;
      this.isUp = true;
    }

    // Mouse is always active
    if(this.id > 0) {
      this.active = false;
    }

    this.withinGame = game.scale.bounds.contains(event.pageX, event.pageY);;
    this.pointerId = null;
    this.identifier = null;
    
    this.positionUp.setTo(this.x, this.y);
    
    if(this.isMouse === false) {
      input.currentPointers--;
    }

    input.interactiveItems.callAll('_dropHandler', this);
    input.interactiveItems.callAll('_releasedHandler', this);

    if(this._clickTrampolines) {
      this._trampolineTargetObject = this.targetObject;
    }

    this.targetObject = null;

    return this;
  },

  justPressed: function(duration) {
    duration = duration || this.game.input.justPressedRate;
    return (this.isDown === true && (this.timeDown + duration) > this.game.clock.time);
  },

  justReleased: function(duration) {
    duration = duration || this.game.input.justReleasedRate;
    return (this.isUp && (this.timeUp + duration) > this.game.clock.time);
  },

  addClickTrampoline: function(name, callback, callbackContext, callbackArgs) {
    if(!this.isDown) { return; }

    var trampolines = (this._clickTrampolines = this._clickTrampolines || []);
    for(var i = 0; i < trampolines.length; i++) {
      if(trampolines[i].name === name) {
        trampolines.splice(i, 1);
        break;
      }
    }

    trampolines.push({
      name: name,
      targetObject: this.targetObject,
      callback: callback,
      callbackContext: callbackContext,
      callbackArgs: callbackArgs
    });
  },

  processClickTrampolines: function() {
    var trampoline, trampolines = this._clickTrampolines;

    if(!trampolines) { return; }
    
    for(var i = 0; i < trampolines.length; i++) {
      trampoline = trampolines[i];
      if(trampoline.targetObject === this._trampolineTargetObject) {
        trampoline.callback.apply(trampoline.callbackContext, trampoline.callbackArgs);
      }
    }

    this._clickTrampolines = null;
    this._trampolineTargetObject = null;
  },

  reset: function() {
    if(this.isMouse === false) {
      this.active = false;
    }

    this.pointerId = null;
    this.identifier = null;
    this.dirty = false;
    this.totalTouches = 0;
    this._holdSent = false;
    this._history.length = 0;
    this._stateReset = true;

    this.resetButtons();

    if(this.targetObject) {
      this.targetObject._releasedHandler(this);
    }

    this.targetObject = null;
  },

  resetMovement: function() {
    this.movementX = 0;
    this.movementY = 0;
  }

};

Pointer.prototype.constructor = Pointer;

Object.defineProperty(Pointer.prototype, 'duration', {
  get: function() {
    if(this.isUp) {
        return -1;
    }
    return this.game.clock.time - this.timeDown;
  }
});

Object.defineProperty(Pointer.prototype, 'worldX', {
  get: function() {
    return this.game.world.camera.x + this.x;
  }
});

Object.defineProperty(Pointer.prototype, 'worldY', {
  get: function() {
    return this.game.world.camera.y + this.y;
  }
});

module.exports = Pointer;
