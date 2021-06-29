//Dependancies
var _data = require ('./data');
var helpers = require ('./helpers');
var config = require ('../config');




//define handlers
var handlers = {};
handlers.users = function(data,callback){
    var methods = ['post', 'get', 'put', 'delete'];
    if (methods.indexOf(data.method) > -1){
        handlers._users[data.method](data,callback);
    }else{
        callback(405);
    }
}



handlers._users ={};
handlers._users.post = function(data,callback){
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length <= 12 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var street = data.payload.street;
    var email = data.payload.email;
   var validEmail = helpers.validateEmail(email)
   console.log(data.payload.email);

    if (validEmail){
        _data.read('users',email , function(err,data){
            if (err){
                var hashedPass = helpers.hash(password);

                if (hashedPass){
                    var userObj = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'password' : hashedPass,
                        'street': street,
                        'email':email
                    };
    
                    _data.create('users', email, userObj, function(err){
                        if(!err){
                            callback(200);
                           // console.log('nyampe')
                        }else {
                            callback(500, {'error' : 'failed creating users'});
                          
                        }
                    })
                } else{
                    callback (500,{'Error' : "Couldn't hash passworld"})
                }
               
                
            }else{
                callback(400, {'error' : 'user with email exists'})
                console.log("mentok sini")
            }

        })
    }else{
        callback(400,{'error' : 'Missing requires field'})
    }
    
};

handlers._users.get = function(data,callback){
   var email= data.queryStringObject.email;
   if (email){

    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verify(token,phone, function(valid){
        if(valid){
            _data.read('users', phone, function(err,data){
                if(!err && data){
                   // remove hash password
                   delete data.password;
                   callback (200,data);
                }else{
                    callback (404);
                }
            })
        }else{
            callback(403, {"error" : "Missing or invalid token"})
        }
    })
  
   }else{
       callback (400, {'error' : 'Missing required'})
   }
};

// @TODO Only let an authenticated user up their object. Dont let them access update elses.
handlers._users.put = function(data,callback){
  var email= data.payload.email; 
 // console.log(phone);
    // Check for optional fields
  
    
    if (email){ 
        var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
        if (password){
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            handlers._tokens.verify(token,email, function(valid){
                if(valid){
                    _data.read('users', email, function(err,userData){
                        if (!err &&userData){
                            var hashPassword = helpers.hash(password);
                            if(userData.password == hashPassword){
                                var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
                                var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
                                var newPass =  typeof(data.payload.newPass) == 'string' && data.payload.newPass.trim().length > 0 ? data.payload.newPass.trim() : false;
                                var street =  typeof(data.payload.street) == 'string' && data.payload.street.trim().length > 0 ? data.payload.street.trim() : false;
                                if(firstName ||lastName ||newPass){
                                    if (firstName){
                                        userData.firstName = firstName
                                    };
                                    if(lastName){
                                        userData.lastName = lastName;
                                    }
                                    if(newPass){
                                        hashNew = helpers.hash(newPass)
                                        userData.password = hashNew;
                                    }
                                    if(street){
                                      userData.street = street;
                                  }

        
                                }
                              
                                 
                                _data.update ('users', email, userData , function(err){
                                    if(!err){
                                        callback(200);
                                    }else{
                                        callback(500, {'error' : 'error update data'})
                                    };
                                })
        
                            }else{
                                callback (400, {'error' : 'password is wrong'})
                            }
                        }else {
                            callback(400, {'error' : "Missing password"})
                        }
                    })
                }else{
                    callback(403, {"error" : "Missing or invalid token"})
                }
            })
       

        }else {
            callback(400 , {'error' : "data false"})
        }

    }else {
        callback(400 , {'error' : "Phone not found"})
    }
};

handlers._users.delete = function(data,callback){
  var email= data.queryStringObject.email; 
    if (email){
       // console.log(em);
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verify(token,phone, function(valid){
            if(valid){
                _data.read('users', phone, function(err,data){
                    if(!err && data){   
                      _data.delete('users', phone, function(err){
                          if(!err){
                              callback (200);
                          }else {
                              callback (500,{'error' : 'Could not delete'})
                          }
                      })
                    }else{
                        callback (404);
                    }
                })
            }else{
                callback(403, {"error" : "Missing or invalid token"})
            }
        })

    }else{
        callback (400, {'error' : 'Missing required'})
    }
};

