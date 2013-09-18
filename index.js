#!/usr/bin/node

var Client = require('ftp')
  , knox = require('knox')
  , argv = require('optimist')
    .usage('Usage: $0 -b [bucket] -h [ftp_host] -u [ftp_user] -p [ftp_pass] -f [bucket_file] -r [ftp_remote_file] -k [s3_key] -s [s3_secret]')
    .demand(['b', 'h', 'u', 'p', 'f', 'r'])
    .argv;

var key = process.env.S3_KEY || argv.k;
var secret = process.env.S3_SECRET || argv.s;

if (key === undefined || secret === undefined) {
  console.error('You need to specify an S3 key and secret either as an environment variable or on the command line');
  process.exit(1);
}

var s3Client = knox.createClient({
  key: key,
  secret: secret,
  bucket: argv.b
});

var ftpClient = new Client();

ftpClient.connect({
  host : argv.h,
  user: argv.u,
  password: argv.p
});


function getFileFromS3(size, cb) {

  var headers = {};

  if (typeof size === 'function') {
    cb = size;
    size = 0;
  } else {
    headers.Range = 'bytes=' + size + '-';
  }

  s3Client.getFile(argv.f, headers, function(err, res) {
    if (err) { return console.log(err); }

    if (size && res.statusCode === 206) {
      console.log("Resume succesful, appending to previous location");
    } else if (size) {
      console.log("S3 did NOT return a succesful resume status. Got the following instead: " + res.statusCode);
      console.log("S3 should support resume, there must be something wrong with the ftp server. You may need to delete the file on the server and try again");
      process.exit(1);
    }

    res.on('error', function(err) {
      console.log("Error with s3: " + err);
    });

    res.on('end', function() {
      console.log("S3 ended");
    });

    res.on('close', function() {
      console.log("S3 closed");
    });

    console.log("Starting to stream s3 -> ftp");

    cb(res);
  });
}

ftpClient.on('ready', function() {

  ftpClient.size(argv.r, function(err, size) {

      // Assuming the err is the file not existing, good enough for now
      // err.code will give the exact status code otherwise (550 is file not found)
      if (err) {

        getFileFromS3(function(res) {
          ftpClient.put(res, argv.r, function(err) {
            if (err) { throw err; }
            ftpClient.end();
            console.log("Finished");
          });
        });

      } else {

        console.log("Resuming download at start: " + size);
        getFileFromS3(size, function(res) {

          ftpClient.append(res, argv.r, function(err) {
            if (err) { throw err; }

            ftpClient.end();
            console.log("Finished");
          });
        });
      }
    });
});


ftpClient.on('close', function(hadError) {
  if (hadError) {
    console.log("FTP server closed with an errror");
  } else {
    console.loog("FTP server closed");
  }
});

ftpClient.on('error', function(err) {
  console.log("FTP server had error: " + err);
});


ftpClient.on('end', function(){
  console.log("FTP server ended connection");
});

ftpClient.on('greeting', function(msg) {
  console.log(msg);
});
