#!/usr/bin/node

var Client = require('ftp')
  , ProgressBar = require('progress')
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

ftpClient.on('ready', function() {

  s3Client.getFile(argv.f, function(err, res) {

    if (err) { return console.log(err); }

    var len = parseInt(res.headers['content-length'], 10);

    var bar = new ProgressBar('  uploading [:bar] :percent :current of :total elapsed :elapsed eta :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: len 
    });

    res.on('data', function(chunk) {
      bar.tick(chunk.length);
    });

    ftpClient.put(res, argv.r, function(err) {
      if (err) { throw err; }
      ftpClient.end();
      console.log("Finished");
    });
  });
});

