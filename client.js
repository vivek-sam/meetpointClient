var tls = require('tls');
var fs = require('fs');
var PORT = 7443;
var HOST = 'viveksam.southindia.cloudapp.azure.com';
var key = fs.readFileSync('wallet/client1-key.pem');
var cert = fs.readFileSync('wallet/client1-crt.pem');
var ca = fs.readFileSync('wallet/ca-crt.pem');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

var https_options = {
    key: key,
    cert: cert,
    ca: ca
};

var client = tls.connect(PORT, HOST, https_options, function() {
    if (client.authorized) {
        
        console.log('CONNECTED AND AUTHORIZED\n');
        
        client.on('close', function() {
            console.log('SOCKET CLOSED\n');
            process.exit();
        });
        
        process.stdin.pipe(client);
        process.stdin.resume();
        
        // Time to make some request to the server
        // We will write straight to the socket, but recommended way is to use a client library like 'request' or 'superagent'
        client.write('GET /hey HTTP/1.1\r\n');
        client.write('\r\n');
        
        client.write('POST /ho HTTP/1.1\r\n');
        client.write('\r\n');

    }
    else {
        console.log('AUTH FAILED\n');
        process.exit();
    }
});
client.setEncoding('utf8');
client.on('data', function(data) {
    console.log('-------------');
    console.log(data);
});