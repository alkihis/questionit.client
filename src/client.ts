import { AccessTokenResult, WrappedApiError } from './types';
import { ReadStream } from 'fs';

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
export type AllowedNoBodyParams =  URLSearchParams | Record<string, any>;

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

  /**
   * Check token validity, get logged user and verify token permissions.
   */
  verifyToken() {
    return this.get('auth/token/verify');
  } 

  /**
   * Cancel a token existence.
   */
  revokeToken() {
    return this.delete('auth/token');
  }

  
  /* User based */

  /**
   * Find users using a query. Query can concern user slug or user name.
   */
  findUsers(query: string, until?: string) {
    return this.get('users/find', { params: { q: query, until } })
  }
    
  /**
   * Get a single user. If you give a numberstring, ID will be supported. Otherwise, it will search by slug.
   */
  getUser(user: string | number) {
    user = String(user);

    if (!isNaN(Number(user)))
      return this.get('users/id/' + user);

    return this.get('users/slug/' + user);
  }

  /**
   * Get logged user.
   */
  getLogged() {
    return this.get('users/logged');
  }

  /**
   * Set pinned question of user profile.
   */
  setPinned(question_id: string | number) {
    return this.patch('questions/pin', {params: { id: String(question_id) }});
  }

  /**
   * Remove pinned question of user profile.
   */
  removePinned() {
    return this.delete('questions/pin');
  }

  /**
   * Overwrite muted words for logged user.
   */
  setMutedWords(words: string[]) {
    return this.post('users/blocked_words', { params: { words } });
  }

  getMutedWords() {
    return this.get('users/blocked_words');
  }

  
  /* Post / manage questions */ 

  /**
   * Ask {user_id} as {anonymous}/logged with {content}.
   */
  async ask(content: string, user_id: string, anonymous = true, in_reply_to?: string, poll?: string[]) {
    const params: any = { content, to: user_id, in_reply_to };

    if (poll) {
      if (poll.length < 2 || poll.length > 4) {
        throw new RangeError('Multiple choices are only allowed from 2 to 4 choices');
      }

      const poll_data = await this.post('polls', { params: { options: poll } });
      params.poll_id = poll_data.poll_id;
    }

    if (anonymous)
      return this.post('questions/anonymous', { params });
    return this.post('questions', { params });
  }

  /**
   * Get waiting questions. Cursor the result using {since} and {until}. Use {muted} to get muted waiting questions.
   */
  waitingQuestions(since?: string, until?: string, size?: string, sort_by?: string, muted = false) {
    return this.get('questions/waiting', { params: { muted: String(muted), since, until, size, sort_by } });
  }

  /**
   * Post a reply {answer} for {question_id}. If you want to attach a picture, give a valid readable stream/buffer in {picture} (do not give a filename!).
   */
  reply(answer: string, question_id: string, post_on_twitter = false, picture?: Buffer | ReadStream) {
    return this.post('questions/answer', { params: { 
      answer, 
      question: question_id, 
      post_on_twitter: String(post_on_twitter), 
      picture 
    } });
  }

  /**
   * Remove question {question_id}
   */
  removeQuestion(question_id: string) {
    return this.delete('questions', { params: { question: question_id } });
  }

  /**
   * Remove every muted question.
   */
  removeMutedQuestions() {
    return this.delete('questions/masked');
  }


  /* Like questions */

  /**
   * Like {question_id}.
   */
  like(question_id: string) {
    return this.post('likes/' + question_id);
  } 

  /**
   * Unlike {question_id}.
   */
  unlike(question_id: string) {
    return this.delete('likes/' + question_id);
  } 
  
  /**
   * Get user objects of likers of question {question_id}. Cursor the result with {since} and {until}.
   */
  likersOf(question_id: string, since?: string, until?: string, size?: string) {
    return this.get('likes/list/' + question_id , { params: { since, until, size } });
  }

  /**
   * Get user IDs of likers of question {question_id}. Cursor the result with {since} and {until}.
   */
  likersIdsOf(question_id: string, since?: string, until?: string, size?: string) {
    return this.get('likes/ids/' + question_id , { params: { since, until, size } });
  }
    

  /* Get question timelines */

  /**
   * Get replied questions of user {user_id}. Cursor the result using {since} and {until}.
   */
  questionsOf(user_id?: string, since?: string, until?: string, size?: string, sort_by?: string) {
    return this.get('questions', { params: { user_id, since, until, size, sort_by } });
  }

  /**
   * Get asked questions of user {user_id}. Cursor the result using {since} and {until}.
   */
  askedQuestionsOf(user_id?: string, since?: string, until?: string, size?: string, sort_by?: string) {
    return this.get('questions/sent', { params: { user_id, since, until, size, sort_by } });
  }

  /**
   * Get timeline of logged user. Cursor the result using {since} and {until}.
   */
  homeTimeline(since?: string, until?: string, size?: string, sort_by?: string) {
    return this.get('questions/timeline', { params: { since, until, size, sort_by } });
  }

  /**
   * Get ancestors of questions {question_id}.
   */
  ancestorsOf(question_id: string, size?: string) {
    return this.get('questions/tree/' + question_id, { params: { size } });
  }

  /**
   * Get replies of question {question_id}. Cursor the result using {since} and {until}.
   */
  repliesOf(question_id: string, since?: string, until?: string, size?: string, sort_by?: string) {
    return this.get('questions/replies/' + question_id, { params: { size, since, until, sort_by } });
  }


  /* Relationships */

  /**
   * Get the relationship object between logged user and another user {user_id}
   */
  relationshipWith(user_id: string) {
    return this.get('relationships/with/' + user_id);
  }

  /**
   * Get the relationship object between source user {source_user_id} and target user {target_user_id}
   */
  relationshipBetween(source_user_id: string, target_user_id: string) {
    return this.get('relationships/between', { params: { source: source_user_id, target: target_user_id } });
  }

  /**
   * Follow {user_id} from logged user.
   */
  follow(user_id: string) {
    return this.post('relationships/' + user_id);
  }

  /**
   * Unollow {user_id} from logged user.
   */
  unfollow(user_id: string) {
    return this.delete('relationships/' + user_id);
  }

  /**
   * Block {user_id} from logged user.
   */
  block(user_id: string) {
    return this.post('blocks/' + user_id);
  }

  /**
   * Unlock {user_id} from logged user.
   */
  unblock(user_id: string) {
    return this.delete('blocks/' + user_id);
  }

  /**
   * Get followers of logged user. Cursor the result using {since} and {until}.
   */
  followers(since?: string, until?: string, size?: string) {
    return this.get('relationships/followers', { params: { since, until, size } });
  }

  /**
   * Get followings of logged user. Cursor the result using {since} and {until}.
   */
  followings(since?: string, until?: string, size?: string) {
    return this.get('relationships/followings', { params: { since, until, size } });
  }


  /* Notifications */

  /**
   * Get notifications of logged user. Cursor the result using {since} and {until}.
   */
  getNotifications(mark_as_seen = true, since?: string, until?: string, sort_by?: string) {
    return this.get('notifications', { params: { mark_as_seen: String(mark_as_seen), since, until, sort_by } });
  }

  /**
   * Remove {id}. (You can specify "all" to delete every notification).
   */
  removeNotification(id: string) {
    return this.delete('notifications/' + id);
  }

  /**
   * Get waiting questions and unseen notification counts.
   */
  getNotificationCount() {
    return this.get('notifications/count');
  }

  /**
   * Mark all notifications as seen.
   */
  notificationsAllMarkAsSeen() {
    return this.post('notifications/bulk_seen');
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
          if (value !== undefined)
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
          if (value === undefined)
            continue;

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
        if (value === undefined)
          continue;

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

  protected async handleResponse(with_request: boolean, response: Response) {
    // API always replies with JSON, even on error
    const length = response.headers.get('Content-Length');
    const result = await (length ? response.json() : Promise.resolve());

    if (response.ok) {
      if (with_request)
        return {
          response,
          result
        };
  
      return result;
    }

    return Promise.reject({
      type: 'QuestionItApiError',
      response,
      result,
    });
  }

  static isApiError(data: any) : data is WrappedApiError {
    return typeof data === 'object' && 'type' in data && data.type === 'QuestionItApiError';
  }
}

export default QuestionIt;
