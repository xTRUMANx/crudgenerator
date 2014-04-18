var appModule = angular.module("AppModule", ["ngRoute", "checklist-model"]);

appModule.constant("apiRootUrl", "/api/");

appModule.config(["$routeProvider", function($routeProvider){
  $routeProvider.when("/", {
    controller: "HomeCtrl",
    templateUrl: "partials/home.html"
  });

  $routeProvider.when("/apps", {
    controller: "AppsCtrl",
    templateUrl: "partials/apps.html"
  });

  $routeProvider.when("/apps/:appId", {
    controller: "AppCtrl",
    templateUrl: "partials/app.html"
  });

  $routeProvider.when("/apps/:appId/forms/create", {
    controller: "AppFormCreateCtrl",
    templateUrl: "partials/appFormCreate.html"
  });

  $routeProvider.when("/apps/:appId/forms/update/:formId", {
    controller: "AppFormCreateCtrl",
    templateUrl: "partials/appFormCreate.html"
  });

  $routeProvider.when("/apps/:appId/listings/create", {
    controller: "AppListingCreateCtrl",
    templateUrl: "partials/appListingCreate.html"
  });

  $routeProvider.when("/apps/:appId/listings/update/:listingId", {
    controller: "AppListingCreateCtrl",
    templateUrl: "partials/appListingCreate.html"
  });

  $routeProvider.when("/apps/:appId/navLinks/modify", {
    controller: "AppNavLinksModifyCtrl",
    templateUrl: "partials/appNavLinksModify.html"
  });

  $routeProvider.when("/apps/:appId/preview", {
    controller: "AppPreviewCtrl",
    templateUrl: "partials/appPreview.html"
  });

  $routeProvider.when("/apps/:appId/users/create", {
    controller: "AppUserCreateCtrl",
    templateUrl: "partials/appUserCreate.html"
  });

  $routeProvider.when("/apps/:appId/users", {
    controller: "AppUsersCtrl",
    templateUrl: "partials/appUsers.html"
  });

  $routeProvider.when("/apps/:appId/registration", {
    controller: "AppRegistrationCtrl",
    templateUrl: "partials/appRegistration.html"
  });
}]);