handlers.ping=function(data,callback){
    callback(200);
}
handlers.hello = function(data, callback){
   callback(406, {"message" : "hello world, my name is Iki"});
}

// not found handler
handlers.notFound = function(data,callback){
    callback(404);
};





handlers.tokens = function(data,callback){
    var methods = ['post', 'get', 'put', 'delete'];
    if (methods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data,callback);
    }else{
        callback(405);
    }
}


handlers._tokens = {};


handlers._tokens.post = function(data, callback){
  var email= data.payload.email; 
    
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  console.log(email,password)
    if (email && password){
        _data.read ('users', email, function (err, userData){
            if (!err && data){
                var hashpass = helpers.hash(password)
                if (email == userData.email  && hashpass == userData.password){
                    var id = helpers.createRandom(10);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        'id' : id,
                        'email' : email,
                        'expires' : expires
                    }
                    
                    console.log (tokenObject);
                    _data.create('tokens', id, tokenObject , function (err){
                        if (!err){
                            callback(200, tokenObject)
                            }else{
                                callback (500, {'error' : 'Failed creating users'})
                            }
                        });
                }else {
                    callback (400, {'error' : 'Password may incorrect'}) 
                }

            }else {

                callback (404, {'error' : 'user not found'})
            }
        })

     



    }else {
        callback(400, {'error' : 'Missing Required Field'})
    }

}

handlers._tokens.get = function(data, callback){
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 10 ? data.queryStringObject.id.trim() : false;
    if(id){
        _data.read('tokens', id, function(err,tokensData){
            if(!err && tokensData){
                callback (200, tokensData)
            }else {
                callback(404, {"error" : "id not found"})
            }
        })
    }else {
        callback(400, {"error" : "Missing require"})
    }
}

handlers._tokens.put = function(data, callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 10 ? data.payload.id.trim() : false;
    if(id){
        _data.read('tokens', id, function(err,tokensData){
            if(!err && tokensData){
                 if(tokensData.expires > Date.now()){
                     tokensData.expires = Date.now() + 1000 * 60 * 60;
                     _data.update('tokens', id, tokensData, function(err){
                         if(!err){
                             callback(200)
                         }else {
                             callback (500, {"error" : "failed update expired token"})
                         }
                     })
                 }else {
                     callback (400, {"error" : "token already expired"})
                 }
               }else {
                callback(404, {"error" : "id not found"})
            }
        })
    }else{
        callback(400, {"error" : "Missing require"})
    }

}

handlers._tokens.delete = function(data,callback){
    // Check that id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
      // Lookup the token
      _data.read('tokens',id,function(err,tokenData){
        if(!err && tokenData){
          // Delete the token
          _data.delete('tokens',id,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not delete the specified token'});
            }
          });
        } else {
          callback(400,{'Error' : 'Could not find the specified token.'});
        }
      });
    } else {
      callback(400,{'Error' : 'Missing required field'})
    }
  };


  handlers._tokens.verify = function(id, email,callback){
    _data.read('tokens', id, function(err,tokenData){
        if(!err && tokenData){
            if(tokenData.email == email && tokenData.expires > Date.now()){
                callback(true),'nyampe sini doang';
              } else {
                callback(false);
              }
        }else{
            callback(false)
        }
    })
}

handlers.checks = function(data,callback){
    var methods = ['post', 'get', 'put', 'delete'];
    if (methods.indexOf(data.method) > -1){
        handlers._checks[data.method](data,callback);
    }else{
        callback(405);
    }
}

handlers._checks = {};

