appModule.controller("AppUserCreateCtrl",
  [
    "$scope", "$routeParams", "$location", "DataService",
    function($scope, $routeParams, $location, DataService){
      $scope.appId = Number($routeParams.appId);

      var waitMessageKey = "AppUsersCtrl.getAppById";
      $scope.$root.addWaitMessage(waitMessageKey, "Getting app data");
      $scope.initializing = true;

      DataService.getAppById($scope.appId).
        then(function(app){
          $scope.app = app;
        }).
        finally(function(){
          $scope.$root.removeWaitMessage(waitMessageKey);
          $scope.initializing = false;
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

          $scope.saving = true;

          DataService.
            createUser($scope.appId, user).
            then(function(){
              $location.path("/apps/" + $scope.appId);
            }).
            finally(function(){
              $scope.saving = false;
            });
        });
      }
    }
  ]
);