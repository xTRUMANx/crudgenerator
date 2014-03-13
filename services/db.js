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
  var app = apps.filter(function(app) { return app.id === id; })[0];

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
