appModule.controller("AppNavLinksModifyCtrl", function($scope, $routeParams, $location, DataService){
  $scope.appId = $routeParams.appId;

  DataService.getAppById(Number($scope.appId)).
    then(function(app){
      $scope.app = app;

      function extractLinkTargetData(a, type){
        return a.map(function(f){return {name: f.name, id: f.id, type: type}});
      }

      $scope.linkTargets = extractLinkTargetData(app.forms, "Forms").
        concat(extractLinkTargetData(app.listings, "Listings"));
    });

  $scope.dropdownNavLinks = function(){
    return $scope.app.navLinks.filter(function(nL){ return nL.type === "dropdown"; });
  };

  $scope.navLinksTree = function(){
    var topLevelNavLinks = $scope.app.navLinks.filter(function(navLink){ return !navLink.parentId; });

    topLevelNavLinks.forEach(function(navLink){
      navLink.children = $scope.app.navLinks.filter(function(nL){ return nL.parentId === navLink.id; });
    });

    return topLevelNavLinks;
  };

  $scope.editNavLink = function(navLink){
    $scope.navLink = angular.copy(navLink);
  };

  $scope.removeParent = function(){
    $scope.navLink.parentId = null;
  };

  $scope.save = function(navLink){
    DataService.saveNavLink($scope.app.id, navLink).
      then(function(id){
        if(!navLink.id) {
          navLink.id = id;

          $scope.app.navLinks.push(navLink);
        }
        else {
          var oldNavLink = $scope.app.navLinks.filter(function(nL) { return nL.id === navLink.id; })[0];

          var index = $scope.app.navLinks.indexOf(oldNavLink);

          $scope.app.navLinks[index] = navLink;
        }

        $scope.navLink = null;
      });
  }
});