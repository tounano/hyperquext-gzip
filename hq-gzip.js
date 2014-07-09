var _ = require('underscore');
var zlib = require('zlib');
var through = require('through');
var url = require('url')

module.exports = function hyperquextGzip(hyperquext) {
  return function (uri, opts, cb) {
    if (typeof uri === 'object') {
      cb = opts;
      opts = uri;
      uri = undefined;
    }
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }
    if (!opts) opts = {};
    if (uri !== undefined) opts.uri = uri;
    if (opts.uri !== undefined)
      opts = _.extend(opts, url.parse(opts.uri));
    else
      opts.uri = url.format(opts);

    if (opts.gzip !== true) return hyperquext(opts, cb);

    opts = _.clone(opts);
    opts.headers = opts.headers || {};
    opts.headers['Accept-Encoding'] = 'gzip';

    var proxy = require('hyperquext').createRequestProxy(opts, cb);

    var req = hyperquext(opts);

    req.on('request', function (clientRequest) {
      proxy.emit('request',clientRequest);
    })

    req.once('finalRequest', function (clientRequest) {
      getResponseFromClientRequest(clientRequest, function (err, res) {
        var encoding = getValue(res.headers, 'content-encoding');
        if (!encoding || encoding.search('gzip') === -1) return proxy.emit('finalRequest', clientRequest);


        var stream = (require('through')()).pause();
        var gzipped =zlib.createGunzip();

        gzipped.on('error', function (err) {proxy.emit('error', err) });
        res.on('error', function (err) {proxy.emit('error', err)});

        gzipped.on('data', function (d) {stream.queue(d)});
        gzipped.on('end', function () {
          clientRequest.res = _.extend({}, clientRequest.res, stream);
          proxy.emit('finalRequest', clientRequest);
          stream.resume();
          stream.queue(null);
        })

        res.pipe(gzipped);
      })
    })

    return proxy;
  }
}

function getValue(json, property) {
  var result;
  _.each(json, function (val, key) {
    if (property.toLowerCase() == key.toLowerCase())
      result = val;
  })

  return result;
}

function getResponseFromClientRequest(clientRequest, cb) {
  if (clientRequest.res) return cb(null, clientRequest.res);
  clientRequest.once('response', function (res) {
    cb(null, res);
  });
}