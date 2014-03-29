appModule.controller("AppUserCreateCtrl", function($scope, $routeParams, $location, DataService){
  $scope.appId = Number($routeParams.appId);

  DataService.getAppById($scope.appId).
    then(function(app){
      $scope.app = app;
    });

  $scope.user = {};

  function validate(user, cb){
    $scope.validationErrors = [];

    if(user.password !== user.confirmPassword){
      $scope.validationErrors.push("Password and confirm password fields must match.");
    }

    cb($scope.validationErrors.length === 0);
  }

  $scope.create = function(user){
    validate(user, function(isValid){
      if(!isValid) return;

      DataService.
        createUser($scope.appId, user).
        then(function(){
          $location.path("/apps/" + $scope.appId);
        });
    });
  }
});