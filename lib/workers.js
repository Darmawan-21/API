var path = require('path');
var fs = require('fs');
var _data = require('./data')
var https = require('http')
var http = require('http')
var helpers = require('./helpers')
var url = require('url');
var _log = require ('./log');

var workers = {};


workers.gatherChecks = function(){
    _data.list('checks', function(err,checks){
        if(!err && checks && checks.length > 0){
            checks.forEach(function(check){
                _data.read('checks', check, function(err, checkData){
                    if (!err && checkData){
                        workers.validateCheck(checkData);
                    }else {
                        console.log("error reading check data")
                    }
                })
            })
        }else {
            console.log("Couldnt find any checks")
        }
    })
};

workers.validateCheck = function(checkData){
    checkData.id = checkData.id.trim();
    checkData.userPhone = checkData.userPhone;
    checkData.protocol = checkData.protocol;
    checkData.url = checkData.url.trim();
    checkData.method = checkData.method;
    checkData.successCodes = checkData.successCodes;
    checkData.timeoutSeconds = checkData.timeoutSeconds;
    checkData.state = typeof(checkData.state) == 'string' && ['up','down'].indexOf(checkData.state) > -1 ? checkData.state : 'down';
    checkData.lastChecked = typeof(checkData.lastChecked) == 'number' && checkData.lastChecked > 0 ? checkData.lastChecked : false;
    //console.log(checkData);
    if(checkData.id &&
        checkData.userPhone &&
        checkData.protocol &&
        checkData.url &&
        checkData.method &&
        checkData.successCodes &&
        checkData.timeoutSeconds){
          workers.performCheck(checkData);
        }else {
            console.log("Required data invalid")          
        }


}

workers.performCheck = function (checkData){
    var checkOutcome = {
        'error' : false,
        'responseCode' : false
    }

    var outcomeSent = false;
    var parsedUrl = url.parse(checkData.protocol+'://'+checkData.url, true);
   // console.log(parsedUrl);
    var hostName = parsedUrl.hostname;
   
    var path = parsedUrl.path
    //console.log (hostName + " " + path)

    var requestDetails = {
        'protocol' : checkData.protocol+':',
        'hostname' : hostName,
        'method' : checkData.method.toUpperCase(),
        'path' :path,
        'timeout': checkData.timeoutSeconds * 1000
    };

    var _moduleToUse = checkData.protocol == 'http' ? http : https;
    var req = _moduleToUse.request(requestDetails,function(res){
        // Grab the status of the sent request
        var status =  res.statusCode;
  
        // Update the checkOutcome and pass the data along
        checkOutcome.responseCode = status;
        if(!outcomeSent){
          workers.processCheck(checkData,checkOutcome);
          outcomeSent = true;
        }
    });
  // Bind to the error event so it doesn't get thrown
    req.on('error',function(e){
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {'error' : true, 'value' : e};
        if(!outcomeSent){
          workers.processCheck(checkData,checkOutcome);
          outcomeSent = true;
        }
      });

        // Bind to the timeout event
    req.on('timeout',function(){
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {'error' : true, 'value' : 'timeout'};
        if(!outcomeSent){
        workers.processCheck(checkData,checkOutcome);
        outcomeSent = true;
        }
    });

    req.end();
    
}

workers.processCheck = function(checkData,checkOutcome){

    // Decide if the check is considered up or down
    var state = !checkOutcome.error && checkOutcome.responseCode && checkData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
  
    // Decide if an alert is warranted
    var alertWarranted = checkData.lastChecked && checkData.state !== state ? true : false;
  
    //log the outcome
    var timeOfCheck = Date.now();
    workers.log(checkData,checkOutcome,state,alertWarranted, timeOfCheck);
  
    // Update the check data
    var newCheckData = checkData;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;

    
    // Save the updates
    _data.update('checks',newCheckData.id,newCheckData,function(err){
      if(!err){
        // Send the new check data to the next phase in the process if needed
        if(alertWarranted){
          workers.alertUserToStatusChange(newCheckData);
        } else {
          console.log("Check outcome has not changed, no alert needed");
        }
      } else {
        console.log("Error trying to save updates to one of the checks");
      }
    });
  };
  
  // Alert the user as to a change in their check status
  workers.alertUserToStatusChange = function(newCheckData){
    var msg = 'Alert: Your check for '+newCheckData.method.toUpperCase()+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
    helpers.sendTwilioSms(newCheckData.userPhone,msg,function(err){
      if(!err){
        console.log("Success: User was alerted to a status change in their check, via sms: ",msg);
      } else {
        console.log("Error: Could not send sms alert to user who had a state change in their check",err);
      }
    });
  };


workers.log= function(checkData,checkOutcome,state,alertWarranted, timeOfCheck){
  //form the log data
  var logData = {
    'check':checkData,
    'outcome':checkOutcome,
    'state':state,
    'alert':alertWarranted,
    'time':timeOfCheck
  }

  var logString = JSON.stringify(logData);

  //Write log file
  var logFileName = checkData.id;
  console.log (logFileName)
  _log.append(logFileName, logString, function(err){
    if (!err){
      console.log("Logging to file succeeded")
    }else{
      console.log("logging failed")
    }
  })
};
  
workers.loop = function(){
    setInterval(function(){
        workers.gatherChecks();
    }, 1000 * 60)
}


workers.rotateLogs = function(){
  //list all none compressed log files
  _log.list(false,function(err, logs){
    if(!err && logs && logs.length > 0){
      logs.forEach(function(logName){
        var logId = logName.replace('.log', '');
        var newFileId = logId+'-'+Date.now();
        _log.compress(logId, newFileId, function(err){
          if(!err){
            //truncate the log
            _log.truncate(logId, function(err){
              if(!err){
                console.log('Success truncating')
              }else{
                console.log('Error truncating')
              }
              
            })
          }else{
            console.log('Error compressing log files', err)
          }
        })
      })
    }else{
      console.log('cant find any logs to rotate')
    }
  })
}



workers.logRotationloop = function(){
  setInterval(function(){
      workers.rotateLogs();
  }, 1000 * 60 * 60 * 24)
}
    workers.init = function (){
    // 
    workers.gatherChecks();
    workers.loop()

    //compress all logs
    workers.rotateLogs();

    workers.logRotationloop();
}





module.exports = workers