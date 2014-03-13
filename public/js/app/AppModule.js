var appModule = angular.module("AppModule", ["ngRoute", "checklist-model"]);

appModule.config(function($routeProvider, $locationProvider){
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
});