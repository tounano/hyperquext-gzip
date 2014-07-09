var hyperquextGzip = require("../");
var hyperquext = require("hyperquext");
var request = hyperquextGzip(hyperquext);

request('http://techcrunch.com',{gzip:true}, function (err, res) {
  console.log(res.headers)
}).pipe(process.stdout)