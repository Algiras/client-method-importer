'use strict';

var Lab = require('lab');
var Code = require('code');
var Nock = require('nock');
var Sinon = require('sinon');
var Joi = require('joi');

var _ = require('lodash');

var lab = exports.lab = Lab.script();

require('rootpath')();
var retrieveMethod = require('lib/builder');

lab.suite('init plugins cached-client-call', function(){
  lab.suite('retrieveMethod', function(){
    var config = {
        host : 'localhost',
        port : 3003
      },
      options = {
        name : 'getPuppies',
        useConfig : {
          host : 'localhost',
          port : 3003
        },
        route : '/puppies',
        method : 'GET',
        protocol : 'http',
        cache : {
          expiresIn: 1000 * 60 * 60 * 24,
          generateTimeout : 1000
        },
        validation : {
          request : Joi.any(),
          response : Joi.any()
        },
        pre : function(data, preCB){ preCB(null, data); },
        pos : function(data, posCB){ posCB(null, data); }

      };

    lab.test('should have a method get', function(done){
      Code.expect(retrieveMethod.buildMethod).to.be.function();
      done();
    });

    lab.test('should return a function', function(done){
      Code.expect(retrieveMethod.buildMethod(config, options)).to.be.function();
      done();
    });

    lab.test('should call requested service, with requested method on requested path', function(done){
      var spy = Sinon.spy();
      var mockResponse = {a : 1};

      Nock('http://localhost:3003').get('/puppies').reply(200, mockResponse);

      retrieveMethod.buildMethod(config, options)(null, spy);
      setTimeout(function(){
        Code.expect(spy.calledWith(null, mockResponse)).to.be.true();
        done();
      }, 100);
    });

    lab.test('should work with POST', function(done){
      var spy = Sinon.spy();
      var mockResponse = {a : 1};

      var postOptions = _.extend({}, options, {method : 'POST'});

      Nock('http://localhost:3003').post('/puppies').reply(200, mockResponse);

      retrieveMethod.buildMethod(config, postOptions)(null, spy);
      setTimeout(function(){
        Code.expect(spy.calledWith(null, mockResponse)).to.be.true();
        done();
      }, 100);
    });

    lab.suite('validation', function(){
      lab.test('should return an error if on request validation fails', function(done) {
        var validationOptions = _.extend({}, options, {validation: {request: {is: Joi.number().min(1).required()}}});

        retrieveMethod.buildMethod(config, validationOptions)({is: 0}, function (err) {
          Code.expect(err.isJoi).to.be.true();
          done();
        });
      });

      lab.test('should return an error if on response validation fails', function(done) {
        var validationOptions = _.extend({}, options, {validation: {response: {is: Joi.number().max(1).required()}}});
        var spy = Sinon.spy();

        Nock('http://localhost:3003').get('/puppies').reply(200, {is : 2});

        retrieveMethod.buildMethod(config, validationOptions)({}, function (err) {
          Code.expect(err.isJoi).to.be.true();
          spy();
        });

        setTimeout(function(){
          Code.expect(spy.called).to.be.true();
          done();
        }, 100);
      });
    });

    lab.suite('pre/pos methods', function(){

      lab.test('should pre-process request if pre method is specified', function(done){
        var spy = Sinon.spy();
        var mockResponse = {a : 1};

        var postOptions = _.extend({}, options, {pre : function(query, posCB){ query.is++; posCB(null, query);}});

        Nock('http://localhost:3003').get('/puppies').query({is : 2}).reply(200, mockResponse);

        retrieveMethod.buildMethod(config, postOptions)({is : 1}, spy);
        setTimeout(function(){
          Code.expect(spy.calledWith(null, mockResponse)).to.be.true();
          done();
        }, 100);
      });

      lab.test('should post-process request if post method is specified', function(done){
        var spy = Sinon.spy();
        var mockResponse = {a : 1};

        var postOptions = _.extend({}, options, {pos : function(res, posCB){ res.a++; posCB(null, res);}});

        Nock('http://localhost:3003').get('/puppies').reply(200, mockResponse);

        retrieveMethod.buildMethod(config, postOptions)(null, spy);
        setTimeout(function(){
          Code.expect(spy.calledWith(null, {a : 2})).to.be.true();
          done();
        }, 100);
      });
    });

    lab.suite('error responses', function(){

      lab.test('should call requested service and handle the error', function(done){
        var spy = Sinon.spy();
        var mockResponse = new Error({ statusCode : 500, message : 'Bad Request'});

        Nock('http://localhost:3003').get('/puppies').reply(500, mockResponse);

        retrieveMethod.buildMethod(config, options)(null, spy);
        setTimeout(function(){
          Code.expect(spy.calledWith(mockResponse)).to.be.true();
          done();
        }, 100);
      });


      lab.test('should call requested service, with requested method on requested path', function(done){
        var spy = Sinon.spy();
        var mockResponse = new Error({ statusCode : 500, message : 'Bad Request'});

        Nock('http://localhost:3003').get('/puppies').replyWithError(mockResponse);

        retrieveMethod.buildMethod(config, options)(null, spy);
        setTimeout(function(){
          Code.expect(spy.calledWith(mockResponse)).to.be.true();
          done();
        }, 100);
      });
    });
  });
});
