////////////////////////////////////////
// This section related to app building/
////////////////////////////////////////

var apps = [
  {
    id: 1,
    title: "Example App",
    forms: [{"fields":[{"title":"String Field","type":"string"},{"title":"Number Field","type":"number"},{"title":"Date Field","type":"date"},{"title":"Boolean Field","type":"boolean"},{"title":"Radio Options Field","type":"options","options":"First Option\nSecond Option\nThird Option","optionType":"radio"},{"title":"Checkbox Options Field","type":"options","options":"First Option\nSecond Option\nThird Option","optionType":"checkbox"},{"title":"Select Options Field","type":"options","options":"First Option\nSecond Option\nThird Option","optionType":"select"},{"title":"Multi-Select Options Field","type":"options","options":"First Option\nSecond Option\nThird Option","optionType":"multi-select"}],"name":"Example Form","id":1}],
    listings: [{"fields":{"String Field":true,"Number Field":true,"Date Field":true,"Boolean Field":true,"Radio Options Field":true,"Checkbox Options Field":true,"Select Options Field":false,"Multi-Select Options Field":false},"name":"Example Listing","formId":1,"linkToUpdateForm":"useField","fieldLinkingToUpdateForm":"String Field","id":1}],
    navLinks: [{"text":"Examples","type":"dropdown","id":1},{"text":"Example Form","type":"link","linkTarget":{"name":"Example Form","id":1,"type":"Forms"},"parentId":1,"id":2},{"text":"Example Listing","type":"link","linkTarget":{"name":"Example Listing","id":1,"type":"Listings"},"parentId":1,"id":3}, {"text":"Example Form","type":"link","linkTarget":{"name":"Example Form","id":1,"type":"Forms"},"id":4},{"text":"Example Listing","type":"link","linkTarget":{"name":"Example Listing","id":1,"type":"Listings"},"id":5}]
  }
];

exports.getApps = function(cb){
  var appsSummary = apps.map(function(app){
    return {
      id: app.id,
      title: app.title,
      formsCount: app.forms.length,
      listingsCount: app.listings.length
    };
  });

  cb(appsSummary);
};

exports.getApp = function(id, cb){
  id = Number(id);

  var app = apps.filter(function(app) { return app.id === id; })[0];

  if(app){
    app.deployed = !!deployedApps[id];
  }

  cb(app);
};

exports.createApp = function(app, cb){
  app.forms = [];
  app.listings = [];
  app.navLinks = [];

  app.id = (apps[apps.length - 1] || {id : 0}).id + 1;

  apps.push(app);

  cb({ id: app.id });
};

exports.saveForm = function(appId, form, cb){
  appId = Number(appId);

  var matchingApp = apps.filter(function(app) { return app.id === appId; })[0];

  if(!form.id) {
    form.id = (matchingApp.forms[matchingApp.forms.length - 1] || {id : 0}).id + 1;
    matchingApp.forms.push(form);
  }
  else {
    var oldForm = matchingApp.forms.filter(function(f) { return f.id === form.id; })[0];

    var index = matchingApp.forms.indexOf(oldForm);

    matchingApp.forms[index] = form;
  }

  cb();
};

exports.saveListing = function(appId, listing, cb){
  appId = Number(appId);
  var matchingApp = apps.filter(function(app) { return app.id === appId; })[0];

  if(!listing.id) {
    listing.id = (matchingApp.listings[matchingApp.listings.length - 1] || {id : 0}).id + 1;
    matchingApp.listings.push(listing);
  }
  else {
    exports.getListing(appId, listing.id, function(oldListing){
      var index = matchingApp.listings.indexOf(oldListing);

      matchingApp.listings[index] = listing;
    });
  }

  cb();
};

exports.getForm = function(appId, formId, cb){
  exports.getApp(appId, function(app){
    if(app){
      formId = Number(formId);

      var form = app.forms.filter(function(form) { return form.id === formId; })[0];

      cb(form);
    }
    else {
      cb();
    }
  });
};

exports.getListing = function(appId, listingId, cb){
  exports.getApp(appId, function(app){
    if(app){
      listingId = Number(listingId);

      var listing = app.listings.filter(function(listing) { return listing.id === listingId; })[0];

      cb(listing);
    }
    else {
      cb();
    }
  });
};

exports.getNavLinks = function(appId, cb){
  exports.getApp(appId, function(app){
    var topLevelNavLinks = app.navLinks.filter(function(navLink){ return !navLink.parentId; });

    topLevelNavLinks.forEach(function(navLink){
      navLink.children = app.navLinks.filter(function(nL){ return nL.parentId === navLink.id; });
    });

    cb(topLevelNavLinks);
  });
};

exports.saveNavLink = function(appId, navLink, cb){
  exports.getApp(appId, function(app){
    if(!navLink.id) {
      navLink.id = (app.navLinks[app.navLinks.length - 1] || {id : 0}).id + 1;

      app.navLinks.push(navLink);
    }
    else {
      var oldNavLink = app.navLinks.filter(function(nL) { return nL.id === navLink.id; })[0];

      var index = app.navLinks.indexOf(oldNavLink);

      app.navLinks[index] = navLink;
    }

    cb({ id: navLink.id });
  });
};

