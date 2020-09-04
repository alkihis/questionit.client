# QuestionIt.space official client

Use the QuestionIt.space API with this simple client inspirated by [twitter-lite](https://www.npmjs.com/package/twitter-lite).

> This is a WIP. It should be completed later.

## Getting started

You can use this package both in browser and Node.js.

Install it through NPM.
```bash
npm i questionit
```

## Basics

See API documentation for endpoint details.

**Everytime a link between a type bundled in this package and API return type is available, it will be presented into API docs.**

### Requesting the API

First, instantiate the default export of this package.

```ts
import QuestionIt from 'questionit';

// Instantiate the default export without any argument.
const questionit = new QuestionIt;
```

After, use an object method corresponding to desired HTTP method.

```ts
questionit.get(endpoint, options);
questionit.post(endpoint, options);
questionit.put(endpoint, options);
// ...
```

**Endpoint** parameter is the remaining part after `https://api.questionit.space/` URL.

For example, for endpoint `https://api.questionit.space/users/find`, parameter should be `users/find`.

Second parameter is **options**. Options are `params` (query or body), specific `headers`, custom (or disabled) `auth` token, and `with_rq` option that allow returning the standard `Response` object beside the API JSON response.

```ts
interface QuestionItRequestParams {
  /** Specify here your query URL params or body content */
  params?: URLSearchParams | Record<string, string | number | boolean> | FormData;
  /** Useful if you want to set custom headers */
  headers?: Record<string, string> | Headers;
  /** Enable/disable auth (boolean), or force a specific Bearer token (string) */
  auth?: boolean | string;
  /** Enable return Response beside API response object */
  with_rq?: boolean;
}
```

### Make an unauthentificated request

```ts
import { SentUser } from 'questionit';

const user: SentUser = await questionit.get('users/id/1');

console.log(`This is user ${user.name}, @${user.slug}, whose created his account on ${user.created_at}.`);
```

### Make an authentificated request

This kind of request requires an **access token**. If you don't have it yet, jump to ***Authentification*** part.

You can specify your token inside `QuestionIt` constructor

```ts
const questionit = new QuestionIt('some-token-here');
```

or just use `setAccessToken()` method.

```ts
questionit.setAccessToken('some-token-here');
```

Token will be automatically added to request headers.

```ts
import { SentRelationship } from 'questionit';

const relationship: SentRelationship = await questionit.get('relationships/with/2');

console.log(`You ${relationship.following ? 'follow' : 'do not follow'} user #2`);
```

## Authentification

You can generate login tokens and get access token through this library.

### Get a request token

A request token is used to ask user to connect to your app.

```ts
const token = await questionit.getRequestToken(
  'app-key-here', 
  'redirect-url-after-confirm-or-deny' // or 'oob' for no redirection
);

const token_encoded = encodeURIComponent(token);
const url = 'https://questionit.space/appflow?token=' + token_encoded;

// Send user to {url} !
```

### Get access token

Once user has approved the app, he will be redirected to your redirect URL (or will have an access PIN displayed).

For redirect URLs, there's formed like: 
`https://yoursite.com?token={token}&validator={validator}`.

You can extract both `token` and `validator` from query string, they're needed to generate access token.

```ts
import { AccessTokenResult } from 'questionit';

const result: AccessTokenResult = await questionit.getAccessToken(
  'app-key-here',
  'token-here',
  'validator-or-PIN-here'
);

console.log(`Access token is ${result.token}.`);
```

You can now use this token with the instance.

```ts
questionit.setAccessToken(result.token);
```
