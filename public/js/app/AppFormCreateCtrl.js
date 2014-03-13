appModule.controller("AppFormCreateCtrl", function($scope, $routeParams, $location, DataService){
  $scope.appId = Number($routeParams.appId);

  if($scope.formId = Number($routeParams.formId)) {
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

  $scope.types = ["string", "number", "date", "boolean", "options"];
  $scope.optionTypes = ["radio", "checkbox", "select", "multi-select"];

  DataService.getAppById($scope.appId).
    then(function(app){
      $scope.app = app;
    });

  $scope.validateForm = function() {
    return $scope.form.name && $scope.form.fields.length && $scope.form.fields.filter(function(field){
      return !!field.title && !!field.type && !(field.type === 'options' && !(field.optionType && field.options))
    }).length === $scope.form.fields.length;
  }

  $scope.save = function(form) {
    DataService.saveForm($scope.appId, form).then(function(){
      $location.path("/apps/" + $scope.appId);
    });
  };

  $scope.addField = function(){
    var field = { title: "New Field" };
    $scope.form.fields.push(field);
    $scope.selectedField = field;
  };

  $scope.removeField = function(field){
    $scope.form.fields.splice($scope.form.fields.indexOf(field), 1);
  };

  $scope.split = function(text){
    return text ? text.split("\n") : "";
  };
});