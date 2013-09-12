#!/usr/bin/node

var JSFtp = require('jsftp')
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

var client = knox.createClient({
  key: key,
  secret: secret,
  bucket: argv.b
});

var ftp = new JSFtp({
  host : argv.h,
  user: argv.u,
  pass: argv.p 
});

ftp.auth(argv.u, argv.p, function(err, data) {

  if (err) { console.log(err);}

  client.getFile(argv.f, function(err, res) {
  
    if (err) { return console.log(err); }
  
    ftp.getPutSocket(argv.r, function(err, socket) {
      if (err) { return console.log(err); }
      res.pipe(socket);
    }, function(hadError) {
      console.log(hadError);
    });
    
  });
});

