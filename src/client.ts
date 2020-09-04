import { AccessTokenResult, WrappedApiError } from "./types";

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
      if (params instanceof FormData) {
        return params;
      }
      else {
        const fd = new FormData;
        const entries = params instanceof URLSearchParams ? params : Object.entries(params);

        for (const [item, value] of entries) {
          fd.append(item, value.toString());
        }

        return fd;
      }
    }
    else {
      if (params instanceof URLSearchParams) {
        return params;
      }
      else if (params instanceof FormData) {
        const urlp = new URLSearchParams;

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
    if (params instanceof URLSearchParams) {
      return params;
    }
    else {
      const urlp = new URLSearchParams;
      const entries = params instanceof FormData ? params : Object.entries(params);

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
    const headers = new Headers(user_headers);
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
        else if (body instanceof URLSearchParams) {
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

    return fetch(url, { method, body, headers })
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
