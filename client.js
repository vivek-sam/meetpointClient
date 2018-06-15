var tls = require('tls');
var fs = require('fs');
var request = require('request');
const winston = require('winston');
var http = require('http');

const logDir = '../working/log';
var PORT = 7443;
var HOST = 'viveksam.southindia.cloudapp.azure.com';
var key = fs.readFileSync('wallet/client1-key.pem');
var cert = fs.readFileSync('wallet/client1-crt.pem');
var ca = fs.readFileSync('wallet/ca-crt.pem');
var recognizedToken = fs.readFileSync('wallet/token').toString();
var machineName = fs.readFileSync('../working/machine').toString();; //always remain the same... so read from file ?
var EventEmitter = require("events").EventEmitter;
var IPAddressbody = new EventEmitter();
var IPAddress;
var addrequestbody = new EventEmitter();
var listrequestbody = new EventEmitter();

const tsFormat = () => (new Date()).toLocaleTimeString();
var now = new Date();
var logfile_name = `${logDir}`+ '/' + now.getFullYear() + "-"+ now.getMonth() + "-" + now.getDate() + machineName+'-client.log';

var logger = new (winston.Logger)({
    transports: [
    // colorize the output to the console
    new (winston.transports.Console)({
      timestamp: tsFormat,
      colorize: true,
      level: 'info'
    }),
    new (winston.transports.File)({
      filename: logfile_name,
      timestamp: tsFormat,
      datePattern: 'yyyy-MM-dd',
      prepend: true,
      level: 'silly'
    })
    ]
});

http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp) {
  resp.on('data', function(ip) {
    //logger.info("My public IP address is: " + ip);
    IPAddressbody.data = ip;
    IPAddressbody.emit('update');
  });
});

IPAddressbody.on('update', function () {
    IPAddress = IPAddressbody.data;
    logger.info("My public IP address is: " + IPAddress);
    addrequestbody.emit('send');
});

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

var https_options = {
    key: key,
    cert: cert,
    ca: ca
};

/* 
Functions
*/
function callback(error, response, body) {
    if (!error) {
        var info = JSON.parse(JSON.stringify(body));
        logger.info('Received response');
        logger.info(info);
        if(info.operation.toString() === "addhost") {
            if(info.status.toString() === "SUCCESS") {
                logger.info('Succesfully added host...');
            } else {
                //problem with addhost
            }            
        } else if (info.operation.toString() === "showhosts") {
            if(info.status.toString() === "SUCCESS") {
                logger.info('Succesfully listed host(s)...');
            } else {
                //problem with list hosts
            }   
        }    
        //analyze the response.. if it is "added successfully.. " ask for list
    }
    else {
        logger.error('Error happened: '+ error);
    }
}

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}




var client = tls.connect(PORT, HOST, https_options, function() {
    if (client.authorized) {
        
        logger.info('CONNECTED AND AUTHORIZED');
        
        process.stdin.pipe(client);
        process.stdin.resume();
        
        // Time to make some request to the server
        // We will write straight to the socket, but recommended way is to use a client library like 'request' or 'superagent'
        //client.write('GET /showvalues HTTP/1.1\r\n');
        //client.write('\r\n');
    }
    else {
        logger.info('AUTH FAILED');
        process.exit();
    }
});

client.setEncoding('utf8');

client.on('data', function(data) {
    logger.info(data);
    process.exit();
});

client.on('close', function() {
    logger.info('SOCKET CLOSED');
    process.exit();
});

// When an error ocoures, show it.
client.on('error', function(error) {

    logger.error(error);
    // Close the connection after the error occurred.
    client.destroy();
    process.exit();
});

//Handle the request and exit... 
//send a request.. only when IP is available... 

addrequestbody.on('send', function () {
    logger.info("Sending Data");
   
    var request_options = {
        uri: 'https://viveksam.southindia.cloudapp.azure.com:7443/addhost',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        json: {
            'token': recognizedToken,
            'hostMachine': machineName,
            'hostWANIP' : IPAddress.toString()
        }
    };

    console.log(request_options);
    request(request_options,callback);

});