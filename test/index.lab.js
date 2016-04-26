'use strict';

var Lab = require('lab');
var Code = require('code');
var Nock = require('nock');

var Hapi = require('hapi');

var lab = exports.lab = Lab.script();

require('rootpath')();
var clientMethodImporter = require('lib');


// Plugin integration example
lab.suite('init plugins client-method-importer', function() {
  lab.suite('index', function(){
    var server;

    var config = {
      methods : [{
        name : 'getPuppies',
        useConfig : {
          host: 'localhost',
          port: 3003
        },
        route : '/getPuppies',
        method : 'GET',
        protocol : 'http',
        cache : {
          expiresIn: 30 * 1000,
          generateTimeout : 200
        }
      }]
    };


    lab.test('should fail on empty options', function(done){
      server = new Hapi.Server({ debug: false });
      server.register([{
        register : clientMethodImporter,
        options : {}
      }], function(err){
        Code.expect(err).to.be.not.undefined();
        done();
      });
    });

    lab.suite('integration', function(){
      lab.before(function(done){
        server = new Hapi.Server({ debug: false });
        server.connection();

        server.register([{
          register : clientMethodImporter,
          options : config
        }], function(){
          server.start(function(){
            done();
          });
        });
      });

      lab.after(function(done){
        server.stop({}, function(){
          done();
        });
      });


      lab.test('should have a server method getPuppies', function(done){
        Code.expect(server.methods.getPuppies).to.not.be.undefined();
        done();
      });

      lab.test('should call puppies-api on getPuppies method', function(done){
        var sampleData = {a : 1};

        Nock('http://localhost:3003').get('/getPuppies').reply(200, sampleData);
        server.methods.getPuppies({}, function(error, data){
          Code.expect(data).to.deep.equal(sampleData);
          done();
        });
      });
    });
  });
});
