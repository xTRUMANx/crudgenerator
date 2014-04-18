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