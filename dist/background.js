// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"contextMenu.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.contextMenuIds = {
  progress: "context_menu_id_progress",
  start: "context_menu_id_check_health",
  cancel: "context_menu_id_cancel"
};

exports.initializeContextMenu = function () {
  chrome.contextMenus.create({
    id: exports.contextMenuIds.progress,
    title: "Waiting start...",
    contexts: ["page_action"],
    type: "normal",
    enabled: false
  });
  chrome.contextMenus.create({
    id: exports.contextMenuIds.start,
    title: "Start check health",
    contexts: ["page_action"]
  });
  chrome.contextMenus.create({
    id: exports.contextMenuIds.cancel,
    title: "Cancel",
    contexts: ["page_action"],
    type: "normal",
    enabled: false
  });
};

exports.updateContextMenu = function (state) {
  switch (state) {
    case "initial":
      chrome.contextMenus.update(exports.contextMenuIds.progress, {
        enabled: false
      });
      chrome.contextMenus.update(exports.contextMenuIds.start, {
        enabled: true
      });
      chrome.contextMenus.update(exports.contextMenuIds.cancel, {
        enabled: false
      });
      break;

    case "started":
      chrome.contextMenus.update(exports.contextMenuIds.progress, {
        enabled: false
      });
      chrome.contextMenus.update(exports.contextMenuIds.start, {
        enabled: false
      });
      chrome.contextMenus.update(exports.contextMenuIds.cancel, {
        enabled: true
      });
      break;

    case "finished":
      chrome.contextMenus.update(exports.contextMenuIds.progress, {
        enabled: false
      });
      chrome.contextMenus.update(exports.contextMenuIds.start, {
        enabled: false
      });
      chrome.contextMenus.update(exports.contextMenuIds.cancel, {
        enabled: true
      });
  }
};

exports.updateProgress = function (data) {
  chrome.contextMenus.update(exports.contextMenuIds.progress, {
    title: "Remaining ".concat(data.remaining, ", Total: ").concat(data.total)
  });
};
},{}],"background.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var contextMenu_1 = require("./contextMenu");

var processMessage = function processMessage(msg, sender, responseFn) {
  if (msg.type === "update_progress") {
    contextMenu_1.updateProgress(msg.data);

    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      responseFn(chrome.runtime.lastError);
    } else {
      responseFn();
    }
  } else if (msg.type === "change_icon_visibility") {
    if (msg.data.visible) {
      chrome.pageAction.show(sender.tab.id);
    } else {
      chrome.pageAction.hide(sender.tab.id);
    }
  } else if (msg.type === "finish_check") {
    contextMenu_1.updateContextMenu("finished");
  }
};

chrome.runtime.onInstalled.addListener(function () {
  contextMenu_1.initializeContextMenu();
});
chrome.runtime.onMessage.addListener(function (msg, sender, sendResp) {
  processMessage(msg, sender, sendResp);
  return true;
});
chrome.runtime.onSuspend.addListener(function () {
  return console.log("onSuspend");
});
chrome.contextMenus.onClicked.addListener(function (menu, tab) {
  if (!tab) {
    return;
  }

  if (menu.menuItemId === contextMenu_1.contextMenuIds.start) {
    var msg = {
      type: "start_check"
    };
    chrome.tabs.sendMessage(tab.id, msg, function () {
      return contextMenu_1.updateContextMenu("started");
    });
  } else if (menu.menuItemId === contextMenu_1.contextMenuIds.cancel) {
    var _msg = {
      type: "cancel_check"
    };
    chrome.tabs.sendMessage(tab.id, _msg, function () {
      return contextMenu_1.updateContextMenu("initial");
    });
  }
});
},{"./contextMenu":"contextMenu.ts"}]},{},["background.ts"], null)
//# sourceMappingURL=/background.js.map