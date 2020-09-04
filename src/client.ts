import { AccessTokenResult, WrappedApiError } from './types';

// To make TypeScript and Node.js happy.
var _Headers: { new (init?: Headers | string[][] | Record<string, string> | undefined): Headers; prototype: Headers; };
var _URLSearchParams: { new (init?: string | URLSearchParams | string[][] | Record<string, string> | undefined): URLSearchParams; prototype: URLSearchParams; toString(): string; };
var _FormData: { new (form?: HTMLFormElement | undefined): FormData; prototype: FormData; };
var _fetch: Window['fetch'];

// Node.js
if (typeof fetch === 'undefined' && typeof global === 'object') {
  _fetch = require('node-fetch');
  _FormData = require('form-data');
  _Headers = require('node-fetch').Headers;
  _URLSearchParams = require('url').URLSearchParams;
}
// Deno/Browser
else {
  _fetch = fetch;
  _FormData = FormData;
  _Headers = Headers;
  _URLSearchParams = URLSearchParams;
}

export type AllowedParams = FormData | AllowedNoBodyParams;
export type AllowedNoBodyParams =  URLSearchParams | Record<string, string | number | boolean>;

export interface QuestionItRequestParams<T extends AllowedParams> {
  params?: T;
  headers?: Record<string, string> | Headers;
  auth?: boolean | string;
  with_rq?: boolean;
}

export class QuestionIt {
  protected static readonly PREFIX = 'https://api.questionit.space/'; 
  protected static readonly FORM_DATA_ENDPOINTS = ['questions/answer', 'users/profile']; 
  protected static readonly QUERY_PARAMS_METHOD = ['GET', 'DELETE', 'HEAD']; 

  constructor(protected token?: string) {}

  /* STATE MANAGEMENT */

  setAccessToken(token: string) {
    this.token = token;
  } 

  removeAccessToken() {
    this.token = undefined;
  }


  /* SPECIFIC ENDPOINT METHODS */

  async getRequestToken(app_key: string, url: string = 'oob') : Promise<string> {
    const req = await this.post('apps/token', { 
      params: { key: app_key, url }, 
      auth: false 
    });

    return req.token as string;
  }

  getAccessToken(app_key: string, token: string, validator: string) : Promise<AccessTokenResult> {
    return this.post('auth/token/create', { 
      params: { key: app_key, token, validator }, 
      auth: false 
    });
  }


  /* GENERIC ENDPOINT METHODS */

  get(endpoint: string, options?: QuestionItRequestParams<AllowedNoBodyParams>) {
    return this.request('GET', endpoint, options);
  }

  post(endpoint: string, options?: QuestionItRequestParams<AllowedParams>) {
    return this.request('POST', endpoint, options);
  }

  put(endpoint: string, options?: QuestionItRequestParams<AllowedParams>) {
    return this.request('PUT', endpoint, options);
  }

  patch(endpoint: string, options?: QuestionItRequestParams<AllowedParams>) {
    return this.request('PATCH', endpoint, options);
  }

  delete(endpoint: string, options?: QuestionItRequestParams<AllowedNoBodyParams>) {
    return this.request('DELETE', endpoint, options);
  }

  request(method: string, endpoint: string, options?: QuestionItRequestParams<AllowedParams>) {
    return this.make(
      endpoint, 
      options?.params, 
      method.toUpperCase(), 
      options?.headers, 
      options?.auth, 
      options?.with_rq
    );
  }


  /* REQUESTS MANAGER */

  protected makeBody(endpoint: string, params: AllowedParams) : URLSearchParams | string | FormData {
    if (QuestionIt.FORM_DATA_ENDPOINTS.includes(endpoint)) {
      if (params instanceof _FormData) {
        return params;
      }
      else {
        const fd = new _FormData;
        const entries = params instanceof _URLSearchParams ? params : Object.entries(params);

        for (const [item, value] of entries) {
          fd.append(item, value.toString());
        }

        return fd;
      }
    }
    else {
      if (params instanceof _URLSearchParams) {
        return params;
      }
      else if (params instanceof _FormData) {
        const urlp = new _URLSearchParams;

        for (const [item, value] of params) {
          if (typeof value !== 'string') {
            urlp.append(item, value.toString()); 
          }
          else {
            urlp.append(item, value);
          }
        }

        return urlp;
      }
      else {
        return JSON.stringify(params);
      }
    }
  } 

  protected makeParams(params: AllowedParams) : URLSearchParams {
    if (params instanceof _URLSearchParams) {
      return params;
    }
    else {
      const urlp = new _URLSearchParams;
      const entries = params instanceof _FormData ? params : Object.entries(params);

      for (const [item, value] of entries) {
        if (typeof value !== 'string') {
          urlp.append(item, value.toString()); 
        }
        else {
          urlp.append(item, value);
        }
      }

      return urlp;
    }
  }

  protected make(
    endpoint: string, 
    params?: AllowedParams, 
    method: string = 'GET', 
    user_headers: Record<string, string> | Headers = {},
    auth?: boolean | string,
    with_request?: boolean,
  ) {
    const headers = new _Headers(user_headers);
    let url = QuestionIt.PREFIX + endpoint;
    let body: FormData | URLSearchParams | string | undefined = undefined;

    if (params) {
      if (QuestionIt.QUERY_PARAMS_METHOD.includes(method)) {
        const url_params = this.makeParams(params).toString();

        if (url_params.length) {
          url += '?' + url_params;
        }
      }
      else {
        body = this.makeBody(endpoint, params);

        // Set the correct headers
        if (typeof body === 'string') {
          // JSON encoded
          headers.append('Content-Type', 'application/json');
        }
        else if (body instanceof _URLSearchParams) {
          body = body.toString();
          headers.append('Content-Type', 'application/x-www-form-urlencoded');
        }
        else {
          headers.append('Content-Type', 'multipart/form-data');
        }
      }
    }

    if ((auth === undefined || auth === true) && this.token) {
      headers.append('Authorization', 'Bearer ' + this.token);
    }
    
    if (typeof auth === 'string') {
      headers.append('Authorization', 'Bearer ' + auth);
    }

    return _fetch(url, { method, body, headers })
      .then(this.handleResponse.bind(this, with_request || false)); 
  }

  protected handleResponse(with_request: boolean, response: Response) {
    // API always replies with JSON, even on error
    const length = response.headers.get('Content-Length');
    const result = length ? response.json() : Promise.resolve();

    if (response.ok) {
      if (with_request)
        return {
          response,
          result
        };
  
      return result;
    }

    return {
      type: 'QuestionItApiError',
      response,
      result: Promise.reject(result),
    };
  }

  static isApiError(data: any) : data is WrappedApiError {
    return typeof data === 'object' && 'type' in data && data.type === 'QuestionItApiError';
  }
}

export default QuestionIt;
