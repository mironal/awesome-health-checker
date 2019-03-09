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
})({"options.ts":[function(require,module,exports) {
"use strict";

var inputValue = function inputValue() {
  var input = document.getElementById("github_token_input");

  if (!input || !(input instanceof HTMLInputElement)) {
    return;
  }

  return input.value;
};

var save = function save(github_access_token) {
  if (!chrome.storage) {
    return;
  }

  chrome.storage.sync.set({
    github_access_token: github_access_token
  }, function () {
    var label = document.getElementById("message_label");

    if (label) {
      label.textContent = "Saved! φ(•ᴗ•๑)";
      label.classList.remove("hide");
      setTimeout(function () {
        return label.classList.add("hide");
      }, 1000);
    }
  });
};

var restore = function restore() {
  if (!chrome.storage) {
    return;
  }

  chrome.storage.sync.get({
    github_access_token: ""
  }, function (items) {
    var input = document.getElementById("github_token_input");

    if (!input || !(input instanceof HTMLInputElement)) {
      return;
    }

    input.value = items.github_access_token;

    if (items.github_access_token.length > 0) {
      var label = document.getElementById("message_label");

      if (label) {
        label.textContent = "Restored φ(•ᴗ•๑)";
        label.classList.remove("hide");
        setTimeout(function () {
          return label.classList.add("hide");
        }, 1000);
      }

      var _deleteBtn = document.getElementById("delete_button");

      if (_deleteBtn && _deleteBtn instanceof HTMLButtonElement) {
        _deleteBtn.disabled = false;
      }
    }
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", restore);
} else {
  restore();
}

var button = document.getElementById("save_button");

if (button) {
  button.addEventListener("keyup", function () {
    var token = inputValue();

    if (token && token.length > 0) {
      save(token);
    }
  });
}

var deleteBtn = document.getElementById("delete_button");

if (deleteBtn) {
  deleteBtn.addEventListener("click", function () {
    if (confirm("Are you sure?")) {
      save("");
      var input = document.getElementById("github_token_input");

      if (input instanceof HTMLInputElement) {
        input.value = "";
      }
    }
  });
}
},{}]},{},["options.ts"], null)
//# sourceMappingURL=/options.js.map