appModule.run(["$rootScope", "$location", "$http", "apiRootUrl", function($rootScope, $location, $http, apiRootUrl){
  $rootScope.waitMessages = [];

  $http.get(apiRootUrl + "deploymentSite").
    success(function(res){
      $rootScope.deploymentSite = res.deploymentSite;
    });

  $rootScope.addWaitMessage = function(key, message){
    $rootScope.waitMessages.push({key: key, text: message});
  };

  $rootScope.removeWaitMessage = function(key){
    $rootScope.waitMessages = $rootScope.waitMessages.filter(function(message){
      return message.key !== key;
    });
  };

  $rootScope.$on("$routeChangeStart", function(){
    if(!$rootScope.authenticated){
      $location.path("");
    }
  });

  $rootScope.logout = function(){
    $rootScope.authenticated = null;
    $rootScope.skipSessionCheck = true;
    $rootScope.loggingOut = true;

    $http.get(apiRootUrl + "logout").
      success(function(res){
      }).
      error(function(data){
      }).
      finally(function(){
        $rootScope.loggingOut = false;
      });
  };
}]);
appModule.controller("AppCtrl",
  [
    "$scope", "$routeParams", "DataService",
    function($scope, $routeParams, DataService){
      $scope.appId = $routeParams.appId;

      var waitMessageKey = "AppCtrl.getAppById";
      $scope.$root.addWaitMessage(waitMessageKey, "Getting app data");
      $scope.initializing = true;

      DataService.getAppById(Number($scope.appId)).
        then(function(app){
          $scope.app = app;
        }).
        finally(function(){
          $scope.$root.removeWaitMessage(waitMessageKey);
          $scope.initializing = false;
        });

      $scope.navLinksTree = function(){
        var topLevelNavLinks = $scope.app.navLinks.links.filter(function(navLink){ return !navLink.parentId; });

        topLevelNavLinks.forEach(function(navLink){
          navLink.children = $scope.app.navLinks.links.filter(function(nL){ return nL.parentId === navLink.id; });
        });

        return topLevelNavLinks;
      };
    }
  ]
);
appModule.controller("AppFormCreateCtrl",
  [
    "$scope", "$routeParams", "$location", "$q", "DataService",
    function($scope, $routeParams, $location, $q, DataService){
      $scope.appId = Number($routeParams.appId);

      var waitMessageKey = "AppFormCreateCtrl.getAppById";
      $scope.$root.addWaitMessage(waitMessageKey, "Getting app data");
      $scope.initializing = true;

      var promises = [];

      if($scope.formId = Number($routeParams.formId)) {
        // NOTE: Maybe just fetch the form from the app object?
        var getFormDeferred = $q.defer();

        promises.push(getFormDeferred.promise);

        var waitMessageKey2 = "AppFormCreateCtrl.getForm";
        $scope.$root.addWaitMessage(waitMessageKey2, "Getting form data");

        DataService.
          getForm($scope.appId, $scope.formId).
          then(function(form){
            $scope.form = form;
            $scope.selectedField = $scope.form.fields[0];
          }).
          finally(function(){
            $scope.$root.removeWaitMessage(waitMessageKey2);
            getFormDeferred.resolve();
          });
      }
      else {
        $scope.form = { fields: [] };

        $scope.selectedField = $scope.form.fields[0];
      }

      var getAppDeferred = $q.defer();

      promises.push(getAppDeferred.promise);

      DataService.getAppById($scope.appId).
        then(function(app){
          $scope.app = app;
        }).
        finally(function(){
          getAppDeferred.resolve();
          $scope.$root.removeWaitMessage(waitMessageKey);
        });

      $q.all(promises).then(function(){
        $scope.initializing = false;
      });

      $scope.types = ["text", "number", "date", "boolean", "options"];
      $scope.optionTypes = ["radio", "checkbox", "select", "multi-select"];

      $scope.$watch("selectedField.optionType", function(newValue){
        if(newValue === "radio") {
          $scope.selectedField.required = true;
        }
      });

      $scope.validateForm = function() {
        function hasUniqueTitles(fields) {
          var valid = true;

          for(var i = 0; i < fields.length; i++) {
            for(var j = 0; j < fields.length; j++) {
              if(i == j) continue;
              if(fields[i].title === fields[j].title) {
                $scope.duplicateTitle = fields[i].title;
                valid = false;
                break;
              }
            }
            if(!valid) break;
          }

          if(valid) {
            $scope.duplicateTitle = null;
          }

          return valid;
        }

        return $scope.form && $scope.form.title && $scope.form.fields.length && hasUniqueTitles($scope.form.fields) && $scope.form.fields.filter(function(field){
          return !!field.title && !!field.type && !(field.type === 'options' && !(field.optionType && field.options))
        }).length === $scope.form.fields.length;
      };

      $scope.save = function(form) {
        $scope.saving = true;

        DataService.saveForm($scope.appId, form).
          then(function(){
            $location.path("/apps/" + $scope.appId);
          }).
          finally(function(){
            $scope.saving = false;
          });
      };

      $scope.addField = function(){
        var field = { title: "New Field" };
        $scope.form.fields.push(field);
        field.order = $scope.form.fields.length;
        $scope.selectedField = field;
      };

      $scope.removeField = function(field){
        $scope.form.fields.splice($scope.form.fields.indexOf(field), 1);

        $scope.form.fields.
          filter(function(f){ return f.order > field.order; }).
          forEach(function(f){ f.order--; });
      };

      $scope.split = function(text){
        return text ? text.split("\n") : "";
      };

      $scope.moveFieldUp = function(field){
        if(field.order === 1) return;

        var nextFieldUp = $scope.form.fields.filter(function(f){ return f.order === field.order - 1})[0];

        nextFieldUp.order++;
        field.order--;
      };

      $scope.moveFieldDown = function(field){
        if(field.order === $scope.form.fields.length) return;

        var nextFieldDown = $scope.form.fields.filter(function(f){ return f.order === field.order + 1})[0];

        nextFieldDown.order--;
        field.order++;
      };

      $scope.orderedFormFields = function(){
        if(!$scope.form) return [];

        return $scope.form.fields.sort(function(a,b){ return a.order > b.order});
      };
    }
  ]
);
appModule.controller("AppListingCreateCtrl",
  [
    "$scope", "$routeParams", "$location", "$q", "DataService",
    function($scope, $routeParams, $location, $q, DataService){
      $scope.appId = Number($routeParams.appId);

      var waitMessageKey = "AppListingCreateCtrl.getAppById";
      $scope.$root.addWaitMessage(waitMessageKey, "Getting app data");
      $scope.initializing = true;

      var promises = [];

      if($scope.listingId = Number($routeParams.listingId)) {
        var getListingDeferred = $q.defer();

        promises.push(getListingDeferred.promise);

        var waitMessageKey2 = "AppFormCreateCtrl.getListing";
        $scope.$root.addWaitMessage(waitMessageKey2, "Getting listing data");

        DataService.
          getListing($scope.appId, $scope.listingId).
          then(function(listing){
            $scope.originalListing = listing;
            $scope.listing = listing;
          }).
          finally(function(){
            $scope.$root.removeWaitMessage(waitMessageKey2);
            getListingDeferred.resolve();
          });
      }
      else {
        $scope.listing = { fields: [] };
      }

      var getAppDeferred = $q.defer();

      promises.push(getAppDeferred.promise);

      DataService.getAppById($scope.appId).
        then(function(app){
          $scope.app = app;
        }).
        finally(function(){
          getAppDeferred.resolve();
          $scope.$root.removeWaitMessage(waitMessageKey);
        });

      $q.all(promises).then(function(){
        $scope.initializing = false;
      });

      $scope.formSelected = function(){
        if(!$scope.listing) return;

        if($scope.originalListing && $scope.listing.formId === $scope.originalListing.formId) {
          $scope.listing.fields = $scope.originalListing.fields;
        }
        else {
          var fields = {};

          $scope.selectedForm().fields.forEach(function(field){ fields[field.id] = false});

          $scope.listing.fields = fields;
        }
      };

      $scope.noSelectedFields = function(){
        if(!$scope.listing) return false;

        for(var key in $scope.listing.fields) {
          if($scope.listing.fields[key]) return false;
        }

        return true;
      };

      $scope.listingFields = function(){
        if(!$scope.listing) return [];

        var fieldIds = [];
        for(var key in $scope.listing.fields) {
          if($scope.listing.fields[key]) fieldIds.push(Number(key));
        }

        return $scope.selectedForm().fields.filter(function(field){ return fieldIds.indexOf(field.id) > -1});
      };

      $scope.orderedListingFields = function(){
        if(!$scope.listing) return [];

        var listingFields = $scope.listingFields();

        listingFields.forEach(function(field){
          field.order = $scope.orderedSelectedFields().filter(function(f){ return f.id === field.id; })[0].order;
        });

        return listingFields.sort(function(a,b){ return a.order > b.order; });
      };

      $scope.selectedForm = function(){
        return $scope.app.forms.filter(function(form){ return form.id === $scope.listing.formId; })[0];
      };

      $scope.selectedFields = function(){
        if(!$scope.listing) return [];

        var fieldIds = [];

        for(var key in $scope.listing.fields) {
          if($scope.listing.fields[key]) fieldIds.push(Number(key));
        }

        return fieldIds;
      };

      $scope.fieldTitle = function(id){
        return $scope.selectedForm().fields.filter(function(field){ return field.id === id})[0].title;
      };

      $scope.sampleValue = function(field){
        switch (field.type) {
          case "text": return "Sample Value";
          case "number": return 42;
          case "date": return new Date().toDateString();
          case "boolean": return "Yes";
          case "options": {
            if(["radio", "select"].indexOf(field.optionType) > -1) {
              return field.options.split("\n")[0];
            }
            else {
              return field.options.split("\n").join(", ");
            }
          }
          default : return "Unknown type: " + field.type;
        }
      };

      $scope.save = function(listing){
        $scope.saving = true;
        DataService.saveListing($scope.appId, listing).
          then(function(){
            $location.path("/apps/" + $scope.appId);
          }).
          finally(function(){
            $scope.saving = false;
          });
      };

      $scope.moveFieldUp = function(field){
        if(field.order === 1) return;

        var nextFieldUp = $scope.listing.order.filter(function(f){ return f.order === field.order - 1})[0];

        nextFieldUp.order++;
        field.order--;
      };

      $scope.moveFieldDown = function(field){
        if(field.order === $scope.listing.order.length) return;

        var nextFieldDown = $scope.listing.order.filter(function(f){ return f.order === field.order + 1})[0];

        nextFieldDown.order--;
        field.order++;
      };

      $scope.orderedSelectedFields = function(){
        if(!$scope.listing) return [];

        var selectedFields = $scope.selectedFields();

        if(!$scope.listing.order || !$scope.listing.order.length || $scope.listing.order.length !== selectedFields.length) {
          var order = 1;

          $scope.listing.order = selectedFields.map(function(id){ return {id: id, order: order++}});
        }

        var orderedSelectedFields =  $scope.listing.order.sort(function(a,b){ return a.order > b.order});

        if(!$scope.selectedField || orderedSelectedFields.indexOf($scope.selectedField) === -1) {
          $scope.selectedField = orderedSelectedFields[0];
        }

        return orderedSelectedFields;
      };
    }
  ]
);
appModule.controller("AppNavLinksModifyCtrl",
  [
    "$scope", "$routeParams", "$location", "DataService",
    function($scope, $routeParams, $location, DataService){
      $scope.appId = $routeParams.appId;
      $scope.navLink = {};

      var waitMessageKey = "AppFormCreateCtrl.getAppById";
      $scope.$root.addWaitMessage(waitMessageKey, "Getting app data");
      $scope.initializing = true;

      DataService.getAppById(Number($scope.appId)).
        then(function(app){
          $scope.app = app;

          function extractLinkTargetData(a, type){
            return a.map(function(f){return {title: f.title, id: f.id, type: type}});
          }

          $scope.linkTargets = extractLinkTargetData(app.forms, "Forms").
            concat(extractLinkTargetData(app.listings, "Listings"));
        }).
        finally(function(){
          $scope.$root.removeWaitMessage(waitMessageKey);
          $scope.initializing = false;
        });

      $scope.dropdownNavLinks = function(){
        return $scope.app.navLinks.links.filter(function(nL){ return nL.type === "dropdown"; });
      };

      $scope.navLinksTree = function(){
        if(!$scope.app) return [];

        var topLevelNavLinks = $scope.app.navLinks.links.filter(function(navLink){ return !navLink.parentId; });

        topLevelNavLinks.forEach(function(navLink){
          navLink.children = $scope.app.navLinks.links.filter(function(nL){ return nL.parentId === navLink.id; });
        });

        return topLevelNavLinks;
      };

      $scope.editNavLink = function(navLink){
        $scope.navLink = angular.copy(navLink);
      };

      $scope.removeParent = function(){
        $scope.navLink.parentId = null;
      };

      $scope.saveNavLink = function(){
        $scope.savingNavLink = true;
        var navLink = $scope.navLink;

        DataService.saveNavLink($scope.app.id, navLink).
          then(function(id){
            if(!navLink.id) {
              navLink.id = id;

              $scope.app.navLinks.links.push(navLink);
            }
            else {
              var oldNavLink = $scope.app.navLinks.links.filter(function(nL) { return nL.id === navLink.id; })[0];

              var index = $scope.app.navLinks.links.indexOf(oldNavLink);

              $scope.app.navLinks.links[index] = navLink;
            }

            $scope.navLink = {};
          }).
          finally(function(){
            $scope.savingNavLink = false;
          });
      };

      $scope.saveShowLinks = function(){
        $scope.savingShowLinks = true;

        DataService.saveShowLinks($scope.appId, $scope.app.navLinks.showLinks).
          finally(function(){
            $scope.savingShowLinks = false;
          });
      };
    }
  ]
);

