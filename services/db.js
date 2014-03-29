var apps = [
  {
    id: 1,
    title: "Example App",
    forms: [{"fields":[{"title":"String Field","type":"text","required":true,"id":"1","order":1},{"title":"Number Field","type":"number","id":"2","order":2},{"title":"Date Field","type":"date","id":"3","order":3},{"title":"Boolean Field","type":"boolean","id":"4","order":4},{"title":"Radio Options Field","type":"options","options":"First Option\nSecond Option\nThird Option","optionType":"radio","id":"5","order":5},{"title":"Checkbox Options Field","type":"options","options":"First Option\nSecond Option\nThird Option","optionType":"checkbox","id":"6","order":6},{"title":"Select Options Field","type":"options","options":"First Option\nSecond Option\nThird Option","optionType":"select","id":"7","order":7},{"title":"Multi-Select Options Field","type":"options","options":"First Option\nSecond Option\nThird Option","optionType":"multi-select","id":"8","order":8}],requiresAuthentication:true,"title":"Example Form","id":1,"nextFieldId":9}],
    listings: [{"fields":{"1":true,"2":true,"3":true,"4":true,"5":true,"6":true,"7":false,"8":false},"title":"Example Listing","formId":1,"linkToUpdateForm":"useField","fieldLinkingToUpdateForm":"1","id":1,"order":[{"id":"1","order":1},{"id":"4","order":2},{"id":"2","order":3},{"id":"3","order":4},{"id":"5","order":5},{"id":"6","order":6}]}],
    navLinks: {
      links: [{"text":"Examples","type":"dropdown","id":1},{"text":"Example Form","type":"link","linkTarget":{"name":"Example Form","id":1,"type":"Forms"},"parentId":1,"id":2},{"text":"Example Listing","type":"link","linkTarget":{"name":"Example Listing","id":1,"type":"Listings"},"parentId":1,"id":3}, {"text":"Example Form","type":"link","linkTarget":{"name":"Example Form","id":1,"type":"Forms"},"id":4},{"text":"Example Listing","type":"link","linkTarget":{"name":"Example Listing","id":1,"type":"Listings"},"id":5}],
      showLinks: { login: true, registration: true }
    },
    users: [{id: "admin", password: "123"}],
    registration: { type: "open" }
  }
],
  deployedApps = {},
  data = {},
  appsUsers = {1: [{id: "admin", password: "123"}]};

//////////////////////////////////////////
// This section related to app building //
//////////////////////////////////////////

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

    app.usersCount = appsUsers[id].length;
  }

  cb(app);
};

exports.createApp = function(app, cb){
  app.forms = [];
  app.listings = [];
  app.navLinks = { links: [] };

  app.id = (apps[apps.length - 1] || {id : 0}).id + 1;

  apps.push(app);

  cb({ id: app.id });
};

exports.saveForm = function(appId, form, cb){
  appId = Number(appId);

  var matchingApp = apps.filter(function(app) { return app.id === appId; })[0];

  if(!form.id) {
    form.id = (matchingApp.forms[matchingApp.forms.length - 1] || {id : 0}).id + 1;

    form.nextFieldId = 1;

    form.fields.forEach(function(field){
      field.id = form.nextFieldId++ + '';
    });

    matchingApp.forms.push(form);
  }
  else {
    var oldForm = matchingApp.forms.filter(function(f) { return f.id === form.id; })[0];

    form.fields.forEach(function(field){
      if(!field.id || !oldForm.fields.filter(function(f){ return f.id === field.id; }).length) {
        field.id = oldForm.nextFieldId++ + '';
      }
    });

    form.nextFieldId = oldForm.nextFieldId;

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
    var topLevelNavLinks = app.navLinks.links.filter(function(navLink){ return !navLink.parentId; });

    topLevelNavLinks.forEach(function(navLink){
      navLink.children = app.navLinks.links.filter(function(nL){ return nL.parentId === navLink.id; });
    });

    cb(topLevelNavLinks);
  });
};

exports.saveNavLink = function(appId, navLink, cb){
  exports.getApp(appId, function(app){
    if(!navLink.id) {
      navLink.id = (app.navLinks.links[app.navLinks.links.length - 1] || {id : 0}).id + 1;

      app.navLinks.links.push(navLink);
    }
    else {
      var oldNavLink = app.navLinks.links.filter(function(nL) { return nL.id === navLink.id; })[0];

      var index = app.navLinks.links.indexOf(oldNavLink);

      app.navLinks.links[index] = navLink;
    }

    cb({ id: navLink.id });
  });
};

exports.saveUser = function(appId, user, cb){
  appId = Number(appId);

  appsUsers[appId].push(user);

  cb();
};

exports.getUsers = function(appId, cb){
  appId = Number(appId);

  cb(appsUsers[appId]);
};

exports.authenticateUser = function(appId, loginForm, cb){
  appId = Number(appId);

  var user = appsUsers[appId] && appsUsers[appId].filter(function(u){ return u.id.toLowerCase() === loginForm.id.toLowerCase(); })[0];

  var validLogin = user && user.password === loginForm.password;

  cb(validLogin);
};

exports.saveNavLinksShowLinks = function(appId, showLinks, cb){
  appId = Number(appId);

  var matchingApp = apps.filter(function(app) { return app.id === appId; })[0];

  matchingApp.navLinks.showLinks = showLinks;

  cb();
};

///////////////////////////////////////////
// This section related to deployed apps //
///////////////////////////////////////////

exports.deployApp = function(app, cb){
  var copy = require("../utils").copy;

  deployedApps[app.id] = copy(app);

  cb();
};

exports.getDeployedApp = function(id, cb){
  id = Number(id);

  var app = deployedApps[id];

  cb(app);
};

exports.getDeployedListing = function(appId, listingId, cb){
  //appId = Number(appId);
  listingId = Number(listingId);

  exports.getDeployedApp(appId, function(app){
    if(app){
      var listing = app.listings.filter(function(listing) { return listing.id === listingId; })[0];

      listing.order.sort(function(a,b){ return a.order > b.order});

      cb(listing);
    }
    else {
      cb();
    }
  });
};

exports.saveFormData = function(appId, formId, formData, id, cb){
  appId = Number(appId);
  formId = Number(formId);

  data[appId]  = data[appId] || { nextId: 1 };
  var appData = data[appId];
  appData[formId] = appData[formId] || [];

  var index = -1;

  if(id) {
    id = Number(id);

    var row = appData[formId].filter(function(r){
      return r.id === id;
    })[0];

    if(row){
      index = appData[formId].indexOf(row);

      formData.id = id;

      appData[formId][index] = formData;
    }
  }
  else{
    formData.id = appData.nextId++;
    appData[formId].push(formData);
  }

  cb();
};

exports.getFormData = function(appId, formId, formDataId, cb){
  appId = Number(appId);
  formId = Number(formId);

  var appData = data[appId] || {};

  var formData = appData[formId] || [];

  if(formData.length && formDataId){
    formDataId = Number(formDataId);

    formData = formData.filter(function(fD){
      return fD.id === formDataId;
    })[0];
  }

  cb(formData);
};

exports.saveRegistration = function(appId, registration, cb){
  appId = Number(appId);
  var matchingApp = apps.filter(function(app) { return app.id === appId; })[0];

  matchingApp.registration = registration;

  cb();
};
