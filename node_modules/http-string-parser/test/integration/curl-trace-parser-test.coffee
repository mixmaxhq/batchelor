fs = require 'fs'

{assert} = require 'chai'
parser = require '../../src/parser'
curl = require 'curl-trace-parser'

describe "Parse output from curl trace parser", () ->
  traceFilePath = "./test/fixtures/post/tracefile"
  parsedCurlStrings = {}
  

  before (done) ->
    fs.readFile traceFilePath, 'utf8', (err, trace) ->
      done err if err
      parsedCurlStrings = curl.parse trace
      done()
  
  describe "request", () ->
    request = {}
    
    before () ->
      request = parser.parseRequest parsedCurlStrings['request']
    
    it "should parse string to expected object", () ->
      expectedObject =
        headers: 
          'User-Agent': 'curl/7.24.0 (x86_64-apple-darwin12.0) libcurl/7.24.0 OpenSSL/0.9.8x zlib/1.2.5'
          'Host': 'curltraceparser.apiary.io'
          'Accept':'*/*'
          'Content-Type': 'application/json'
          'Content-Length': '39'
        body: '{ \"product\":\"1AB23ORM\", \"quantity\": 2 }'
        method: 'POST'
        uri: '/shopping-cart'
      
      assert.deepEqual request, expectedObject 
  
  describe "response", () ->
    response = {}
    
    before () ->
      response = parser.parseResponse parsedCurlStrings['response']
    
    it "should parse string to expected object", () ->
      expectedObject =
        statusCode: "201"
        statusMessage: "Created"
        headers: 
          'Content-Type': 'application/json'
          'Content-Length': '39'
          'Date': 'Sun, 21 Jul 2013 14:51:09 GMT'
          'X-Apiary-Ratelimit-Limit': '120'
          'X-Apiary-Ratelimit-Remaining': '119'
          'Content-Length': '50'
          'Connection': 'keep-alive'
        body: '{ "status": "created", "url": "/shopping-cart/2" }'

      assert.deepEqual response, expectedObject