appModule.controller("AppPreviewCtrl",
  [
    "$scope", "$routeParams", "$location", "DataService",
    function($scope, $routeParams, $location, DataService){
      $scope.appId = Number($routeParams.appId);

      var waitMessageKey = "AppFormCreateCtrl.getAppById";
      $scope.$root.addWaitMessage(waitMessageKey, "Getting app data");
      $scope.initializing = true;

      $scope.data = {};

      DataService.getAppById(Number($scope.appId)).
        then(function(app){
          $scope.app = app;

          function extractLinkTargetData(a, type){
            return a.map(function(f){return {name: f.name, id: f.id, type: type}});
          }

          $scope.linkTargets = extractLinkTargetData(app.forms, "Forms").
            concat(extractLinkTargetData(app.listings, "Listings"));
        }).
        finally(function(){
          $scope.$root.removeWaitMessage(waitMessageKey);

          $scope.initializing = false;
        });

      $scope.navLinksTree = function(){
        if(!$scope.app) return [];

        var topLevelNavLinks = $scope.app.navLinks.links.filter(function(navLink){ return !navLink.parentId; });

        topLevelNavLinks.forEach(function(navLink){
          navLink.children = $scope.app.navLinks.links.filter(function(nL){ return nL.parentId === navLink.id; });
        });

        return topLevelNavLinks;
      };

      $scope.show = function(navLink){
        $scope.selectedNavLink = navLink;
        var collection = $scope.app[navLink.linkTarget.type.toLowerCase()];
        $scope.obj = collection.filter(function(o){ return o.id === navLink.linkTarget.id})[0];

        if(navLink.linkTarget.type === 'Forms' && navLink.linkTarget.update) {
          var values = $scope.data[navLink.linkTarget.id][0];

          $scope.obj.fields.forEach(function(f){f.value = values[f.title];});
        }

        if(navLink.linkTarget.type === 'Listings') {
          var fieldTitles = [];
          for(var key in $scope.obj.fields) {
            if($scope.obj.fields[key]) fieldTitles.push(key);
          }

          DataService.getForm($scope.appId, $scope.obj.formId).
            then(function(form){
              $scope.listingFields = form.fields.filter(function(field){ return fieldTitles.indexOf(field.title) > -1});
            });
        }
      };

      $scope.saveForm = function(form){
        var values = {};

        form.fields.forEach(function(f){ values[f.title] = f.value; });

        $scope.data[form.id] = $scope.data[form.id] || [];

        $scope.data[form.id].push(values);

        form.fields.forEach(function(f){ f.value = null; });
      };

      $scope.split = function(text){
        return text ? text.split("\n") : "";
      };
    }
  ]
);
appModule.controller("AppRegistrationCtrl",
  [
    "$scope", "$routeParams", "$location", "DataService",
    function($scope, $routeParams, $location, DataService){
      $scope.appId = Number($routeParams.appId);

      var waitMessageKey = "AppRegistrationCtrl.getAppById";
      $scope.$root.addWaitMessage(waitMessageKey, "Getting app data");
      $scope.initializing = true;

      DataService.getAppById($scope.appId).
        then(function(app){
          $scope.app = app;

          $scope.registration = app.registration;
        }).
        finally(function(){
          $scope.$root.removeWaitMessage(waitMessageKey);

          $scope.initializing = false;
        });

      $scope.save = function(registration){
        $scope.saving = true;

        DataService.
          saveRegistration($scope.appId, registration).
          then(function(){
            $location.path("/apps/" + $scope.appId);
          }).
          finally(function(){
            $scope.saving = false;
          });
      };
    }
  ]
);
appModule.controller("AppUserCreateCtrl",
  [
    "$scope", "$routeParams", "$location", "DataService",
    function($scope, $routeParams, $location, DataService){
      $scope.appId = Number($routeParams.appId);

      var waitMessageKey = "AppUsersCtrl.getAppById";
      $scope.$root.addWaitMessage(waitMessageKey, "Getting app data");
      $scope.initializing = true;

      DataService.getAppById($scope.appId).
        then(function(app){
          $scope.app = app;
        }).
        finally(function(){
          $scope.$root.removeWaitMessage(waitMessageKey);
          $scope.initializing = false;
        });

      $scope.user = {};

      function validate(user, cb){
        $scope.validationErrors = [];

        if(user.password !== user.confirmPassword){
          $scope.validationErrors.push("Password and confirm password fields must match.");
        }

        cb($scope.validationErrors.length === 0);
      }

      $scope.create = function(user){
        validate(user, function(isValid){
          if(!isValid) return;

          $scope.saving = true;

          DataService.
            createUser($scope.appId, user).
            then(function(){
              $location.path("/apps/" + $scope.appId);
            }).
            finally(function(){
              $scope.saving = false;
            });
        });
      }
    }
  ]
);
appModule.controller("AppUsersCtrl",
  [
    "$scope", "$routeParams", "$location", "$q", "DataService",
    function($scope, $routeParams, $location, $q, DataService){
      $scope.appId = Number($routeParams.appId);

      var waitMessageKey = "AppUsersCtrl.getAppById";
      $scope.$root.addWaitMessage(waitMessageKey, "Getting app data");
      $scope.initializing = true;

      var promises = [];

      var getAppDeferred = $q.defer();

      promises.push(getAppDeferred.promise);

      DataService.getAppById($scope.appId).
        then(function(app){
          $scope.app = app;
        }).
        finally(function(){
          getAppDeferred.resolve();
          $scope.$root.removeWaitMessage(waitMessageKey);
        });

      var waitMessageKey2 = "AppUsersCtrl.getUsersByAppId";
      $scope.$root.addWaitMessage(waitMessageKey2, "Getting users");

      var getUsersDeferred = $q.defer();

      promises.push(getUsersDeferred.promise);

      DataService.getUsersByAppId($scope.appId).
        then(function(users){
          $scope.users = users;
        }).
        finally(function(){
          getUsersDeferred.resolve();
          $scope.$root.removeWaitMessage(waitMessageKey2);
        });

      $q.all(promises).then(function(){
        $scope.initializing = false;
      });
    }
  ]
);
appModule.controller("AppsCtrl", ["$scope", "$location", "DataService", function($scope, $location, DataService){
  $scope.$root.title = "Apps";

  $scope.newApp = {};

  var waitMessageKey = "AppCtrl.getAppById";
  $scope.$root.addWaitMessage(waitMessageKey, "Getting apps");
  $scope.initializing = true;

  DataService.getApps().
    then(function(apps){
      $scope.apps = apps;
    }).
    finally(function(){
      $scope.$root.removeWaitMessage(waitMessageKey);
      $scope.initializing = false;
    });

  $scope.create = function(){
    $scope.saving = true;

    DataService.createApp($scope.newApp).
      then(function(id){
        $location.path("/apps/" + id);

        $scope.saving = false;
      });
  };
}]);
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

