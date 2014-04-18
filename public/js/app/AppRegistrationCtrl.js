appModule.controller("AppRegistrationCtrl", function($scope, $routeParams, $location, DataService){
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
});