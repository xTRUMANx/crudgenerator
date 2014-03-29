appModule.controller("AppRegistrationCtrl", function($scope, $routeParams, $location, DataService){
  $scope.appId = Number($routeParams.appId);

  DataService.getAppById($scope.appId).
    then(function(app){
      $scope.app = app;

      $scope.registration = app.registration;
    });

  $scope.save = function(registration){
    DataService.
      saveRegistration($scope.appId, registration).
      then(function(){
        $location.path("/apps/" + $scope.appId);
      });
  };
});