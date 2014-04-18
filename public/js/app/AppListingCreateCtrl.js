appModule.controller("AppListingCreateCtrl", function($scope, $routeParams, $location, $q, DataService){
  $scope.appId = Number($routeParams.appId);

  var waitMessageKey = "AppListingCreateCtrl.getAppById";
  $scope.$root.addWaitMessage(waitMessageKey, "Getting app data");
  $scope.initializing = true;

  var promises = [];

  if($scope.listingId = Number($routeParams.listingId)) {
    var getListingDeferred = $q.defer();

    promises.push(getListingDeferred.promise);

    var waitMessageKey2 = "AppFormCreateCtrl.getListing";
    $scope.$root.addWaitMessage(waitMessageKey2, "Getting listing data");

    DataService.
      getListing($scope.appId, $scope.listingId).
      then(function(listing){
        $scope.originalListing = listing;
        $scope.listing = listing;
      }).
      finally(function(){
        $scope.$root.removeWaitMessage(waitMessageKey2);
        getListingDeferred.resolve();
      });
  }
  else {
    $scope.listing = { fields: [] };
  }

  var getAppDeferred = $q.defer();

  promises.push(getAppDeferred.promise);

  DataService.getAppById($scope.appId).
    then(function(app){
      $scope.app = app;
    }).
    finally(function(){
      getAppDeferred.resolve();
      $scope.$root.removeWaitMessage(waitMessageKey);
    });

  $q.all(promises).then(function(){
    $scope.initializing = false;
  });

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
      if($scope.listing.fields[key]) fieldIds.push(Number(key));
    }

    return $scope.selectedForm().fields.filter(function(field){ return fieldIds.indexOf(field.id) > -1});
  };

  $scope.orderedListingFields = function(){
    if(!$scope.listing) return [];

    var listingFields = $scope.listingFields();

    listingFields.forEach(function(field){
      field.order = $scope.orderedSelectedFields().filter(function(f){ return f.id === field.id; })[0].order;
    });

    return listingFields.sort(function(a,b){ return a.order > b.order; });
  };

  $scope.selectedForm = function(){
    return $scope.app.forms.filter(function(form){ return form.id === $scope.listing.formId; })[0];
  };

  $scope.selectedFields = function(){
    if(!$scope.listing) return [];

    var fieldIds = [];

    for(var key in $scope.listing.fields) {
      if($scope.listing.fields[key]) fieldIds.push(Number(key));
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
    $scope.saving = true;
    DataService.saveListing($scope.appId, listing).
      then(function(){
        $location.path("/apps/" + $scope.appId);
      }).
      finally(function(){
        $scope.saving = false;
      });
  };

  $scope.moveFieldUp = function(field){
    if(field.order === 1) return;

    var nextFieldUp = $scope.listing.order.filter(function(f){ return f.order === field.order - 1})[0];

    nextFieldUp.order++;
    field.order--;
  };

  $scope.moveFieldDown = function(field){
    if(field.order === $scope.listing.order.length) return;

    var nextFieldDown = $scope.listing.order.filter(function(f){ return f.order === field.order + 1})[0];

    nextFieldDown.order--;
    field.order++;
  };

  $scope.orderedSelectedFields = function(){
    if(!$scope.listing) return [];

    var selectedFields = $scope.selectedFields();

    if(!$scope.listing.order || !$scope.listing.order.length || $scope.listing.order.length !== selectedFields.length) {
      var order = 1;

      $scope.listing.order = selectedFields.map(function(id){ return {id: id, order: order++}});
    }

    var orderedSelectedFields =  $scope.listing.order.sort(function(a,b){ return a.order > b.order});

    if(!$scope.selectedField || orderedSelectedFields.indexOf($scope.selectedField) === -1) {
      $scope.selectedField = orderedSelectedFields[0];
    }

    return orderedSelectedFields;
  };
});