var pg = require("pg");
var q = require("q");
var crypto = require("crypto");
var util = require("util");
var config = require("../config");
var connectionString = config.connectionString;

function hasher(password, salt, cb){
  var iterations = 10000;
  var length = 40;

  crypto.pbkdf2(password, salt, iterations, length, function(err, derivedKey){
    if(err) {
      cb(err);

      return;
    }

    var passwordHash = derivedKey.toString("hex");

    cb(err, passwordHash);
  });
}

exports.authenticateUser = function(credentials, cb){
  var sql = "select * from users where email = $1";

  pg.connect(connectionString, function(err, client, done){
    if(err) {
      cb(err);

      return;
    }

    client.query(sql, [credentials.email], function(err, result){
      done();

      if(err){
        cb(err);

        return;
      }

      if(result.rowCount){
        hasher(credentials.password, result.rows[0]["salt"], function(err, passwordHash){
          if(err){
            cb(err);

            return;
          }

          var actualPasswordHash = result.rows[0]["passwordhash"];

          var isPasswordCorrect = passwordHash === actualPasswordHash;

          cb(err, isPasswordCorrect);
        })
      }
      else {
        cb(err, false);
      }
    });
  });
};

exports.getApps = function(username, cb){
  var apps = [];

  pg.connect(connectionString, function(err, client, done){
    if(err) {
      cb(err);

      return;
    }

    var sql = "select apps.*, count(forms.id) as formsCount, count(listings.id) as listingsCount " +
              "from apps " +
              "left join forms " +
              "on apps.id = forms.appid " +
              "left join listings " +
              "on apps.id = listings.appid " +
              "where userid = (select id from users where email = $1) " +
              "group by apps.id " +
              "order by apps.id";

    var query = client.query(sql, [username]);

    query.on("error", function(err){
      cb(err);
    });

    query.on("row", function(row){
      var app = row.data;

      app.id = row.id;
      app.formsCount = row.formscount;
      app.listingsCount = row.listingscount;

      apps.push(app);
    });

    query.on("end", function(){
      done();

      var appsSummary = apps.map(function(app){
        return {
          id: app.id,
          title: app.title,
          formsCount: app.formsCount,
          listingsCount: app.listingsCount
        };
      });

      cb(null, appsSummary);
    });
  });
};