handlers._checks.post = function(data,callback){
    // Validate inputs
    var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
    if(protocol && url && method && successCodes && timeoutSeconds){
  
      // Get token from headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  
      // Lookup the user phone by reading the token
      _data.read('tokens',token,function(err,tokenData){
        if(!err && tokenData){
          var email = tokenData.email;
  
          // Lookup the user data
          _data.read('users',email,function(err,userData){
            if(!err && userData){
              var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
              // Verify that user has less than the number of max-checks per user
              if(userChecks.length < config.maxChecks){
                // Create random id for check
                var checkId = helpers.createRandom(10);
  
                // Create check object including userPhone
                var checkObject = {
                  'id' : checkId,
                  'email' : email,
                  'protocol' : protocol,
                  'url' : url,
                  'method' : method,
                  'successCodes' : successCodes,
                  'timeoutSeconds' : timeoutSeconds
                };
  
                // Save the object
                _data.create('checks',checkId,checkObject,function(err){
                  if(!err){
                    // Add check id to the user's object
                    userData.checks = userChecks;
                    userData.checks.push(checkId);
  
                    // Save the new user data
                    _data.update('users',email,userData,function(err){
                      if(!err){
                        // Return the data about the new check
                        callback(200,checkObject);
                      } else {
                        callback(500,{'Error' : 'Could not update the user with the new check.'});
                      }
                    });
                  } else {
                    callback(500,{'Error' : 'Could not create the new check'});
                  }
                });  
              } else {
                callback(400,{'Error' : 'The user already has the maximum number of checks ('+config.maxChecks+').'})
              }

            } else {
              callback(403);
            }
          });
  
        } else {
          callback(403);
        }
      });
    } else {
      callback(400,{'Error' : 'Missing required inputs, or inputs are invalid'});
    }
  };


  handlers._checks.get = function(data,callback){
    // Check that id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 10 ? data.queryStringObject.id.trim() : false;
    console.log(id);
    if(id){
      // Lookup the check
      _data.read('checks',id,function(err,checkData){
        if(!err && checkData){
          // Get the token that sent the request
          var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          console.log("This is check data",checkData);
          handlers._tokens.verify(token,checkData.userPhone,function(tokenIsValid){
            if(tokenIsValid){
              // Return check data
              callback(200,checkData);
            } else {
              callback(403);
            }
          });
        } else {
          callback(404);
        }
      });
    } else {
      callback(400,{'Error' : 'Missing required field, or field invalid'})
    }
  };
  
  // Checks - put
  // Required data: id
  // Optional data: protocol,url,method,successCodes,timeoutSeconds (one must be sent)
  handlers._checks.put = function(data,callback){
    // Check for required field
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 10 ? data.payload.id.trim() : false;
  
    // Check for optional fields
    var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  
    // Error if id is invalid
    if(id){
      // Error if nothing is sent to update
      if(protocol || url || method || successCodes || timeoutSeconds){
        // Lookup the check
        _data.read('checks',id,function(err,checkData){
          if(!err && checkData){
            // Get the token that sent the request
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // Verify that the given token is valid and belongs to the user who created the check
            handlers._tokens.verify(token,checkData.userPhone,function(tokenIsValid){
              if(tokenIsValid){
                // Update check data where necessary
                if(protocol){
                  checkData.protocol = protocol;
                }
                if(url){
                  checkData.url = url;
                }
                if(method){
                  checkData.method = method;
                }
                if(successCodes){
                  checkData.successCodes = successCodes;
                }
                if(timeoutSeconds){
                  checkData.timeoutSeconds = timeoutSeconds;
                }
  
                // Store the new updates
                _data.update('checks',id,checkData,function(err){
                  if(!err){
                    callback(200);
                  } else {
                    callback(500,{'Error' : 'Could not update the check.'});
                  }
                });
              } else {
                callback(403);
              }
            });
          } else {
            callback(400,{'Error' : 'Check ID did not exist.'});
          }
        });
      } else {
        callback(400,{'Error' : 'Missing fields to update.'});
      }
    } else {
      callback(400,{'Error' : 'Missing required field.'});
    }
  };
  
    handlers._checks.delete = function(data,callback){
    // Check that id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 10 ? data.queryStringObject.id.trim() : false;
    if(id){
      // Lookup the check
      _data.read('checks',id,function(err,checkData){
        if(!err && checkData){
          // Get the token that sent the request
          var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verify(token,checkData.userPhone,function(tokenIsValid){
            if(tokenIsValid){
  
              // Delete the check data
              _data.delete('checks',id,function(err){
                if(!err){
                  // Lookup the user's object to get all their checks
                  _data.read('users',checkData.userPhone,function(err,userData){
                    if(!err){
                      var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
  
                      // Remove the deleted check from their list of checks
                      var checkPosition = userChecks.indexOf(id);
                      if(checkPosition > -1){
                        userChecks.splice(checkPosition,1);
                        // Re-save the user's data
                        userData.checks = userChecks;
                        _data.update('users',checkData.userPhone,userData,function(err){
                          if(!err){
                            callback(200);
                          } else {
                            callback(500,{'Error' : 'Could not update the user.'});
                          }
                        });
                      } else {
                        callback(500,{"Error" : "Could not find the check on the user's object, so could not remove it."});
                      }
                    } else {
                      callback(500,{"Error" : "Could not find the user who created the check, so could not remove the check from the list of checks on their user object."});
                    }
                  });
                } else {
                  callback(500,{"Error" : "Could not delete the check data."})
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400,{"Error" : "The check ID specified could not be found"});
        }
      });
    } else {
      callback(400,{"Error" : "Missing valid id"});
    }
  };

    // Checks - put
  // Required data: id
  // Optional data: protocol,url,method,successCodes,timeoutSeconds (one must be sent)
  handlers._checks.put = function(data,callback){
    // Check for required field
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 10 ? data.payload.id.trim() : false;
  
    // Check for optional fields
    var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  
    // Error if id is invalid
    if(id){
      // Error if nothing is sent to update
      if(protocol || url || method || successCodes || timeoutSeconds){
        // Lookup the check
        _data.read('checks',id,function(err,checkData){
          if(!err && checkData){
            // Get the token that sent the request
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // Verify that the given token is valid and belongs to the user who created the check
            handlers._tokens.verify(token,checkData.userPhone,function(tokenIsValid){
              if(tokenIsValid){
                // Update check data where necessary
                if(protocol){
                  checkData.protocol = protocol;
                }
                if(url){
                  checkData.url = url;
                }
                if(method){
                  checkData.method = method;
                }
                if(successCodes){
                  checkData.successCodes = successCodes;
                }
                if(timeoutSeconds){
                  checkData.timeoutSeconds = timeoutSeconds;
                }
  
                // Store the new updates
                _data.update('checks',id,checkData,function(err){
                  if(!err){
                    callback(200);
                  } else {
                    callback(500,{'Error' : 'Could not update the check.'});
                  }
                });
              } else {
                callback(403);
              }
            });
          } else {
            callback(400,{'Error' : 'Check ID did not exist.'});
          }
        });
      } else {
        callback(400,{'Error' : 'Missing fields to update.'});
      }
    } else {
      callback(400,{'Error' : 'Missing required field.'});
    }
  };
  
    handlers._checks.delete = function(data,callback){
    // Check that id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 10 ? data.queryStringObject.id.trim() : false;
    if(id){
      // Lookup the check
      _data.read('checks',id,function(err,checkData){
        if(!err && checkData){
          // Get the token that sent the request
          var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verify(token,checkData.userPhone,function(tokenIsValid){
            if(tokenIsValid){
  
              // Delete the check data
              _data.delete('checks',id,function(err){
                if(!err){
                  // Lookup the user's object to get all their checks
                  _data.read('users',checkData.userPhone,function(err,userData){
                    if(!err){
                      var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
  
                      // Remove the deleted check from their list of checks
                      var checkPosition = userChecks.indexOf(id);
                      if(checkPosition > -1){
                        userChecks.splice(checkPosition,1);
                        // Re-save the user's data
                        userData.checks = userChecks;
                        _data.update('users',checkData.userPhone,userData,function(err){
                          if(!err){
                            callback(200);
                          } else {
                            callback(500,{'Error' : 'Could not update the user.'});
                          }
                        });
                      } else {
                        callback(500,{"Error" : "Could not find the check on the user's object, so could not remove it."});
                      }
                    } else {
                      callback(500,{"Error" : "Could not find the user who created the check, so could not remove the check from the list of checks on their user object."});
                    }
                  });
                } else {
                  callback(500,{"Error" : "Could not delete the check data."})
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400,{"Error" : "The check ID specified could not be found"});
        }
      });
    } else {
      callback(400,{"Error" : "Missing valid id"});
    }
  };


  handlers.register = function(data,callback){
    var methods = ['post'];
    if (methods.indexOf(data.method) > -1){
        handlers._register[data.method](data,callback);
    }else{
        callback(405);
    }
}

handlers._register = {};

handlers._register.post = function(data,callback){
  console.log(data.payload)
  if(data){
    handlers._users.post(data, function(err, msg){
      if(err){
        callback(err,msg)
      }else{
        callback('Error register user')
      }
    })

  }else {
    callback(400)
  }
  
}

handlers.login = function(data,callback){
  var methods = ['post','delete'];
  if (methods.indexOf(data.method) > -1){
      handlers._login[data.method](data,callback);
  }else{
      callback(405);
  }
}


handlers._login = {}

handlers._login.post = function(data, callback){
  var reqToken = data.payload.reqToken;
  var email = data.payload.email;
 var cart = data.payload.cart;
  var order = data.payload.order;
  var token = data.headers.token;
  var password = data.payload.password;
  var edit = data.payload.edit;

  console.log(email,password,order,edit,token)
 //creating token
  if(email && password &&reqToken && reqToken === true ){
    handlers._tokens.post(data, function(err,msg){
      if(err){
        callback(err,msg)
      }
    })
  }
  
  //edit account
  
  else if(email && password && token && edit && edit === true){
   
    handlers._users.put(data,function(err,msg){
      if(err){
        callback(err,msg)
      }
    })

   
  }

 //order
  else if(email && password && token &&  cart && order && order === true ){
    console.log('masuk');
    handlers._tokens.verify(token,email,function(valid){  
      if(valid){
        _data.read('cart', email, function(err,userCart){
          if(err){ 
            _data.read('cart','ListProduct',function(err, productList){
              if(!err){

                var cartObj = {
                  "item" : []
                }
                var x = productList.list;
                var neww = {}
                cart.forEach(e =>{
                  x.forEach(c => {
                    if(e.id === c.id){
                      neww = {
                        "id" : c.id,  
                        "name" :c.name,
                        "qty":e.qty,
                        "price":c.price,
                      }
                      cartObj.item.push(neww)                    
                    }
                  })
                })

                _data.create('cart',email,cartObj,function(err){
                  if(!err){
                    callback(200, 'Success add item to cart')
                  }else{
                    callback(400, 'error adding item')
                  }
                  console.log('nyampe sini 1');
    
                })
              }
            })
          
  
          }else{
            _data.read('cart','ListProduct',function(err, productList){
              if(!err){
                var x = productList.list;
                var y = []
                var neww = {}
                cart.forEach(e =>{
                  x.forEach(c => {
                    if(e.id === c.id){
                      neww = {
                        "id" : c.id,  
                        "name" :c.name,
                        "qty":e.qty,
                        "price":c.price,
                      }
                      y.push(neww)                    
                    }
                  })
                })
              //  console.log(y)

                var newCart = {"item" : []};
                var old = {};
          
                var index = [];
                for(var i = 0; i< userCart.item.length; i++){
                  for(var j =0 ; j<y.length;j++){
                    if(userCart.item[i].id === y[j].id){
                            old = {
                        "id" :y[j].id,
                        "name":y[j].name,
                        "qty":y[j].qty +userCart.item[i].qty,
                        "price": Math.floor((y[j].qty+userCart.item[i].qty)*y[j].price*100)/100
                      }
                      index.push(j)
                      newCart.item.push(old)
                    }
                  }
                }
                
                for (var i =index.length -1; i >= 0; i--)
                y.splice(index[i],1);
                y.forEach(e=> newCart.item.push(e))
               
               console.log(newCart)
                // newCart = userCart;

                // cart.forEach(e => newCart.item.push(e))
                _data.update('cart',email,newCart, function(err){
                  if(!err){
                    callback(200,'Success update cart')
                  }else{
                    callback(400,'failed update cart')
                  }
                  console.log('nyampe sini 2')
                })
                
              }
            })
              }
            })
            //var rest = [dataRest];
            //console.log(rest);
           
      }else{
        callback(400,"token not found")
      }
    })

  }

  else {
    callback(404)
  }
}

handlers.listProduct = function(callback){
  _data.read('cart','ListProduct',function(err,dataList){
    if(!err){
      callback (dataList)
    }
  })
}
  

  



  
module.exports = handlers;
//1617768434937