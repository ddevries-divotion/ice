(function () {
  var exports = this;

  var IcePlugin = function (ice_instance) {
    this._ice = ice_instance;
  };

  IcePlugin.prototype = {
    start: function () {},
    clicked: function () {
      return true;
    },
    mouseDown: function () {
      return true;
    },
    keyDown: function () {
      return true;
    },
    keyPress: function () {
      return true;
    },
    selectionChanged: function (_range) {},
    setEnabled: function (_enabled) {},
    setDisabled: function (_enabled) {},
    caretUpdated: function () {},
    nodeInserted: function (_node, _range) {},
    nodeCreated: function (_node, _options) {},
    caretPositioned: function () {},
    remove: function () {
      this._ice.removeKeyPressListener(this);
    },
    setSettings: function (_settings) {},
  };

  exports.IcePlugin = IcePlugin;
}).call(this.ice);
