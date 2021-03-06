(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = null;
    hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = window;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("application.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _menu = require("views/menu");

var _menu2 = _interopRequireDefault(_menu);

var _main = require("views/main");

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Router = Backbone.Router.extend({
    routes: {
        "doctype/:doctype": "onDoctype"
    },
    onDoctype: function onDoctype(doctype) {
        this.app.views.main.setDoctype(doctype);
        this.app.views.menu.select(doctype);
    }
});

var app = {
    initialize: function initialize() {
        this.views = {
            menu: new _menu2.default(),
            main: new _main2.default()
        };
        this.views.menu.$el.appendTo("#container");
        this.views.main.$el.appendTo("#container");
        this.router = new Router({
            app: this
        });
        this.router.app = this;
        Backbone.history.start();

        $("[formaction='drawer/toggle']").on("click", function () {
            var $aside = $("aside");
            var isExpanded = $aside.attr("aria-expanded") === "true" ? "false" : "true";
            $aside.attr("aria-expanded", isExpanded);
        });
    }
};

var router = new Router();

exports.default = app;
});

;require.register("initialize.js", function(exports, require, module) {
"use strict";

var _application = require("application");

var _application2 = _interopRequireDefault(_application);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.app = _application2.default;

$(function () {
  return _application2.default.initialize();
});
});

require.register("models/menu.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = Backbone.Collection.extend({
    model: Backbone.Model,
    fetch: function fetch() {
        var _this = this;

        return new Promise(function (resolve, reject) {
            window.cozysdk.queryView("doctypes", "getsums", { group: true }).then(function (result) {
                _this.reset(result);
                resolve(result);
            }).catch(function (err) {
                reject(err);
            });
        });
    }
});
});

require.register("views/main.js", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
function attrToString(attr) {
    if (!_(attr).isObject()) return attr;else {
        var result = '<ul>';
        for (var i in attr) {
            result += '<li>' + attrToString(attr[i]) + '</li>';
        }
        result += '</ul>';
        return result;
    }
}

exports.default = Backbone.View.extend({
    el: "[role='contentinfo']",
    collection: new Backbone.Collection(),
    initialize: function initialize() {
        this.listenTo(this.collection, "reset", this.render);
    },
    getCols: function getCols(json) {
        var result = [];
        if (json.length === 0 || Object.keys(json[0]) == 0) return false;
        for (var i in json[0]) {
            result.push({
                title: i,
                data: i,
                defaultContent: ""
            });
        }
        return result;
    },
    render: function render() {
        this.$el.html('<table></table>');
        var json = this.collection.toJSON();
        var columns = this.getCols(json);
        if (columns === false) {
            console.log("no column or no data at all");
            return this;
        }
        var config = {
            destroy: true,
            lengthChange: false,
            dom: '<"thead"Bfi>t',
            buttons: ['colvis'],
            scrollX: "100%",
            scrollY: "calc(100vh - 7em)",
            deferRender: true,
            scroller: true,
            data: json,
            columns: this.getCols(json)
        };
        this.$("table").DataTable(config);
        return this;
    },
    setDoctype: function setDoctype(doctype) {
        var _this = this;

        this.doctype = doctype;
        cozysdk.queryView(doctype.toLowerCase(), "all", {}, function (err, data) {
            if (err) return console.error(err, "error while fetching doctype");
            _this.collection.reset(data.map(function (record) {
                return record.value;
            }));
        });
    }
});
});

require.register("views/menu.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _menu = require("models/menu");

var _menu2 = _interopRequireDefault(_menu);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = Backbone.View.extend({
    el: "aside",
    collection: new _menu2.default(),
    initialize: function initialize() {
        this.collection.fetch().then(this.render.bind(this)).catch(function (err) {
            return console.error(err, "error while fetching menu collection");
        });
    },

    itemTemplate: _.template('<li><a class="<%= sclass %>" href="#doctype/<%= key %>"><%= key %> (<%= value %>)</a></li>'),
    render: function render() {
        var _this = this;

        var html = "<ul>";
        this.collection.forEach(function (model) {
            var json = model.toJSON();
            json.sclass = json.key === _this.selected ? "selected" : "";
            html += _this.itemTemplate(json);
        }, this);
        html += "</ul>";
        this.$el.empty().html(html);
        return this;
    },
    select: function select(doctype) {
        this.selected = doctype;
        this.$("a").removeClass("selected");
        this.$("a[href='#doctype/" + doctype + "']").addClass("selected");
    }
});
});

require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=app.js.map