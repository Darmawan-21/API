//Library for storing logs

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');


//Container for module
var lib = {};

lib.baseDir = path.join(__dirname, '/../.logs/');

//Append string to a file, create if it does not exist
lib.append = function(file,str,callback){
    //open the file for appending
    fs.open(lib.baseDir+file+'.log','a', function(err, fileDescriptor){
        if(!err && fileDescriptor){
            fs.appendFile(fileDescriptor,str+'\n', function(err){
                if(!err){
                    fs.close(fileDescriptor, function(err){
                        if(!err){
                            callback (false)
                        }else{
                            callback('error closing the file')
                        }
                    })
                }else{
                    callback('error appending the file')
                }
            })
        }else {
            callback('could not open file')
        }
    })
}
//List all log

lib.list = function(compressLogs, callback){
    fs.readdir(lib.baseDir, function(err,data){
        if(!err && data && data.length >0){
            var trimmedFileNames = [];            
            data.forEach(function(fileName){
                if(fileName.indexOf('.log')> -1){   // if file name contains .log
                    trimmedFileNames.push(fileName.replace('.log', ''));
                }

                //add the .gz files to 
                if(fileName.indexOf('.gz.b64')> -1 && compressLogs){
                    trimmedFileNames.push(fileName.replace('.gz', ''));
                }
            });
            callback(false, trimmedFileNames);
        }else{
            callback(err,data)
        }
    })
}

//compress the contents of one .log file within the same directory

lib.compress = function(logId, newFileId, callback){
    var sourceFile = logId+'.log'
    var destFile = newFileId+'.gz.b64'

    fs.readFile(lib.baseDir+sourceFile,'utf8', function(err, inputString){
        if(!err&& inputString){
            //compress data using gzip
            zlib.gzip(inputString, function(err, buffer){
                if(!err && buffer){
                    //send the data to destination file
                    fs.open(lib.baseDir+destFile,'wx', function(err,fileDescriptor){
                        if (!err && fileDescriptor){
                            fs.writeFile(fileDescriptor,buffer.toString('base64'), function(err){
                                if(!err){
                                    fs.close(fileDescriptor,function(err){
                                        if(!err){
                                            callback(false)
                                        }else{
                                            callback(err);
                                        }
                                    })
                                }else{
                                    callback(err)
                                }
                            })
                        }else{
                            callback(err);
                        }
                    })
                }else {
                    callback (err)
                }
            })
        }else {
            callback(err);
        }
    });    
}

//Decompress tge gz.b64 into string

lib.decompress = function(fileId, callback){
    var fileName = fileId+'.gz.b64'
    fs.readFile(lib.baseDir+fileName,'utf8', function(err,str){
        if(!err && str){
            //Decompress the data
            var inputBuffer = buffer.from(str, 'base64')
            zlib.unzip(inputBuffer, function(err,outputBuffer){
                if(!err && outputBuffer){
                    var str = outputBuffer.toString();
                    callback(false, str)
                }else{
                    callback(err)
                }
            })
        }else{
            callback(err)
        }
    })
}


lib.truncate = function(logId, callback){
    fs.truncate(lib.baseDir+logId+'.log',0, function(err){
        if(!err){
            callback(false)
        }else{
            callback(err)
        }
    })
}










module.exports = lib;