var appModule = angular.module("AppModule", ["ngRoute", "checklist-model"]);

appModule.constant("apiRootUrl", "/api/");

appModule.config(function($routeProvider){
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
});

appModule.run(function($rootScope, $location, $http, apiRootUrl){
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
});