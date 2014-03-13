appModule.factory("DataService", function($q){
  var apps = [
    {
      id: 1,
      title: "Example App",
      forms: [{"fields":[{"title":"String Field","type":"string"},{"title":"Number Field","type":"number"},{"title":"Date Field","type":"date"},{"title":"Boolean Field","type":"boolean"},{"title":"Radio Options Field","type":"options","options":"First Option\nSecond Option\nThird Option","optionType":"radio"},{"title":"Checkbox Options Field","type":"options","options":"First Option\nSecond Option\nThird Option","optionType":"checkbox"},{"title":"Select Options Field","type":"options","options":"First Option\nSecond Option\nThird Option","optionType":"select"},{"title":"Multi-Select Options Field","type":"options","options":"First Option\nSecond Option\nThird Option","optionType":"multi-select"}],"name":"Example Form","id":1}],
      listings: [{"fields":{"String Field":true,"Number Field":true,"Date Field":true,"Boolean Field":true,"Radio Options Field":true,"Checkbox Options Field":true,"Select Options Field":false,"Multi-Select Options Field":false},"name":"Example Listing","formId":1,"linkToUpdateForm":"useField","fieldLinkingToUpdateForm":"String Field","id":1}],
      navLinks: [{"text":"Examples","type":"dropdown","id":1},{"text":"Example Form","type":"link","linkTarget":{"name":"Example Form","id":1,"type":"Forms"},"parentId":1,"id":2},{"text":"Example Listing","type":"link","linkTarget":{"name":"Example Listing","id":1,"type":"Listings"},"parentId":1,"id":3}, {"text":"Example Form","type":"link","linkTarget":{"name":"Example Form","id":1,"type":"Forms"},"id":4},{"text":"Example Listing","type":"link","linkTarget":{"name":"Example Listing","id":1,"type":"Listings"},"id":5}]
    }
  ];

  function promise(result){
    var deferred = $q.defer();

    deferred.resolve(result);

    return deferred.promise;
  }

  return {
    getApps: function(){
      return promise(apps);
    },
    getAppById: function(id){
      var matchingApps = apps.filter(function(app) { return app.id === id; });

      var app = angular.copy(matchingApps[0]);

      var deferred = $q.defer();

      deferred.resolve(angular.copy(app));

      return deferred.promise;
    },
    getAppByTitle: function(title){
      var matchingApps = apps.filter(function(app) { return app.title === title; });

      var deferred = $q.defer();

      deferred.resolve(matchingApps[0]);

      return deferred.promise;
    },
    createApp: function(app) {
      app.forms = [];
      app.listings = [];
      app.navLinks = [];

      app.id = (apps[apps.length - 1] || {id : 0}).id + 1;

      apps.push(app);

      return promise(app.id);
    },
    saveForm: function(appId, form){
      var matchingApp = apps.filter(function(app) { return app.id === appId; })[0];

      if(!form.id) {
        form.id = (matchingApp.forms[matchingApp.forms.length - 1] || {id : 0}).id + 1;
        matchingApp.forms.push(form);
      }
      else {
        var oldForm = matchingApp.forms.filter(function(form) { return form.id === form.id; })[0];

        var index = matchingApp.forms.indexOf(oldForm);

        matchingApp.forms[index] = form;
      }

      return promise();
    },
    saveListing: function(appId, listing){
      var matchingApp = apps.filter(function(app) { return app.id === appId; })[0];

      if(!listing.id) {
        listing.id = (matchingApp.listings[matchingApp.listings.length - 1] || {id : 0}).id + 1;
        matchingApp.listings.push(listing);
      }
      else {
        this.getListing(appId, listing.id).then(function(oldListing){
          var index = matchingApp.listings.indexOf(oldListing)
          matchingApp.listings[index] = listing;
        });
      }

      return promise();
    },
    getForm: function(appId, formId){
      return this.getAppById(appId).then(function(app){
        var form = app.forms.filter(function(form) { return form.id === formId; })[0];

        return promise(form);
      });
    },
    getListing: function(appId, listingId){
      return this.getAppById(appId).then(function(app){
        var listing = app.listings.filter(function(listing) { return listing.id === listingId; })[0];

        return promise(listing);
      });
    },
    getNavLinks: function(appId, navLinkId){
      var app = apps.filter(function(navLink) { return navLink.id === appId; })[0];

      var topLevelNavLinks = app.navLinks.filter(function(navLink){ return !navLink.parentId; });

      topLevelNavLinks.forEach(function(navLink){
        navLink.children = app.navLinks.filter(function(nL){ return nL.parentId === navLink.id; });
      });

      return promise(topLevelNavLinks);
    },
    saveNavLink: function(appId, navLink) {
      navLink = angular.copy(navLink);
      var matchingApp = apps.filter(function(app) { return app.id === appId; })[0];

      if(!navLink.id) {
        navLink.id = (matchingApp.navLinks[matchingApp.navLinks.length - 1] || {id : 0}).id + 1;

        matchingApp.navLinks.push(navLink);
      }
      else {
        var oldNavLink = matchingApp.navLinks.filter(function(nL) { return nL.id === navLink.id; })[0];

        var index = matchingApp.navLinks.indexOf(oldNavLink);

        matchingApp.navLinks[index] = navLink;
      }

      return promise(navLink.id);
    }
  };
});