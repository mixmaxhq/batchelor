# Batchelor
A lovely little Node.js module to perform batch requests with the Google REST API. Simply does it.


## Installation

This library has also been distributed on `npm`. Install it with the following command:

``` sh
$ npm install batchelor --save
```

## How to use
``` node
var Batchelor = require('batchelor');
```
Once the module has been included, we initialise it with all our default options:
``` node
Batchelor.init({
	'uri':'https://www.googleapis.com/batch',
	'method':'POST',
	'auth': {
		'bearer': [... Google API Token ...]
	},
	'headers': {
		'Content-Type': 'multipart/mixed;'
	}
});
```
We can then start adding requests to our batch. This can be done 2 ways:

As a one-off object:
``` node
Batchelor.add({
	'method':'GET',
	'path':'/plusDomains/v1/people/me/activities/user'
})
```
Or an Array of objects:
``` node
Batchelor.add([
	{
		'method':'GET',
		'path':'/plusDomains/v1/people/me/activities/user'
	},
	{
		'method':'GET',
		'path':'/plusDomains/v1/people/me/circles'
	},
	{
		'method':'GET',
		'path':'/plusDomains/v1/people/me/people/circled'
	}
]);
```
Once you have added all of the requests you need, call `.run()`:
``` node
Batchelor.run(function(response){
	res.json(response);
});
```

## Release History

* 0.0.1 Initial release
