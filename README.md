# Client-method-importer
Library to plugin another service and not lose your mind

```javascript
server.register({
    register : require('client-method-importer'),
    options : {
      methods : [{
        name: 'getPuppies', // this name is used to call the method
        useConfig: {
            host: 'localhost',
            port: 3000
        },
        route: '/getPuppies',
        method: 'GET',
        protocol: 'http',
        cache: {
          expiresIn: 1000 * 60 * 60 * 24,
          generateTimeout : 1000
        },
        validation : {
          request : Joi.any(),
          response : Joi.any()
        },
        pre : function(data, preCB){ preCB(null, data); },
        pos : function(data, posCB){ posCB(null, data); }
      }],
      validationOption : {
        abortEarly : false,
        stripUnknown : true,
        convert : true
      }
    }
  }, function(err){
    if(err) {
        throw error;
    }
});
```

You can then access this from request:
```javascript
server.route({
    method : 'GET',
    path: '/',
    handler: function(req, res){
      req.server.methods.getPuppies({}, function(err, resp){
        if(err) res(err.message);
        res(resp);
      });
    }
  });
```