/////////////////////////////////////////
// This section related to deployed apps/
/////////////////////////////////////////

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  deployedApps = {},
  data = {},
  appSchemas = {};

function generateSchemas(app){
  var schemas = {};

  app.forms.map(function(form){
    schemas[form.id] = generateSchema(form);
  });

  return schemas;
}

function generateSchema(form){
  var schema = {};

  form.fields.forEach(function(field){
    switch (field.type){
      case "string":
        schema[field.title] = { type: String };
        break;
      case "number":
        schema[field.title] = { type: Number };
        break;
      case "date":
        schema[field.title] = { type: Date };
        break;
      case "boolean":
        schema[field.title] = { type: Boolean };
        break;
      case "options":
        switch (field.optionType){
          case "radio":
            schema[field.title] = { type: String, required: "{PATH} is required." };
            break;
          case "select":
            schema[field.title] = { type: String };
            break;
          case "checkbox":
          case "multi-select":
            schema[field.title] = { type: [String] };
            break;
          default:
            throw new Error("Found unknown field optionType when generating schema.");
        }
        break;
      default:
        throw new Error("Found unknown field type when generating schema.");
    }
  });

  return mongoose.model(form.id.toString(), new Schema(schema), form.id.toString(), { cache: false });
}

exports.deployApp = function(app, cb){
  function copy(source, destination){
    var toString = Object.prototype.toString;

    function isArray(value) {
      return toString.apply(value) == '[object Array]';
    }

    function isDate(value){
      return toString.apply(value) == '[object Date]';
    }

    function isObject(value){return value != null && typeof value == 'object';}

    function isRegExp(value) {
      return toString.apply(value) == '[object RegExp]';
    }

    function isFunction(value){return typeof value == 'function';}

    function isArrayLike(obj) {
      if (obj == null) {
        return false;
      }

      var length = obj.length;

      if (obj.nodeType === 1 && length) {
        return true;
      }

      return isString(obj) || isArray(obj) || length === 0 ||
        typeof length === 'number' && length > 0 && (length - 1) in obj;
    }

    function isString(value){return typeof value == 'string';}

    function forEach(obj, iterator, context) {
      var key;
      if (obj) {
        if (isFunction(obj)){
          for (key in obj) {
            if (key != 'prototype' && key != 'length' && key != 'name' && obj.hasOwnProperty(key)) {
              iterator.call(context, obj[key], key);
            }
          }
        } else if (obj.forEach && obj.forEach !== forEach) {
          obj.forEach(iterator, context);
        } else if (isArrayLike(obj)) {
          for (key = 0; key < obj.length; key++)
            iterator.call(context, obj[key], key);
        } else {
          for (key in obj) {
            if (obj.hasOwnProperty(key)) {
              iterator.call(context, obj[key], key);
            }
          }
        }
      }
      return obj;
    }

    if (!destination) {
      destination = source;
      if (source) {
        if (isArray(source)) {
          destination = copy(source, []);
        } else if (isDate(source)) {
          destination = new Date(source.getTime());
        } else if (isRegExp(source)) {
          destination = new RegExp(source.source);
        } else if (isObject(source)) {
          destination = copy(source, {});
        }
      }
    } else {
      if (source === destination) throw Error("Can't copy! Source and destination are identical.");
      if (isArray(source)) {
        destination.length = 0;
        for ( var i = 0; i < source.length; i++) {
          destination.push(copy(source[i]));
        }
      } else {
        forEach(destination, function(value, key){
          delete destination[key];
        });
        for ( var key in source) {
          destination[key] = copy(source[key]);
        }
      }
    }
    return destination;
  }

  deployedApps[app.id] = copy(app);

  cb();
};

exports.getDeployedApp = function(id, cb){
  id = Number(id);

  var app = deployedApps[id];

  cb(app);
};

// TODO: Think about whether to move out of db.js into some caching service
exports.getFormSchema = function(appId, formId, cb){
  var schema = appSchemas[appId];

  if(!schema){
    exports.getApp(appId, function(app){
      var schemas = generateSchemas(app);

      appSchemas[app.id] = schemas;

      schema = schemas[formId];

      cb(schema);
    })
  }
  else{
    cb(schema[formId]);
  }
};

exports.saveFormData = function(appId, formId, formData, id, cb){
  data[formId] = data[formId] || [];

  var index = -1;

  if(id) {
    var row = data[formId].filter(function(r){
      return r.id === id;
    })[0];

    if(row){
      index = data[formId].indexOf(row);
    }
  }

  if(index === -1){
    data[formId].push(formData);
  }
  else{
    data[formId][index] = formData;
  }

  cb();
};

exports.getFormData = function(appId, formId, formDataId, cb){
  formId = Number(formId);

  var formData = data[formId] || [];

  if(formData.length && formDataId){
    formData = formData.filter(function(fD){
      return fD.id === formDataId;
    })[0];
  }

  cb(formData);
};
