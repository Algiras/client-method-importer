'use strict';

var Url = require('url');
var request = require('request');
var async = require('async');
var Joi = require('joi');
var _ = require('lodash');


var defaultValidationOptions = {
  abortEarly : false,
  stripUnknown : true,
  convert : true
};

module.exports.buildMethod = function(config, options){
  return function(query, response){
    async.waterfall([
      async.apply(Joi.validate, query, _.get(options, 'validation.request', Joi.any()), defaultValidationOptions),
      _.get(options, 'pre', function(validQuery, preCB){ preCB(null, validQuery);}),
      function(validQuery, requestCB){
        var actionUrl = Url.format({
          protocol : options.protocol,
          hostname : config.host,
          port : config.port,
          pathname : options.route,
          query : options.method === 'GET' ? validQuery : undefined
        });

        return request({
          method: options.method,
          uri: actionUrl,
          postData : options.method === 'POST' ? validQuery : undefined
        },
          function(err, httpResponse, body){
            if (err){
              requestCB(err);
            } else if (httpResponse.statusCode >= 400){
              requestCB(new Error(body));
            } else {
              requestCB(null, JSON.parse(body));
            }
          });
      },
      function(reqResponse, validationCB){
        Joi.validate(reqResponse, _.get(options, 'validation.response', Joi.any()), defaultValidationOptions, validationCB);
      },
      _.get(options, 'pos', function(responseObj, preCB){ preCB(null, responseObj);})
    ], response);
  };
};