appModule.controller("HomeCtrl", ["$scope", "$location", "DataService", function($scope, $location, DataService){
  $scope.$root.title = null;
  $scope.loginForm = {};

  if(!$scope.$root.skipSessionCheck){
    var waitMessageKey = "HomeCtrl.initialwhoami";
    $scope.$root.addWaitMessage(waitMessageKey, "Checking for previous session");
    $scope.initializing = true;

    DataService.whoami().
      then(function(username){
        if(username) {
          $scope.$root.authenticated = true;

          if ($scope.$root.authenticated) {
            $location.path("/apps");
          }
        }
      }).
      catch(function(reason){
        $scope.$root.err = reason;
      }).
      finally(function(){
        $scope.$root.removeWaitMessage(waitMessageKey);
        $scope.initializing = false;
      });
  }

  $scope.login = function(){
    $scope.invalidLogin = false;
    $scope.authenticating = true;

    var credentials = $scope.loginForm;

    DataService.authenticate(credentials).
      then(function(res){
        if(res.validLogin){
          $scope.$root.authenticated = true;

          $location.path("/apps");
        }
        else{
          $scope.invalidLogin = true;

          $scope.loginForm.password = null;
        }
      }).
      catch(function(reason){
        $scope.$root.err = reason;
      }).
      finally(function(){
        $scope.authenticating = false;
      });
  };
}]);