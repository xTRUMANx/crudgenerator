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
    if($scope.originalListing && $scope.listing.formId === $scope.originalListing.formId) {
      $scope.listing.fields = $scope.originalListing.fields;
    }
    else {
      var fields = {};
      $scope.listing.fields = $scope.selectedForm().fields.forEach(function(field){ fields[field.title] = false});
      $scope.listing.fields = fields;
    }
  };

  $scope.noSelectedFields = function(){
    //return $scope.listing.fields.filter(function(f){ return f.listing === true; }).length === 0;
    for(var key in $scope.listing.fields) {
      if($scope.listing.fields[key]) return false;
    }

    return true;
  }

  $scope.listingFields = function(){
    //return $scope.listing.form.fields.filter(function(f){ return f.listing; });
    var fieldTitles = [];
    for(var key in $scope.listing.fields) {
      if($scope.listing.fields[key]) fieldTitles.push(key);
    }

    return $scope.selectedForm().fields.filter(function(field){ return fieldTitles.indexOf(field.title) > -1});
  };

  $scope.selectedForm = function(){
    return $scope.app.forms.filter(function(form){ return form.id === $scope.listing.formId; })[0];
  };

  $scope.selectedFields = function(){
    var fieldTitles = [];

    for(var key in $scope.listing.fields) {
      if($scope.listing.fields[key]) fieldTitles.push(key);
    }

    return fieldTitles;
  };

  $scope.sampleValue = function(field){
    switch (field.type) {
      case "string": return "Sample Value";
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