exports.getApp = function(id, username, cb){
  var app = null;

  pg.connect(connectionString, function(err, client, done){
    if(err){
      cb(err);

      return;
    }

    var appSql = "select apps.id, apps.data, apps.showlinks, apps.registration, " +
                "count(appusers.username)::int as userscount, deployedapps.id as deployedAppId " +
                "from apps " +
                "left join appusers " +
                "on apps.id = appusers.appid " +
                "left join deployedapps " +
                "on apps.id = deployedapps.appid " +
                "where apps.id = $1 and userid = (select id from users where email = $2) " +
                "group by apps.id, apps.data::text, apps.showlinks::text, apps.registration::text, deployedapps.id";

    var query = client.query(appSql, [id, username]);

    query.on("error", function(err){
      done();

      cb(err);
    });

    query.on("row", function(row){
      app = row.data;

      app.id = row.id;

      app.navLinks = {};

      app.navLinks.showLinks = row.showlinks;

      app.registration = row.registration;

      app.usersCount = row.userscount;

      app.deployed = !!row.deployedappid;
    });

    query.on("end", function(){
      if(app){
        var promises = [];

        var formsQueryDeferred = q.defer();
        promises.push(formsQueryDeferred.promise);

        var fieldsDeferred = q.defer();
        promises.push(fieldsDeferred.promise);

        var formsSql = "select * from forms where appid = $1 order by id";

        client.query(formsSql, [id], function(err, result){
          if(err){
            formsQueryDeferred.reject(err);
            fieldsDeferred.resolve();

            return;
          }

          app.forms = [];

          result.rows.forEach(function(row){
            var form = row.data;

            form.id = row.id;

            app.forms.push(form);
          });

          if(result.rowCount) {
            (function getAllFieldsForApp() {
              var fieldsSql = "select * from fields where formid in (select id from forms where appid = $1)";

              client.query(fieldsSql, [id], function(err, result){
                if(err){
                  fieldsDeferred.reject(err);

                  return;
                }

                result.rows.forEach(function(row){
                  var form = app.forms.filter(function(form){ return form.id === row.formid; })[0];

                  if(form){
                    form.fields = form.fields || [];

                    var field = row.data;
                    field.id = row.id;

                    form.fields.push(field);
                  }
                });

                fieldsDeferred.resolve();
              });
            })();
          }
          else{
            fieldsDeferred.resolve();
          }

          formsQueryDeferred.resolve();
        });

        var listingsQueryDeferred = q.defer();
        promises.push(listingsQueryDeferred.promise);

        var listingsSql = "select * from listings where appid = $1 order by id";

        client.query(listingsSql, [id], function(err, result){
          if(err){
            listingsQueryDeferred.reject(err);

            return;
          }

          app.listings = [];

          result.rows.forEach(function(row){
            var listing = row.data;

            listing.id = row.id;

            app.listings.push(listing);
          });

          listingsQueryDeferred.resolve();
        });

        var navLinksDeferred = q.defer();
        promises.push(navLinksDeferred.promise);

        exports.getNavLinks(id, username, function(err, navLinks){
          app.navLinks.links = navLinks;

          err ? navLinksDeferred.reject(err) : navLinksDeferred.resolve();
        });

        q.
          all(promises).
          then(function(){
            cb(null, app);
          }).
          fail(function(err){
            cb(err);
          }).
          fin(function(){
            done();
          });
      }
      else{
        done();

        cb();
      }
    });
  });
};

exports.createApp = function(app, username, cb){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      cb(err);

      return;
    }

    var sql = "insert into apps (id, data, userid) " +
              "values (default, $1, (select id from users where email = $2)) " +
              "returning id";

    var query = client.query(sql, [app, username]);

    query.on("error", function(err){
      cb(err);
    });

    var id = null;

    query.on("row", function(row){
      id = row.id;
    });

    query.on("end", function(){
      done();

      cb(null, id);
    });
  });
};

exports.getForm = function(appId, formId, username, cb){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      cb(err);

      return;
    }

    var promises = [];

    var formsSql = "select * " +
      "from forms " +
      "where id = $1 " +
        "and appid = $2 " +
        "and exists (select id " +
                    "from apps " +
                    "where id = $2 and userid = (select id " +
                                                "from users " +
                                                "where email = $3)) " +
      "order by id";

    var formDeferred = q.defer();

    promises.push(formDeferred.promise);

    var formsQuery = client.query(formsSql, [formId, appId, username]);
    var form = null;

    formsQuery.on("error", function(err){
      formDeferred.reject(err);
    });

    formsQuery.on("row", function(row){
      form = row.data;
      form.id = row.id;
    });

    formsQuery.on("end", function(){
      formDeferred.resolve();
    });

    var fieldsSql = "select * " +
                    "from fields " +
                    "where formid = $1 " +
                      "and exists (select id " +
                                  "from apps " +
                                  "where id = $2 and userid = (select id " +
                                                              "from users " +
                                                              "where email = $3)) " +
                    "order by id";

    var fieldsDeferred = q.defer();

    promises.push(fieldsDeferred.promise);

    var fieldsQuery = client.query(fieldsSql, [formId, appId, username]);
    var fields = [];

    fieldsQuery.on("error", function(err){
      fieldsDeferred.reject(err);
    });

    fieldsQuery.on("row", function(row){
      var field = row.data;
      field.id = row.id;
      fields.push(field);
    });

    fieldsQuery.on("end", function(){
      fieldsDeferred.resolve();
    });

    q.all(promises).
      then(function(){
        form.fields = fields;

        cb(null, form);
      }).
      fail(function(err){
        cb(err);
      }).
      fin(function(){
        done();
      });
  });
};

