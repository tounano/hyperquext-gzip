var _ = require('underscore');
var zlib = require('zlib');
var through = require('through');
var url = require('url')
var hq=require("hyperquext");
var parseArgs = hq.devcorators.parseArgs,
  getFinalRequestFromHyperquext = hq.helpers.getFinalRequestFromHyperquext,
  getResponseFromClientRequest = hq.helpers.getResponseFromClientRequest

module.exports = function hyperquextGzip(hyperquext) {
  return parseArgs(function (uri, opts, cb) {
    if (opts.gzip !== true) return hyperquext(opts, cb);

    opts = _.clone(opts);
    opts.headers = opts.headers || {};
    opts.headers['Accept-Encoding'] = 'gzip';

    var proxy = require('hyperquext').createRequestProxy(opts, cb);

    var req = hyperquext(opts);

    req.on('request', function (clientRequest) {proxy.emit('request',clientRequest);})
    req.on('error', function (err) {proxy.emit('error',err);})

    getFinalRequestFromHyperquext(req, function (err, finalRequest) {
      getResponseFromClientRequest(finalRequest, function (err, res) {
        var encoding = getValue(res.headers, 'content-encoding');
        if (!encoding || encoding.search('gzip') === -1) return proxy.emit('finalRequest', finalRequest);


        var stream = (require('through')()).pause();
        var gzipped =zlib.createGunzip();

        gzipped.on('error', function (err) {proxy.emit('error', err) });
        res.on('error', function (err) {proxy.emit('error', err)});

        gzipped.on('data', function (d) {stream.queue(d)});
        gzipped.on('end', function () {
          finalRequest.res = _.extend({}, finalRequest.res, stream);
          proxy.emit('finalRequest', finalRequest);
          stream.resume();
          stream.queue(null);
        })

        res.pipe(gzipped);
      })
    })

    return proxy;
  })
}

function getValue(json, property) {
  var result;
  _.each(json, function (val, key) {
    if (property.toLowerCase() == key.toLowerCase())
      result = val;
  })

  return result;
}