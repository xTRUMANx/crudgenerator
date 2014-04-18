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