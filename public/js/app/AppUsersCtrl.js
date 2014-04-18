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