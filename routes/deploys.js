var db = require('../services/db'),
  expressValidator = require('express-validator');

expressValidator.validator.isSubset = function(value, array) {
  if (!Array.isArray(value)) {
    return array.indexOf(expressValidator.validator.toString(value)) >= 0;
  }
  else{
    var res = true;

    value.forEach(function(v){
      res = res && expressValidator.validator.isIn(v, array);
    });

    return res;
  }
};

exports.appHome = function(req, res){
  var appId = req.params.appId;

  db.getDeployedApp(appId, function(app){
    var topLevelNavLinks = app.navLinks.filter(function(navLink){ return !navLink.parentId; });

    topLevelNavLinks.forEach(function(navLink){
      navLink.children = app.navLinks.filter(function(nL){ return nL.parentId === navLink.id; });
    });

    res.render("appHome", {title: "Home", vm: { app: app }, navLinks: topLevelNavLinks });
  });
};

exports.appForm = function(req, res){
  createAppFormView(req, res);
};

function createAppFormView(req, res){
  var appId = req.params.appId;

  db.getDeployedApp(appId, function(app){
    var topLevelNavLinks = app.navLinks.filter(function(navLink){ return !navLink.parentId; });

    topLevelNavLinks.forEach(function(navLink){
      navLink.children = app.navLinks.filter(function(nL){ return nL.parentId === navLink.id; });
    });

    var formId = Number(req.params.formId);
    var form = app.forms.filter(function(form) { return form.id === formId; })[0];
    req.locals = req.locals || {};

    if(req.query.formDataId && !req.locals.formData){
      db.getFormData(appId, formId, req.query.formDataId, function(formData){
        res.render("appForm", {title: form.name, vm: { app: app, formData: formData, errors: req.locals.errors }, navLinks: topLevelNavLinks, form: form, saved: req.query.saved });
      });
    }
    else{
      res.render("appForm", {title: form.title, vm: { app: app, formData: req.locals.formData || {}, errors: req.locals.errors }, navLinks: topLevelNavLinks, form: form, saved: req.query.saved });
    }
  });
}

exports.saveAppForm = function(req, res){
  // Make model out of form data using Schema
  var appId = req.params.appId;
  var formId = req.params.formId;
  var formData = req.body;

  validateForm(appId, formId, req, function(err){
    if(!err.length) {
      // if valid, pass to db.saveForm

      db.saveFormData(appId, formId, formData, req.body.id, function(){
        var url = "/deploys/" + appId + "/forms/" + formId.toString() + "?saved=true";

        res.redirect(url);
      });
    }
    else{
      req.locals = req.locals || {};
      req.locals.errors = err;
      req.locals.formData = formData;

      createAppFormView(req, res);
    }
  });
};

function validateForm(appId, formId, req, cb){
  var errors = [];
  db.getForm(appId, formId, function(form){
    if(!form) {
      errors.push({msg: "Form not found."});
    }
    else{
      form.fields.forEach(function(field){
        if((field.required || (field.type === 'options' && field.optionType === 'radio')) && !req.body[field.id]) {
          errors.push({param: field.id, msg: field.title + " is required."});
          return;
        }

        switch (field.type){
          case "number":
            if(req.body[field.id]) {
              req.checkBody(field.id, field.title + " must be a number.").isNumeric();
            }
            break;
          case "date":
            if(req.body[field.id]) {
              req.checkBody(field.id, field.title + " must be a date.").isDate();
            }
            break;
          case "boolean":
            if(req.body[field.id]) {
              req.body[field.id] = expressValidator.validator.toBoolean(req.body[field.id]);
            }
            break;
          case "options":
            if(req.body[field.id]) {
              var options = field.options.split("\n");

              req.checkBody(field.id, field.title + " must be one of the options in the list.").isSubset(options);
            }
            break;
          default :
            break;
        }
      });

      var validationErrors = req.validationErrors();

      var err = validationErrors ? errors.concat(validationErrors) : errors;

      cb(err);
    }
  });
}

exports.appListing = function(req, res){
  // Get listing
  var appId = req.params.appId;
  var listingId = req.params.listingId;

  var listing= db.getDeployedListing(appId, listingId, function(listing){
    if(listing){
      // Get listing data
      db.getFormData(appId, listing.formId, null, function(data){
        var fieldTitles = [];
        for(var key in listing.fields) {
          if(listing.fields[key]) fieldTitles.push(key);
        }
        db.getForm(appId, listing.formId, function(form){
          var listingFields = form.fields.filter(function(field){ return fieldTitles.indexOf(field.id) > -1});

          db.getDeployedApp(appId, function(app){
            var topLevelNavLinks = app.navLinks.filter(function(navLink){ return !navLink.parentId; });

            topLevelNavLinks.forEach(function(navLink){
              navLink.children = app.navLinks.filter(function(nL){ return nL.parentId === navLink.id; });
            });

            var vm = { app: app, listing: listing, data: data, listingFields: listingFields };

            res.render("appListing", { title: listing.title, vm: vm, navLinks: topLevelNavLinks });
          });
        });
      });
    }
    else{
      res.send("listing not found", 404)
    }
  });
};
