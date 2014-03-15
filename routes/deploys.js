var db = require('../services/db');

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

  db.getFormSchema(appId, formId, function(Schema){
    var formData = new Schema(req.body);

    // Validate model
    formData.validate(function(err){
      if(!err) {
        // if valid, pass to db.saveForm

        db.saveFormData(appId, formId, formData, req.body._id, function(){
          var url = "/deploys/" + appId + "/forms/" + formId.toString() + "?saved=true";

          res.redirect(url);
        });
      }
      else{
        req.locals = req.locals || {};
        req.locals.errors = err.errors;
        req.locals.formData = formData;

        createAppFormView(req, res);
      }
    });
  });
};

exports.appListing = function(req, res){
  // Get listing
  var appId = Number(req.params.appId);
  var listingId = Number(req.params.listingId);

  var listing= db.getListing(appId, listingId, function(listing){
    if(listing){
      // Get listing data
      db.getFormData(appId, listing.formId, null, function(data){
        var fieldTitles = [];
        for(var key in listing.fields) {
          if(listing.fields[key]) fieldTitles.push(key);
        }
        db.getForm(appId, listing.formId, function(form){
          var listingFields = form.fields.filter(function(field){ return fieldTitles.indexOf(field.title) > -1});

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
