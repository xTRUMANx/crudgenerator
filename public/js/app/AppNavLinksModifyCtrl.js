appModule.controller("AppNavLinksModifyCtrl",
  [
    "$scope", "$routeParams", "$location", "DataService",
    function($scope, $routeParams, $location, DataService){
      $scope.appId = $routeParams.appId;
      $scope.navLink = {};

      var waitMessageKey = "AppFormCreateCtrl.getAppById";
      $scope.$root.addWaitMessage(waitMessageKey, "Getting app data");
      $scope.initializing = true;

      DataService.getAppById(Number($scope.appId)).
        then(function(app){
          $scope.app = app;

          function extractLinkTargetData(a, type){
            return a.map(function(f){return {title: f.title, id: f.id, type: type}});
          }

          $scope.linkTargets = extractLinkTargetData(app.forms, "Forms").
            concat(extractLinkTargetData(app.listings, "Listings"));
        }).
        finally(function(){
          $scope.$root.removeWaitMessage(waitMessageKey);
          $scope.initializing = false;
        });

      $scope.dropdownNavLinks = function(){
        return $scope.app.navLinks.links.filter(function(nL){ return nL.type === "dropdown"; });
      };

      $scope.navLinksTree = function(){
        if(!$scope.app) return [];

        var topLevelNavLinks = $scope.app.navLinks.links.filter(function(navLink){ return !navLink.parentId; });

        topLevelNavLinks.forEach(function(navLink){
          navLink.children = $scope.app.navLinks.links.filter(function(nL){ return nL.parentId === navLink.id; });
        });

        return topLevelNavLinks;
      };

      $scope.editNavLink = function(navLink){
        $scope.navLink = angular.copy(navLink);
      };

      $scope.removeParent = function(){
        $scope.navLink.parentId = null;
      };

      $scope.saveNavLink = function(){
        $scope.savingNavLink = true;
        var navLink = $scope.navLink;

        DataService.saveNavLink($scope.app.id, navLink).
          then(function(id){
            if(!navLink.id) {
              navLink.id = id;

              $scope.app.navLinks.links.push(navLink);
            }
            else {
              var oldNavLink = $scope.app.navLinks.links.filter(function(nL) { return nL.id === navLink.id; })[0];

              var index = $scope.app.navLinks.links.indexOf(oldNavLink);

              $scope.app.navLinks.links[index] = navLink;
            }

            $scope.navLink = {};
          }).
          finally(function(){
            $scope.savingNavLink = false;
          });
      };

      $scope.saveShowLinks = function(){
        $scope.savingShowLinks = true;

        DataService.saveShowLinks($scope.appId, $scope.app.navLinks.showLinks).
          finally(function(){
            $scope.savingShowLinks = false;
          });
      };
    }
  ]
);