exports.saveForm = function(appId, form, username, cb){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      cb(err);
    }

    var fields = form.fields;

    delete form.fields;

    var query, parameters;

    if(!form.id) {
      var sql = "insert into forms (id, data, appId) " +
        "values (default, $1, (select id from apps where id = $2 and userid = (select id from users where email = $3))) " +
        "returning id";

      query = client.query(sql, [form, appId, username]);
      var formId = null;

      query.on("error", function (err) {
        cb(err);
      });

      query.on("row", function(row){
        formId = row.id;
      });

      query.on("end", function () {
        var sql = "insert into fields (data, formId) values ";

        var valuesSql = [];

        for(var i =0; i < fields.length * 2; i+=2){
          valuesSql.push(util.format("($%d, $%d)", i + 1, i + 2));
        }

        sql += valuesSql.join(", ");

        parameters = fields.map(function(field){ return [field, formId]}).reduce(function(a, b){ return a.concat(b)});

        client.query(sql, parameters, function(err){
          done();

          if(err){
            cb(err);

            return;
          }

          cb();
        });
      });
    }
    else{
      var promises = [];

      var formsSql = "update forms set " +
                    "data = $1 " +
                    "where id = $2 and " +
                    "exists (select id from apps where id = $3 and userid = (select id from users where email = $4))";

      var formsUpdateDeferred = q.defer();
      promises.push(formsUpdateDeferred.promise);

      query = client.query(formsSql, [form, form.id, appId, username]);

      query.on("error", function (err) {
        formsUpdateDeferred.reject(err);
      });

      query.on("end", function () {
        formsUpdateDeferred.resolve();
      });

      // Separate fields into new and existing fields
      var newFields = [];
      var existingFields = [];

      fields.forEach(function(field){
        field.id ? existingFields.push(field) : newFields.push(field);
      });

      // Delete removed fields
      var remainingFieldIds = existingFields.map(function(field){ return field.id });

      var removedFieldsDeferred = q.defer();
      promises.push(removedFieldsDeferred.promise);

      var removedFieldsSql = "delete from fields " +
                              "where formId = $1 " +
                              "and exists (select id " +
                                          "from apps " +
                                          "where id = $2 and userid = (select id " +
                                                                      "from users " +
                                                                      "where email = $3))";

      if(remainingFieldIds.length) {
        var inSql = remainingFieldIds.map(function (field, i) {
          var offset = 4;

          return "$" + (i + offset)
        }).join(", ");

        removedFieldsSql += "and id not in (" + inSql + ")";
      }

      parameters = [form.id, appId, username].concat(remainingFieldIds);

      client.query(removedFieldsSql, parameters, function(err){
        if(err){
          removedFieldsDeferred.reject(err);

          return;
        }

        // For new fields, insert them into fields table
        if(newFields.length) {
          var newFieldsSql = "insert into fields (data, formId) values ";

          var valuesSql = [];

          for (var i = 0; i < newFields.length; i ++) {
            var offset = i * 2;
            valuesSql.push(util.format("($%d, $%d)", offset + 1, offset + 2));
          }

          newFieldsSql += valuesSql.join(", ");

          parameters = newFields.map(function (field) {
            return [field, form.id]
          }).reduce(function (a, b) {
            return a.concat(b)
          });

          client.query(newFieldsSql, parameters, function (err) {
            err ? removedFieldsDeferred.reject(err) : removedFieldsDeferred.resolve();
          });
        }
        else{
          removedFieldsDeferred.resolve();
        }
      });

      // For existing fields, update them
      if(existingFields.length){
        var existingFieldsDeferred = q.defer();
        promises.push(existingFieldsDeferred.promise);

        parameters = [];

        var unions = existingFields.map(function(field, i){
          var id = field.id;

          delete field.id;

          parameters = parameters.concat(id, field, form.id);

          var offset = i * 3;

          return util.format("select row($%d, $%d, $%d)::fields as field", offset + 1, offset + 2, offset + 3);
        }).join(" union all ");

        var existingFieldsSql = util.format(
            "update fields set " +
            "data = (existing).field.data " +
            "from (%s) as existing " +
            "where id = (existing).field.id", unions);

        var existingFieldsQuery = client.query(existingFieldsSql, parameters);

        existingFieldsQuery.on("error", function(err){
          existingFieldsDeferred.reject(err);
        });

        existingFieldsQuery.on("end", function(){
          existingFieldsDeferred.resolve();
        });
      }

      q.all(promises).
        then(function(){
          cb();
        }).
        fail(function(err){
          cb(err);
        }).
        fin(function(){
          done();
        });
    }
  });
};

