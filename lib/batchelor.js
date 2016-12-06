/*
  The MIT License (MIT)

  Copyright (c)2015 wapisasa C.I.C.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

'use strict';

var request = require('request'),
  Dicer = require('dicer'),
  parser = require('http-string-parser'),
  hat = require('hat');


/**
 * Initialise Batchelor
 *
 * @options {object} options for the parent request
 * @return  {object} Batchelor object
 */
var Batchelor = function (options) {

  //  URI is only required option
  if (!options.uri) {
    throw new Error('options.uri is required');
  }

  //  Defaults options
  options.method = options.method || 'POST'; // Default is POST as this was built specifically for Google
  if (!options.headers) options.headers = {};
  options.headers['Content-Type'] = options.headers['Content-Type'] || 'multipart/mixed;';

  //  Globalise the options
  this._globalOptions = options;

  //  Ready internal variables
  this._requests = [];
  this._requestSpecificCallbacks = [];
  this._requestExtensionData = [];
};

/**
 * Add a request into the requests array
 *
 * @options {object/array} options for individual requests/array of requests
 * @return  {object} Batchelor object
 */
Batchelor.prototype.add = function (options) {

  var _self = this;

  //  Check if adding multiple requests and loop through array
  if (!!Array.isArray(options)) {
    options.forEach(_self.add, _self);

    return _self;
  }

  //  Check for required options
  if (!options.path) {
    throw new Error('options.path is a required argument');
  }

  //  Give each request an id so we can identify the response
  var rack = hat.rack(),
    requestId = options.requestId || 'Batchelor_' + rack();

  //  Save out request specific callback
  if (!!options.callback) {
    this._requestSpecificCallbacks[requestId] = options.callback;
  }

  //  Any data thay needs to be passed through to the callback
  if (!!options.extend) {
    this._requestExtensionData[requestId] = options.extend;
  }

  //  Set Defaults
  options.method = options.method || 'GET';
  options.requestId = requestId;
  if (options.method === 'POST') {
    //  It's not a GET so we need something to push
    if (!options.parameters) {
      throw new Error('when using POST: options.parameters is required');
    }

    //  We will asume if it's not set, we are sending a body of JSON
    options.parameters['Content-Type'] = options.parameters['Content-Type'] || 'application/json;';

    //  Body exists?
    if (!options.parameters.body) {
      throw new Error('when using POST: options.parameters.body is required');
    }
  }

  //  Push to _requests Array
  this._requests.push(options);

  //  Chaining baby
  return this;

};

/**
 * Run the batch requests
 *
 * @callback {function} function to run when request is complete
 * @return   {object} API response via callback
 */
Batchelor.prototype.run = function (callback) {

  var _multiparts = [],
    _self = this;

  //  Build multipart request
  this._requests.forEach(function (requestPart) {

    var requestSettings = {
      'Content-Type': 'application/http',
      'Content-ID': requestPart.requestId,
      'body': requestPart.method + ' ' + requestPart.path + '\n'
    };

    //  Check if this part needs it's own auth
    if ((!!requestPart.auth) && (!!requestPart.auth.bearer)) {
      requestSettings.body += 'Authorization: Bearer ' + requestPart.auth.bearer + '\n';
    }

    //  Replace body with a request if this isn't a GET
    if (requestPart.method !== 'GET') {
      requestSettings.body = requestPart.method + ' ' + requestPart.path + '\n' +
        'Content-Type: ' + requestPart.parameters['Content-Type'] + '\n\n' +
        JSON.stringify(requestPart.parameters.body);
    }

    //  Push into array for the request
    _multiparts.push(requestSettings);

  });

  //  Collate objects
  var requestObj = this._globalOptions;
  requestObj.multipart = _multiparts;

  //  Run Requests
  request(requestObj).on('response', function (responseObj) {

    //  TODO: Handle errors bette than this
    if (responseObj.statusCode !== 200) {
      callback(new Error('Request did not return 200 OK: ' + responseObj.statusCode));
      return;
    }

    //  Get the boundary
    var boundaryRegex = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i,
      boundary = boundaryRegex.exec(responseObj.headers['content-type'])[2],
      responseBody = {
        'parts': [],
        'errors': 0
      };

    //  Cannot find our boundary
    if (!boundary) {
      callback(new Error('Problem getting boundary data'));
      return;
    }

    //  Now we read our body and output
    var d = new Dicer({
      boundary: boundary
    });

    //  Roll through our parts and build the bigger picture
    d.on('part', function (p) {

      var part = {
        data: [],
        bodylen: 0,
        header: undefined
      };

      p.on('header', function (h) {

        //  Save header data
        part.header = h;

      }).on('data', function (data) {

        //  Build this part's body
        part.data.push(data);
        part.bodylen += data.length;

      }).on('end', function () {

        //  Bring body parts together
        if (part.data) {
          part.data = Buffer.concat(part.data, part.bodylen);
        }

        //  Parse the raw http response
        part.data = parser.parseResponse(part.data.toString());

        //  Parse response JSON
        if (part.data.body) {
          part.data.body = JSON.parse(part.data.body);
        }

        //  Get the response id if exists
        var returnedContentId = part.header['content-id'],
          currentRequestCallback,
          currentRequestExtendData;

        if (!!returnedContentId) {

          //  In some cases (Google API) this is a single item array, flatten it and remove "response" identifier.
          if (!!Array.isArray(returnedContentId) && returnedContentId.length < 2) {
            returnedContentId = returnedContentId.join('').replace(/response-/, '');
          }

          part.data.headers['Content-ID'] = returnedContentId;

          //  As we have a content id, we can link to individual callback (if exists)
          currentRequestCallback = _self._requestSpecificCallbacks[returnedContentId];

          //  If this request has extend data, retrieve it for callback
          currentRequestExtendData = _self._requestExtensionData[returnedContentId];
        }

        //  If this individual request has a callback, run it
        if (!!currentRequestCallback) {

          currentRequestCallback(part.data, currentRequestExtendData || null);

        } else {
          //  Anything that doesn't have a specific callback get's pushed into main body
          responseBody.parts.push(part.data);
        }

      });
    }).on('finish', function () {

      //  All remaining responses get output
      //  Extend data sent through as is for parse in callback
      callback(null /* No error */ , responseBody, _self._requestExtensionData);

    });

    //  Pipe our response to Dicer
    responseObj.pipe(d);
  }).on('error', function (err) {
    // report socket errors to the callback function
    callback(err);
  });
};

/**
 * Reset all internal options if a re-run is required
 *
 * @return  {object} Batchelor object
 */
Batchelor.prototype.reset = function () {

  this._requests = [];
  this._requestSpecificCallbacks = [];
  this._requestExtensionData = [];
  this._globalOptions.multipart = [];

  return this;
};

module.exports = Batchelor;
