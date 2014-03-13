appModule.controller("AppsCtrl", function($scope, $location, DataService){
  $scope.$root.title = "Apps";

  // TODO: Apps should be fetched from DataService
  DataService.getApps().
    then(function(apps){
      $scope.apps = apps;
    });

  $scope.create = function(){
    DataService.createApp({title: $scope.newAppTitle}).
      then(function(id){
        $scope.newAppName = null;

        $location.path("/apps/" + id);
      });
  };
});