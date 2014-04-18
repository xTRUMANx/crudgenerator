var fs = require("fs"),
  gulp = require("gulp"),
  concat = require("gulp-concat"),
  uglify = require("gulp-uglify"),
  rename = require("gulp-rename");

gulp.task("angularscripts", function(cb){
  fs.readdir("public/js/app", function(err, files){
    if(err) cb(err);

    var appModuleFileName = "AppModule.js";

    files.sort().slice(files.indexOf(appModuleFileName), 1);

    files.unshift(appModuleFileName);

    files = files.map(function(file){
      return "./public/js/app/" + file;
    });

    gulp.src(files).
      pipe(concat("app.js")).
      pipe(gulp.dest("./public/js")).
      pipe(rename("app.min.js")).
      pipe(uglify()).
      pipe(gulp.dest("./public/js"));

    cb(null);
  });
});

gulp.task("watch", function(){
  gulp.watch("public/js/app/*.js", ["angularscripts"]);
});

gulp.task("bundle", ["angularscripts"], function(){
  var files = ["jquery-2.0.3.min.js", "bootstrap.min.js", "angular.min.js", "angular-route.min.js", "checklist-model.min.js", "app.min.js"];

  files = files.map(function(file){ return "./public/js/" + file; });

  gulp.src(files).
    pipe(concat("bundle.min.js")).
    pipe(gulp.dest("./public/js"));
});

gulp.task("default", ["bundle", "watch"]);
