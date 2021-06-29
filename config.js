/*
create and export config
*/

var environments = {};

//create Staging environments
environments.staging = {
 'httpPort' : 3000,
 'httpsPort' : 3001,
 'envName' : 'staging',
 'hashingSecret' : 'secret',
 'maxChecks' : 5,
 'twilio' : {
    'accountSid' : 'ACb5642f349f2a2226bbcc3dc6df8f181f',
    'authToken' : 'addac37fc8adb804e420eec654264109',
    'fromPhone' : '+13158733141'
  }
};

environments.production = {
 'httpPort' : 5000,
 'httpsPort' : 5001,
 'envName' : 'production',
 'hashingSecret' : 'secret',
 'maxChecks' : 5,
 'twilio' : {
    'accountSid' : '',
    'authToken' : '',
    'fromPhone' : ''
  }
};

//determines which environment
var currEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

var envToExport = typeof(environments[currEnvironment]) == 'object' ? environments[currEnvironment] : environments.staging;

module.exports = envToExport;