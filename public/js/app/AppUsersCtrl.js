appModule.controller("AppUsersCtrl", function($scope, $routeParams, $location, DataService){
  $scope.appId = Number($routeParams.appId);

  DataService.getAppById($scope.appId).
    then(function(app){
      $scope.app = app;
    });

  DataService.getUsersByAppId($scope.appId).
    then(function(users){
      $scope.users = users;
    });
});