// helpers cuy

var crypto = require('crypto');
var config = require ('../config')
var querystring = require('querystring')
const https = require('https');


var helpers = {};

helpers.hash = function (data){
    if(typeof(data)== 'string' && data.length > 0){
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(data).digest('hex');
        return hash;
    }else {
        return false;
    }
} 

helpers.parseJsonToObject = function(str){
    try{
        var obj = JSON.parse(str);
        return obj;
    }catch(e){
        return {};
    }
}

helpers.createRandom = function(length){
    if (typeof(length) == 'number' && length !== 0){
        var allCharacter = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var str = '';
        for (i = 1 ; i <= length ; i ++){
         var randomStrings = allCharacter.charAt(Math.floor(Math.random() * allCharacter.length));
         str += randomStrings;
         }
         return str;
    }else {
        return false;
    }
    
}

helpers.sendTwilioSms = function(phone,msg,callback){
    phone = phone.trim();
    msg = msg.trim();
    if (phone && msg){
        var payload = {
            'From': config.twilio.fromPhone,
            'To' :'+62'+phone,
            'Body':msg
        }
        var stringPayload = querystring.stringify(payload);

        var requestDetails = {
            'protocol' :'https:',
            'hostname':'api.twilio.com',
            'method':'POST',
            'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth': config.twilio.accountSid+':'+config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };

        var req = https.request(requestDetails, function(res){
            var status = res.statusCode;
            if(status== 200 || status == 201){
                callback(false);
            }else {
                callback('Status code returned = ' + status);
            }
        });

        req.on('error', function(e){
            callback(e)
        });

      
        req.on('error',function(e){
            callback(e);
          });
      
          // Add the payload
          req.write(stringPayload);
      
          // End the request
          req.end();

    }else {
        callback('Given parameters were invalid or missing');
    }

}

helpers.validateEmail = function(email) 
{
 if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email))
  {
    return (email)
  }
    return (false)
}

module.exports = helpers