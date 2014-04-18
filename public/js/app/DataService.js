appModule.factory("DataService", ["$q", "$http", "apiRootUrl", function($q, $http, apiRootUrl){
  function promise(cb){
    var deferred = $q.defer();

    cb(deferred);

    return deferred.promise;
  }

  return {
    authenticate: function(credentials){
      return promise(function(deferred){
        $http.post(apiRootUrl + "login", credentials).
          success(function(res){
            deferred.resolve(res);
          }).
          error(function(data){
            deferred.reject(data);
          });
      });
    },
    whoami: function(){
      return promise(function(deferred){
        $http.get(apiRootUrl + "whoami").
          success(function(res){
            deferred.resolve(res.username);
          }).
          error(function(data){
            deferred.reject(data);
          });
      });
    },
    getApps: function(){
      return promise(function(deferred){
        $http.get(apiRootUrl + "apps").
          success(function(apps){
            deferred.resolve(apps);
          });
      });
    },
    getAppById: function(id){
      return promise(function(deferred){
        $http.get(apiRootUrl + "apps", { params: { id: id } }).
          success(function(app){
            deferred.resolve(app);
          });
      });
    },
    createApp: function(app) {
      return promise(function(deferred){
        $http.post(apiRootUrl + "apps", app).
          success(function(data){
            deferred.resolve(data.id);
          });
      });
    },
    saveForm: function(appId, form){
      return promise(function(deferred){
        $http.post(apiRootUrl + "forms", form, { params: { appId: appId }}).
          success(function(){
            deferred.resolve();
          });
      });
    },
    saveListing: function(appId, listing){
      return promise(function(deferred){
        $http.post(apiRootUrl + "listings", listing, { params: { appId: appId } }).
          success(function(){
            deferred.resolve();
          });
      });
    },
    getForm: function(appId, formId){
      return promise(function(deferred){
        $http.get(apiRootUrl + "forms", { params: { appId: appId, formId: formId } }).
          success(function(form){
            deferred.resolve(form);
          });
      });
    },
    getListing: function(appId, listingId){
      return promise(function(deferred){
        $http.get(apiRootUrl + "listings", { params: { appId: appId, listingId: listingId } }).
          success(function(listing){
            deferred.resolve(listing);
          });
      });
    },
    getNavLinks: function(appId){
      return promise(function(deferred){
        $http.get(apiRootUrl + "navLinks", { params: { appId: appId } }).
          success(function(navLinks){
            deferred.resolve(navLinks);
          });
      });
    },
    saveNavLink: function(appId, navLink) {
      return promise(function(deferred){
        $http.post(apiRootUrl + "navLinks", navLink, { params: { appId: appId } }).
        success(function(data){
          deferred.resolve(data.id);
        });
      });
    },
    createUser: function(appId, user){
      return promise(function(deferred){
        $http.post(apiRootUrl + "users", user, { params: { appId: appId } }).
          success(function(){
            deferred.resolve();
          });
      });
    },
    saveRegistration: function(appId, registration){
      return promise(function(deferred){
        $http.post(apiRootUrl + "registration", registration, { params: { appId: appId } }).
          success(function(){
            deferred.resolve();
          });
      });
    },
    saveShowLinks: function(appId, showLinks) {
      return promise(function(deferred){
        $http.post(apiRootUrl + "navLinksShowLinks", showLinks, { params: { appId: appId } }).
          success(function(){
            deferred.resolve();
          });
      });
    },
    getUsersByAppId: function(appId){
      return promise(function(deferred){
        $http.get(apiRootUrl + "users", { params: { appId: appId } }).
          success(function(users){
            deferred.resolve(users);
          });
      });
    }
  };
}]);
