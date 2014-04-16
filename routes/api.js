var db = require('../services/db');
var config = require('../config');

exports.router = function(req,res){
  exports[req.params.segment + req.method] ? exports[req.params.segment + req.method](req,res) : res.send("not found", 404);
};

function handleError(err, req, res){
  // TODO: Log error
  console.error(err);

  res.send("Oops, something went wrong server-side. Try again later.", 500);
}

exports.loginPOST = function(req, res){
  var credentials = req.body;

  db.authenticateUser(credentials, function(err, validLogin){
    if(err) {
      handleError(err, req, res);

      return;
    }

    if(validLogin){
      req.session.username = credentials.email.toLowerCase();
    }

    res.json({validLogin: validLogin});
  });
};

exports.logoutGET = function(req, res){
  req.session.username = null;

  res.end();
};

exports.whoamiGET = function(req, res){
  res.json({username: req.session.username});
};

exports.appsGET = function(req, res){
  var id = req.query.id;

  if(id){
    db.getApp(id, req.session.username, function(err, app){
      if(err){
        handleError(err, req, res);

        return;
      }

      res.json(app);
    });
  }
  else {
    db.getApps(req.session.username, function(err, apps){
      if(err){
        handleError(err, req, res);

        return;
      }

      res.json(apps);
    });
  }
};

exports.appsPOST = function(req, res){
  db.createApp(req.body, req.session.username, function(err, id){
    if(err){
      handleError(err, req, res);

      return;
    }

    res.json({id: id});
  });
};

exports.formsGET = function(req, res){
  var appId = req.query.appId;
  var formId = req.query.formId;

  db.getForm(appId, formId, req.session.username, function(err, form){
    if(err){
      handleError(err, req, res);

      return;
    }

    res.json(form);
  });
};

exports.formsPOST = function(req, res){
  var appId = req.query.appId;

  // TODO: Validate that there are no duplicate form field titles
  db.saveForm(appId, req.body, req.session.username, function(err){
    if(err){
      handleError(err, req, res);

      return;
    }

    res.end();
  });
};

exports.listingsGET = function(req, res){
  var appId = req.query.appId;
  var listingId = req.query.listingId;

  db.getListing(appId, listingId, req.session.username, function(err, listing){
    if(err){
      handleError(err, req, res);

      return;
    }

    res.json(listing);
  });
};

exports.listingsPOST = function(req, res){
  var appId = req.query.appId;

  db.saveListing(appId, req.body, req.session.username, function(err){
    if(err){
      handleError(err, req, res);

      return;
    }

    res.end();
  });
};

exports.navLinksGET = function(req, res){
  var appId = req.query.appId;

  db.getNavLinks(appId, username, function(err, navLinks){
    if(err){
      handleError(err, req, res);

      return;
    }

    res.json(navLinks);
  });
};

exports.navLinksPOST = function(req, res){
  var appId = req.query.appId;

  db.saveNavLink(appId, req.body, req.session.username, function(err, id){
    if(err){
      handleError(err, req, res);

      return;
    }

    res.json({ id: id });
  });
};

exports.navLinksShowLinksPOST = function(req, res){
  var appId = req.query.appId;

  db.saveNavLinksShowLinks(appId, req.body, req.session.username, function(err){
    if(err){
      handleError(err, req, res);

      return;
    }

    res.end();
  });
};

exports.deployPOST = function(req, res){
  var appId = req.query.appId;

  db.deployApp(appId, req.session.username, function(err){
    if(err){
      handleError(err, req, res);

      return;
    }

    res.redirect("http://" + appId + "." + config.deploymentSite);
  });
};

exports.deploymentSiteGET = function(req, res){
  res.json({ deploymentSite: config.deploymentSite });
};

exports.usersGET = function(req, res){
  var appId = req.query.appId;

  db.getUsers(appId, req.session.username, function(err, users){
    if(err){
      handleError(err, req, res);

      return;
    }

    res.json(users);
  });
};

exports.usersPOST = function(req, res){
  var appId = req.query.appId;

  db.saveUser(appId, req.body, req.session.username, function(err){
    if(err){
      handleError(err, req, res);

      return;
    }

    res.end();
  });
};

exports.registrationPOST = function(req, res){
  var appId = req.query.appId;

  db.saveRegistration(appId, req.body, req.session.username, function(err){
    if(err){
      handleError(err, req, res);

      return;
    }

    res.end();
  });
};