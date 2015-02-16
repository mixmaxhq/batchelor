# http-string-parser

[![Build Status](https://travis-ci.org/apiaryio/http-string-parser.png)](https://travis-ci.org/apiaryio/http-string-parser)
[![Dependency Status](https://david-dm.org/apiaryio/http-string-parser.png)](https://david-dm.org/apiaryio/http-string-parser)
[![devDependency Status](https://david-dm.org/apiaryio/http-string-parser/dev-status.png)](https://david-dm.org/apiaryio/http-string-parser#info=devDependencies)

Parse HTTP message (Request and Response) from raw string in Node.JS

##Parse HTTP Message
```javascript
var parser = require('http-string-parser');

message = parser.parse(string);

console.log(message['request']);
console.log(message['response']);
```

See more about [Request][request] and [Response][response] data model.

[request]: https://www.relishapp.com/apiary/gavel/docs/data-model#http-request
[response]: https://www.relishapp.com/apiary/gavel/docs/data-model#http-response

## API Reference

`parseRequest(requestString)`

`parseRequestLine(requestLine)`

`parseResponse(responseString)`

`parseStatusLine(statusLine)`

`praseHeaders(headersLinesArray)`

- - - 

NOTE: Proof of concept, naive HTTP parsing, wheel re-inventation. In future it may be replaced with better parser from [Node.JS core's C bindings of NGINX HTTP parser](https://github.com/joyent/http-parser)