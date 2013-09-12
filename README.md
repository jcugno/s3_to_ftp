s3_to_ftp
=========

Stream s3 files to a remote ftp location

Usage
========

```
node index.js -b [s3_bucket_name] -h [ftp_host_name] -u [ftp_user] -p [ftp_pass] -f [s3_bucket_file] -r [ftp_remote_file] -k [s3_key] -s [s3_secret]
```

Note that s3_key and s3_secret can be set with environment variables instead. They are S3_KEY and S3_SECRET.

Also, you must supply the FULL path for the bucket file and remote file such as path/to/file/some_file.mp3
