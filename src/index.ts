// Polyfill for Node.js
if (typeof fetch === 'undefined' && typeof global === 'object') {
  global.fetch = require('node-fetch');
  global.FormData = require('form-data');
  global.Headers = require('node-fetch').Headers;
  global.URLSearchParams = require('url').URLSearchParams;
}

