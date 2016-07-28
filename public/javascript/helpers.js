"use strict";

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

String.prototype.stripSpecialChars = function() {
  var res = this.replaceAll('&nbsp;','')
  res = res.replace(/(\n|\r|[^ a-zA-Z0-9])/g,'');
  res = res.replace(/ +/,' ');
  return res.trim();
}

String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

function isValidValue(n) {
  return !isNaN(parseFloat(n)) && isFinite(n) && (n >= 0);
}

function isValidQuantity(n) {
  return Number.isInteger(n) && (n > 0);
}

function shortenName(name)
{
  if (name.indexOf(' ') === -1)
    return name;
  else
    return name.substr(0, name.indexOf(' '));
}

function deepClone(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null === obj || "object" != typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = deepClone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object)
  {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = deepClone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy obj, its type or the type of objects it contains is not supported.");
}