exports.saveListing = function(appId, listing, username, cb){
  if(listing.id){
    updateExistingListing(appId, listing, cb);
  }
  else{
    createNewListing(appId, listing, cb);
  }

  function updateExistingListing(){
    pg.connect(connectionString, function(err, client, done) {
      if (err) {
        cb(err);

        return;
      }

      var sql = "update listings set " +
                "data = $1 " +
                "where id = $2 " +
                  "and appid = (select id " +
                              "from apps " +
                              "where id = $3 and userid = (select id " +
                                                          "from users " +
                                                          "where email = $4))";

      client.query(sql, [listing, listing.id, appId, username], function(err){
        done();

        cb(err);
      });
    });
  }

  function createNewListing() {
    pg.connect(connectionString, function(err, client, done){
      if(err){
        cb(err);

        return;
      }

      var sql = "insert into listings (id, data, appId) " +
                "values (default, $1, (select id " +
                                      "from apps " +
                                      "where id = $2 and userid = (select id " +
                                                                  "from users " +
                                                                  "where email = $3)))";

      client.query(sql, [listing, appId, username], function(err){
        cb(err);

        done();
      });
    });
  }
};

exports.getListing = function(appId, listingId, username, cb){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      cb(err);

      return;
    }

    var sql = "select id, data " +
              "from listings " +
              "where id = $1 " +
                "and appid = (select id " +
                            "from apps " +
                            "where id = $2 " +
                              "and userid = (select id " +
                                            "from users " +
                                            "where email = $3))";

    client.query(sql, [listingId, appId, username], function(err, result){
      if(err){
        cb(err);

        done();

        return;
      }

      var listing;

      if(result.rowCount){
        var row = result.rows[0];

        listing = row.data;
        listing.id = row.id;

      }

      cb(err, listing);

      done();
    });
  })
};

exports.getNavLinks = function(appId, username, cb){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      cb(err);

      return;
    }

    var navLinks = [];

    var sql = "select id, data " +
              "from navlinks " +
              "where appid = $1 " +
                "and appid = (select id " +
                            "from apps " +
                            "where id = $1 " +
                              "and userid = (select id " +
                                            "from users " +
                                            "where email = $2))";

    var query = client.query(sql, [appId, username]);

    query.on("error", function(err){
      cb(err);

      done();
    });

    query.on("row", function(row){
      var navLink = row.data;

      navLink.id = row.id;

      navLinks.push(navLink);
    });

    query.on("end", function(){
      cb(null, navLinks);

      done();
    });
  });
};

