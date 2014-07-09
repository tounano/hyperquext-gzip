# hyperquext-gzip

Gzip compression for hyperquext requests.

If you have long running streams that depend on extermal resources, you might want abort the stream when timing out.

## Usage:

Decorating Hyperquext:

```
var request = hyperquextGzip(hyperquext)
```

From now on you can specify in options `{gzip: true}` and you're set.

## Example

```js
var hyperquextGzip = require("hyperquextGzip");
var hyperquext = require("hyperquext");
var request = hyperquextGzip(hyperquext);

request('http://techcrunch.com',{gzip:true}, function (err, res) {
  console.log(res.headers)
}).pipe(process.stdout)
```

## install

With [npm](https://npmjs.org) do:

```
npm install hyperquext-gzip
```

## license

MIT