appModule.controller("AppPreviewCtrl", function($scope, $routeParams, $location, DataService){
  $scope.appId = Number($routeParams.appId);
  $scope.data = {};

  DataService.getAppById(Number($scope.appId)).
    then(function(app){
      $scope.app = app;

      function extractLinkTargetData(a, type){
        return a.map(function(f){return {name: f.name, id: f.id, type: type}});
      }

      $scope.linkTargets = extractLinkTargetData(app.forms, "Forms").
        concat(extractLinkTargetData(app.listings, "Listings"));
    });

  $scope.navLinksTree = function(){
    if(!$scope.app) return [];

    var topLevelNavLinks = $scope.app.navLinks.links.filter(function(navLink){ return !navLink.parentId; });

    topLevelNavLinks.forEach(function(navLink){
      navLink.children = $scope.app.navLinks.links.filter(function(nL){ return nL.parentId === navLink.id; });
    });

    return topLevelNavLinks;
  };

  $scope.show = function(navLink){
    $scope.selectedNavLink = navLink;
    var collection = $scope.app[navLink.linkTarget.type.toLowerCase()];
    $scope.obj = collection.filter(function(o){ return o.id === navLink.linkTarget.id})[0];

    if(navLink.linkTarget.type === 'Forms' && navLink.linkTarget.update) {
      var values = $scope.data[navLink.linkTarget.id][0];

      $scope.obj.fields.forEach(function(f){f.value = values[f.title];});
    }

    if(navLink.linkTarget.type === 'Listings') {
      var fieldTitles = [];
      for(var key in $scope.obj.fields) {
        if($scope.obj.fields[key]) fieldTitles.push(key);
      }

      DataService.getForm($scope.appId, $scope.obj.formId).
        then(function(form){
          $scope.listingFields = form.fields.filter(function(field){ return fieldTitles.indexOf(field.title) > -1});
        });
    }
  };

  $scope.saveForm = function(form){
    var values = {};

    form.fields.forEach(function(f){ values[f.title] = f.value; });

    $scope.data[form.id] = $scope.data[form.id] || [];

    $scope.data[form.id].push(values);

    form.fields.forEach(function(f){ f.value = null; });
  };

  $scope.split = function(text){
    return text ? text.split("\n") : "";
  };
});