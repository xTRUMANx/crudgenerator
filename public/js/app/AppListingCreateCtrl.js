appModule.controller("AppListingCreateCtrl", function($scope, $routeParams, $location, DataService){
  $scope.appId = Number($routeParams.appId);

  DataService.getAppById($scope.appId).
    then(function(app){
      $scope.app = app;
    });

  if($scope.listingId = Number($routeParams.listingId)) {
    DataService.
      getListing($scope.appId, $scope.listingId).
      then(function(listing){
        $scope.originalListing = listing;
        $scope.listing = listing;
      });
  }
  else {
    $scope.listing = { fields: [] };
  }

  $scope.formSelected = function(){
    if(!$scope.listing) return;

    if($scope.originalListing && $scope.listing.formId === $scope.originalListing.formId) {
      $scope.listing.fields = $scope.originalListing.fields;
    }
    else {
      var fields = {};

      $scope.selectedForm().fields.forEach(function(field){ fields[field.id] = false});

      $scope.listing.fields = fields;
    }
  };

  $scope.noSelectedFields = function(){
    if(!$scope.listing) return false;

    for(var key in $scope.listing.fields) {
      if($scope.listing.fields[key]) return false;
    }

    return true;
  };

  $scope.listingFields = function(){
    if(!$scope.listing) return [];

    var fieldIds = [];
    for(var key in $scope.listing.fields) {
      if($scope.listing.fields[key]) fieldIds.push(key);
    }

    return $scope.selectedForm().fields.filter(function(field){ return fieldIds.indexOf(field.id) > -1});
  };

  $scope.selectedForm = function(){
    return $scope.app.forms.filter(function(form){ return form.id === $scope.listing.formId; })[0];
  };

  $scope.selectedFields = function(){
    var fieldIds = [];

    for(var key in $scope.listing.fields) {
      if($scope.listing.fields[key]) fieldIds.push(key);
    }

    return fieldIds;
  };

  $scope.fieldTitle = function(id){
    return $scope.selectedForm().fields.filter(function(field){ return field.id === id})[0].title;
  };

  $scope.sampleValue = function(field){
    switch (field.type) {
      case "text": return "Sample Value";
      case "number": return 42;
      case "date": return new Date().toDateString();
      case "boolean": return "Yes";
      case "options": {
        if(["radio", "select"].indexOf(field.optionType) > -1) {
          return field.options.split("\n")[0];
        }
        else {
          return field.options.split("\n").join(", ");
        }
      }
      default : return "Unknown type: " + field.type;
    }
  };

  $scope.save = function(listing){
    DataService.saveListing($scope.appId, listing).then(function(){
      $location.path("/apps/" + $scope.appId);
    });
  };
});