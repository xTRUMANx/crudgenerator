appModule.controller("AppFormCreateCtrl", function($scope, $routeParams, $location, DataService){
  $scope.appId = Number($routeParams.appId);

  DataService.getAppById($scope.appId).
    then(function(app){
      $scope.app = app;
    });

  if($scope.formId = Number($routeParams.formId)) {
    // NOTE: Maybe just fetch the form from the app object?
    DataService.
      getForm($scope.appId, $scope.formId).
      then(function(form){
        $scope.form = form;
        $scope.selectedField = $scope.form.fields[0];
      });
  }
  else {
    $scope.form = { fields: [] };

    $scope.selectedField = $scope.form.fields[0];
  }

  $scope.types = ["text", "number", "date", "boolean", "options"];
  $scope.optionTypes = ["radio", "checkbox", "select", "multi-select"];

  $scope.$watch("selectedField.optionType", function(newValue){
    if(newValue === "radio") {
      $scope.selectedField.required = true;
    }
  });

  $scope.validateForm = function() {
    function hasUniqueTitles(fields) {
      var valid = true;

      for(var i = 0; i < fields.length; i++) {
        for(var j = 0; j < fields.length; j++) {
          if(i == j) continue;
          if(fields[i].title === fields[j].title) {
            $scope.duplicateTitle = fields[i].title;
            valid = false;
            break;
          }
        }
        if(!valid) break;
      }

      if(valid) {
        $scope.duplicateTitle = null;
      }

      return valid;
    }

    return $scope.form && $scope.form.title && $scope.form.fields.length && hasUniqueTitles($scope.form.fields) && $scope.form.fields.filter(function(field){
      return !!field.title && !!field.type && !(field.type === 'options' && !(field.optionType && field.options))
    }).length === $scope.form.fields.length;
  };

  $scope.save = function(form) {
    DataService.saveForm($scope.appId, form).then(function(){
      $location.path("/apps/" + $scope.appId);
    });
  };

  $scope.addField = function(){
    var field = { title: "New Field" };
    $scope.form.fields.push(field);
    field.order = $scope.form.fields.length;
    $scope.selectedField = field;
  };

  $scope.removeField = function(field){
    $scope.form.fields.splice($scope.form.fields.indexOf(field), 1);

    $scope.form.fields.
      filter(function(f){ return f.order > field.order; }).
      forEach(function(f){ f.order--; });
  };

  $scope.split = function(text){
    return text ? text.split("\n") : "";
  };

  $scope.moveFieldUp = function(field){
    if(field.order === 1) return;

    var nextFieldUp = $scope.form.fields.filter(function(f){ return f.order === field.order - 1})[0];

    nextFieldUp.order++;
    field.order--;
  };

  $scope.moveFieldDown = function(field){
    if(field.order === $scope.form.fields.length) return;

    var nextFieldDown = $scope.form.fields.filter(function(f){ return f.order === field.order + 1})[0];

    nextFieldDown.order--;
    field.order++;
  };

  $scope.orderedFormFields = function(){
    if(!$scope.form) return [];

    return $scope.form.fields.sort(function(a,b){ return a.order > b.order});
  };
});