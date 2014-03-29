appModule.controller("AppCtrl", function($scope, $routeParams, DataService){
  $scope.appId = $routeParams.appId;

  DataService.getAppById(Number($scope.appId)).
    then(function(app){
      $scope.app = app;
    });

  $scope.navLinksTree = function(){
    var topLevelNavLinks = $scope.app.navLinks.links.filter(function(navLink){ return !navLink.parentId; });

    topLevelNavLinks.forEach(function(navLink){
      navLink.children = $scope.app.navLinks.links.filter(function(nL){ return nL.parentId === navLink.id; });
    });

    return topLevelNavLinks;
  };
});