exports.saveNavLink = function(appId, navLink, username, cb){
  var id = navLink.id;

  delete  navLink.id;

  if(id){
    updateNavLink();
  }
  else{
    createNavLink();
  }

  function updateNavLink(){
    pg.connect(connectionString, function(err, client, done){
      if(err){
        cb(err);

        return;
      }

      var sql = "update navlinks set " +
                "data = $1 " +
                "where id = $2 " +
                  "and appid = (select id " +
                              "from apps " +
                              "where id = $3 " +
                                "and userid = (select id " +
                                              "from users " +
                                              "where email = $4));";

      client.query(sql, [navLink, id, appId, username], function(err){
        cb(err, id);

        done();
      });
    });
  }

  function createNavLink(){
    pg.connect(connectionString, function(err, client, done){
      if(err){
        cb(err);

        done();
      }

      var sql = "insert into navlinks (id, data, appid) " +
                "values (default, $1, (select id " +
                            "from apps " +
                            "where id = $2 " +
                              "and userid = (select id " +
                                            "from users " +
                                            "where email = $3)))" +
                "returning id;";

      client.query(sql, [navLink, appId, username], function(err, result){
        if(err){
          cb(err);

          done();

          return;
        }

        var id =result.rows[0].id;

        cb(err, id);

        done();
      });
    });
  }
};

exports.saveNavLinksShowLinks = function(appId, showLinks, username, cb){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      cb(err);

      return;
    }

    var sql = "update apps set " +
              "showlinks = $1 " +
              "where id = $2 " +
                "and userid = (select id " +
                              "from users " +
                              "where email = $3);";

    client.query(sql, [showLinks, appId, username], function(err){
      cb(err);

      done();
    });
  });
};

exports.saveUser = function(appId, user, username, cb){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      cb(err);

      return;
    }

    var sql = "insert into appusers (appid, username, passwordhash, salt) " +
              "values ((select id " +
                      "from apps " +
                      "where id = $1 " +
                      "and userid = (select id " +
                                    "from users " +
                                    "where email = $2)), $3, $4, $5);";

    var salt = crypto.randomBytes(16).toString("hex");

    hasher(user.password, salt, function(err, passwordHash){
      if(err){
        cb(err);

        done();

        return;
      }

      client.query(sql, [appId, username, user.id, passwordHash, salt], function(err){
        cb(err);

        done();
      });
    });
  });
};

exports.getUsers = function(appId, username, cb){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      cb(err);

      return;
    }

    var sql = "select username " +
              "from appusers " +
              "where appid = (select id " +
                            "from apps " +
                            "where id = $1 " +
                              "and userid = (select id " +
                                            "from users " +
                                            "where email = $2))";

    var query = client.query(sql, [appId, username]);

    var users = [];

    query.on("error", function(err){
      cb(err);

      done();
    });

    query.on("row", function(row){
      users.push({ id: row.username });
    });

    query.on("end", function(){
      cb(null, users);

      done();
    });
  });
};

exports.saveRegistration = function(appId, registration, username, cb){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      cb(err);

      return;
    }

    var sql = "update apps set " +
              "registration = $1 " +
              "where id = $2 " +
                "and userid = (select id " +
                              "from users " +
                              "where email = $3)";

    client.query(sql, [registration, appId, username], function(err){
      cb(err);

      done();
    });
  });
};

exports.deployApp = function(appId, username, cb){
  exports.getApp(appId, username, function(err, app){
    if(err){
      cb(err);

      return;
    }

    pg.connect(connectionString, function(err, client, done){
      if(err){
        cb(err);

        return;
      }

      var previouslyDeployed = app.deployed;

      delete app.usersCount;
      delete app.deployed;

      var sql;

      if(previouslyDeployed) {
        sql = "update deployedapps set " +
          "data = $1 " +
          "where appid = $2 " +
          "and appid = (select id " +
          "from apps " +
          "where id = $2 " +
          "and userid = (select id " +
          "from users " +
          "where email = $3));";
      }
      else{
        sql = "insert into deployedapps (data, appid) " +
          "values ($1, (select id " +
          "from apps " +
          "where id = $2 " +
          "and userid = (select id " +
          "from users " +
          "where email = $3)));"
      }

      client.query(sql, [app, appId, username], function(err){
        cb(err);

        done();
      });
    });
  });
};
