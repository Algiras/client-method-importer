'use strict';

var Hoek = require('hoek');
var Joi = require('joi');

var builder = require('./builder');

var internals = {
  defaults: {
    method : {
      method: 'GET',
      protocol: 'http'
    },
    config : {
      methods : [],
      validationOption : {
        abortEarly : false,
        stripUnknown : true,
        convert : true
      }
    }
  },
  options: Joi.object().keys({
    methods: Joi.array().items(Joi.object({
      name: Joi.string().min(3).required(),
      useConfig: Joi.object({
        host : Joi.string().min(3).required(),
        port : Joi.number().positive().min(1).default(80)
      }).required(),
      route: Joi.string().min(1).required(),
      method: Joi.string().valid(['GET', 'POST']),
      protocol: Joi.string().valid(['http', 'https']),
      cache: Joi.object().keys({
        expiresIn: Joi.number().positive().integer().min(1),
        expiresAt: Joi.string(),
        staleIn: Joi.number().positive(),
        staleTimeout: Joi.number().positive(),
        generateTimeout: Joi.number().positive()
      }).with('expiresIn', 'generateTimeout').with('expiresAt', 'generateTimeout').optional(),
      validation : Joi.object().keys({
        request : Joi.any(),
        response : Joi.any()
      }).optional(),
      pre : Joi.func().arity(2).optional(),
      pos : Joi.func().arity(2).optional()
    })).required(),
    validationOption : {
      abortEarly : Joi.boolean().default(false),
      stripUnknown : Joi.boolean().default(true),
      convert : Joi.boolean().default(true)
    }
  })
};

exports.register = function (server, options, next) {
  var result;
  var internalConfig = Hoek.clone(internals.defaults.config);
  Hoek.merge(internalConfig, options);

  var validateOptions = internals.options.validate(options);

  if (validateOptions.error) {
    result = next(validateOptions.error);
  } else {
    options.methods.forEach(function(methodOption){
      var settings = Hoek.clone(internals.defaults.method);
      Hoek.merge(settings, methodOption);

      var prebuildRequestFunc = builder.buildMethod(settings.useConfig, settings);

      server.method(settings.name, prebuildRequestFunc, {
        cache: settings.cache,
        generateKey: function (query) {
          return JSON.stringify(query);
        }
      });
    });

    result = next();
  }
  return result;
};

exports.register.attributes = {
  pkg: require('../package.json')
};
