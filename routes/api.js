var db = require('../services/db');

exports.router = function(req,res){
  exports[req.params.segment + req.method] ? exports[req.params.segment + req.method](req,res) : res.send("not found", 404);
};

exports.appsGET = function(req, res){
  var id = req.query.id;

  if(id){
    db.getApp(id, function(app){
      res.json(app);
    });
  }
  else {
    db.getApps(function(apps){
      res.json(apps);
    });
  }
};

exports.appsPOST = function(req, res){
  db.createApp(req.body, function(id){
    res.json(id);
  });
};

exports.formsGET = function(req, res){
  var appId = req.query.appId;
  var formId = req.query.formId;

  db.getForm(appId, formId, function(form){
    res.json(form);
  });
};

exports.formsPOST = function(req, res){
  var appId = req.query.appId;

  // TODO: Validate that there are no duplicate form field titles
  db.saveForm(appId, req.body, function(){
    res.end();
  });
};

exports.listingsGET = function(req, res){
  var appId = req.query.appId;
  var listingId = req.query.listingId;

  db.getListing(appId, listingId, function(listing){
    res.json(listing);
  });
};

exports.listingsPOST = function(req, res){
  var appId = req.query.appId;

  db.saveListing(appId, req.body, function(){
    res.end();
  });
};

exports.navLinksGET = function(req, res){
  var appId = req.query.appId;

  db.getNavLinks(appId, function(navLinks){
    res.json(navLinks);
  });
};

exports.navLinksPOST = function(req, res){
  var appId = req.query.appId;

  db.saveNavLink(appId, req.body, function(id){
    res.json(id);
  });
};

exports.deployPOST = function(req, res){
  var appId = req.query.appId;

  db.getApp(appId, function(app){
    db.deployApp(app, function(){
      res.redirect("/deploys/" + appId);
    });
  });
};

exports.usersPOST = function(req, res){
  var appId = req.query.appId;

  db.saveUser(appId, req.body, function(){
    res.end();
  });
};

exports.registrationPOST = function(req, res){
  var appId = req.query.appId;

  db.saveRegistration(appId, req.body, function(){
    res.end();
  });
};

exports.navLinksShowLinksPOST = function(req, res){
  var appId = req.query.appId;

  db.saveNavLinksShowLinks(appId, req.body, function(){
    res.end();
  });
};

exports.usersGET = function(req, res){
  var appId = req.query.appId;

  db.getUsers(appId, function(users){
    res.json(users);
  });
};