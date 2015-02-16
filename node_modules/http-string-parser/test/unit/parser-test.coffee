fs = require 'fs'

{assert} = require 'chai'
parser = require '../../src/parser'

describe "parser module", () ->
  
  # http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
  describe "parseHeaders(headersLines)", () ->
    it "should be a function", () ->
      assert.isFunction parser.parseHeaders
    
    describe "its return", () ->
      output = ""
      headerLines = [
        "User-Agent: curl/7.24.0 (x86_64-apple-darwin12.0) libcurl/7.24.0 OpenSSL/0.9.8x zlib/1.2.5",
        "Host: curltraceparser.apiary.io",
        "Accept: */*",
        "Content-Type: application/json",
        "Content-Length: 39",
      ]
      
      before () ->
        output = parser.parseHeaders headerLines

      describe "its retrun", () ->
        it "should be object", () ->
          assert.isObject output
        
        ['User-Agent', 'Host', "Accept", "Content-Type", "Content-Length"].forEach (key) ->
          it "should contain key '" + key + "'", () ->
            assert.include Object.keys(output), key

        it "should have proper User-Agent string", () ->
          agentString = "curl/7.24.0 (x86_64-apple-darwin12.0) libcurl/7.24.0 OpenSSL/0.9.8x zlib/1.2.5"
          assert.equal output['User-Agent'], agentString

  # http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html#sec5.1
  describe "parseRequestLine(requestLineString)", () ->
    it "should be a function", () ->
      assert.isFunction parser.parseRequestLine

    lineStrings =
      POST: "POST /shopping-cart HTTP/1.1"
      GET:  "GET /shopping-cart HTTP/1.1"
    
    for method, line of lineStrings
      describe "return for " + method + " line", () ->
        output = ""
        before () ->
          output = parser.parseRequestLine line
        
        it "should be object", () -> 
          assert.isObject output

        ['method','uri','protocol'].forEach (key) ->
          it "should contain not empty string on key: " + key, () ->
            assert.isString output[key]
        
        it "should have parsed method " + method, () ->
          assert.equal output['method'], method

        it "should have parsed uri " + method, () ->
          assert.equal output['uri'], "/shopping-cart"
  
  # http://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html#sec6.1
  describe "parseStatusLine", () ->
    it "is a function", () ->
      assert.isFunction parser.parseStatusLine

    describe "its return", () ->
      output = {}
      statusLine = "HTTP/1.1 201 Created"

      before () ->
        output = parser.parseStatusLine statusLine
        
      ['protocol','statusCode','statusMessage'].forEach (key) ->
        it "should contain not empty string on key: " + key, () ->
          assert.isString output[key]
       
        it 'should contain statusCode "201"', () ->
          assert output['statusCode'], "201"

        it 'should contain statusMessage "Created"', () ->
          assert output['statusCode'], "Created"
  
  # http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html
  describe "parseRequest(requestString)", () ->
    requestPath = "/../fixtures/post/request-string"
    requestString = ""
    
    before (done) ->
      #load fixture
      fs.readFile __dirname + requestPath, (err, data) ->
        done err if err
        requestString = data.toString()
        done()

    it "is a function", () ->
      assert.isFunction parser.parseRequest
    
    describe 'its return', () ->
      output = ""
    
      before () ->
        output = parser.parseRequest(requestString)

      ['method', 'uri', 'headers', 'body'].forEach (key) ->
        it 'should have key "'+ key + '"', () ->
          assert.include Object.keys(output), key
      
      describe "method", () ->
        subject = ""
        
        before () ->
          subject = output['method']
        
        it 'should contain "POST"', () ->
          assert.equal subject, "POST"

      describe "uri", () ->
        subject = ""
        
        before () ->
          subject = output['uri']
        
        it 'should contain "/shopping-cart"', () ->
          assert.equal subject, "/shopping-cart"

      describe "headers", () ->
        subject = ""
        
        before () ->
          subject = output['headers']
        
        it 'should be object', () ->
          assert.isObject subject

        it 'should have "User-Agent" key', () -> 
          assert.include Object.keys(subject), "User-Agent"
         
        it 'should have proper User-Agent value', () ->
          agentString = "curl/7.24.0 (x86_64-apple-darwin12.0) libcurl/7.24.0 OpenSSL/0.9.8x zlib/1.2.5"
          assert.equal agentString, subject['User-Agent']

      describe "body", () ->
        subject = ""
        
        before () ->
          subject = output['body']

        it 'should contain proper body string', () ->
          expectedBody = '{ "product":"1AB23ORM", "quantity": 2 }'
          assert.equal expectedBody, subject

  # http://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html#sec6
  describe "parseResponse(responseString)", () ->
    responsePath = "/../fixtures/post/response-string"
    responseString = ""
    
    before (done) ->
      #load fixture
      fs.readFile __dirname + responsePath, (err, data) ->
        done err if err
        responseString = data.toString()
        done()

    it "is a function", () ->
      assert.isFunction parser.parseResponse
    
    describe 'its return', () ->
      output = ""
    
      before () ->
        output = parser.parseResponse(responseString)

      ['statusCode', 'statusMessage', 'headers', 'body'].forEach (key) ->
        it 'should have key "'+ key + '"', () ->
          assert.include Object.keys(output), key
      
      describe "statusCode", () ->
        subject = ""
        
        before () ->
          subject = output['statusCode']
        
        it 'should contain "201"', () ->
          assert.equal subject, "201"

      describe "statusMessage", () ->
        subject = ""
        
        before () ->
          subject = output['statusMessage']
        
        it 'should contain "Created"', () ->
          assert.equal subject, "Created"

      describe "headers", () ->
        subject = ""
        
        before () ->
          subject = output['headers']
        
        it 'should be object', () ->
          assert.isObject subject

        it 'should have "Content-Type" key', () -> 
          assert.include Object.keys(subject), "Content-Type"
         
        it 'should have proper Content-Type value', () ->
          agentString = "application/json"
          assert.equal agentString, subject['Content-Type']

      describe "body", () ->
        subject = ""
        
        before () ->
          subject = output['body']

        it 'should contain proper body string', () ->
          expectedBody = '{ "status": "created", "url": "/shopping-cart/2" }'
          assert.equal expectedBody, subject
    
