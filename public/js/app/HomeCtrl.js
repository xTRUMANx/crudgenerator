appModule.controller("HomeCtrl", function($scope, $location, DataService){
  $scope.$root.title = null;
  $scope.loginForm = {};

  if(!$scope.$root.skipSessionCheck){
  $scope.checkingSession = true;

  DataService.whoami().
    then(function(username){
      if(username) {
        $scope.$root.authenticated = true;

        if ($scope.$root.authenticated) {
          $location.path("/apps");
        }
      }
    }).
    catch(function(reason){
      $scope.$root.err = reason;
    }).
    finally(function(){
      $scope.checkingSession = false;
    });
  }
  else{
    $scope.$root.skipSessionCheck = false;
  }

  $scope.login = function(){
    $scope.invalidLogin = false;
    $scope.authenticating = true;

    var credentials = $scope.loginForm;

    DataService.authenticate(credentials).
      then(function(res){
        if(res.validLogin){
          $scope.$root.authenticated = true;

          $location.path("/apps");
        }
        else{
          $scope.invalidLogin = true;

          $scope.loginForm.password = null;
        }
      }).
      catch(function(reason){
        $scope.$root.err = reason;
      }).
      finally(function(){
        $scope.authenticating = false;
      });
  };
});