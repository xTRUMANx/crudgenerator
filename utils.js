var toString = Object.prototype.toString;

function forEach(obj, iterator, context) {
  var key;
  if (obj) {
    if (exports.isFunction(obj)){
      for (key in obj) {
        if (key != 'prototype' && key != 'length' && key != 'name' && obj.hasOwnProperty(key)) {
          iterator.call(context, obj[key], key);
        }
      }
    } else if (obj.forEach && obj.forEach !== forEach) {
      obj.forEach(iterator, context);
    } else if (exports.isArrayLike(obj)) {
      for (key = 0; key < obj.length; key++)
        iterator.call(context, obj[key], key);
    } else {
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          iterator.call(context, obj[key], key);
        }
      }
    }
  }
  return obj;
}

exports.extend = function(dst) {
  forEach(arguments, function(obj){
    if (obj !== dst) {
      forEach(obj, function(value, key){
        dst[key] = value;
      });
    }
  });

  return dst;
};

exports.isArray = function(value) {
  return toString.apply(value) == '[object Array]';
};

exports.isDate = function(value){
  return toString.apply(value) == '[object Date]';
};

exports.isObject = function(value){return value != null && typeof value == 'object';};

exports.isRegExp = function(value) {
  return toString.apply(value) == '[object RegExp]';
};

exports.isFunction = function(value){return typeof value == 'function';};

exports.isArrayLike = function (obj) {
  if (obj == null) {
    return false;
  }

  var length = obj.length;

  if (obj.nodeType === 1 && length) {
    return true;
  }

  return exports.isString(obj) || exports.isArray(obj) || length === 0 ||
    typeof length === 'number' && length > 0 && (length - 1) in obj;
};

exports.isString = function (value){return typeof value == 'string';};

exports.copy = function (source, destination){
  if (!destination) {
    destination = source;
    if (source) {
      if (exports.isArray(source)) {
        destination = exports.copy(source, []);
      } else if (exports.isDate(source)) {
        destination = new Date(source.getTime());
      } else if (exports.isRegExp(source)) {
        destination = new RegExp(source.source);
      } else if (exports.isObject(source)) {
        destination = exports.copy(source, {});
      }
    }
  } else {
    if (source === destination) throw Error("Can't copy! Source and destination are identical.");
    if (exports.isArray(source)) {
      destination.length = 0;
      for ( var i = 0; i < source.length; i++) {
        destination.push(exports.copy(source[i]));
      }
    } else {
      forEach(destination, function(value, key){
        delete destination[key];
      });
      for ( var key in source) {
        destination[key] = exports.copy(source[key]);
      }
    }
  }
  return destination;
};

