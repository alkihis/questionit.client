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
`https://yoursite.com/callback?validator={validator}`.

You can extract `validator` from query string, they're needed to generate access token.

```ts
import { AccessTokenResult } from 'questionit';

const result: AccessTokenResult = await questionit.getAccessToken(
  'app-key-here',
  // You need to have original token, it should be stored somewhere on your side. 
  // You can give an unique key into callback URL (like in query),
  // it will be keeped.
  'token-here', 
  'validator-or-PIN-here'
);

console.log(`Access token is ${result.token}.`);
```

You can now use this token with the instance.

```ts
questionit.setAccessToken(result.token);
```

## Errors

When a non-success HTTP status code is given, the request will end in a rejected promise.

The rejected promise contain the following interface:

```ts
interface WrappedApiError {
  type: 'QuestionItApiError';
  response: Response;
  result: QuestionItApiError;
}
```

```ts
try {
  const res = await client.get('users');
} catch (e) {
  if (QuestionIt.isApiError(e)) {
    console.log(e.result);
  }
}
```


## Endpoint-based methods

This Python library binds most of the endpoints of the API to specific methods, so you don't need to handle boring things by yourself.
Their usage is pretty straight-forward and don't need to be explained (the method parameters are usually whats API is taking), except for a few methods (see below).

The following methods exists:
- `.verifyToken` -> `GET auth/token/verify`
- `.revokeToken` -> `DELETE auth/token`
- `.findUsers` -> `GET users/find`
- `.getUser` -> `GET users/id/:id` and `GET users/slug/:slug`
- `.getLogged` -> `GET users/logged`
- `.setPinned` -> `PATCH questions/pin`
- `.removePinned` -> `DELETE questions/pin`
- `.setMutedWords` -> `POST users/blocked_words`
- `.getMutedWords` -> `GET users/blocked_words`
- `.ask` -> `POST questions`, `POST questions/anonymous` and `POST polls`
- `.waitingQuestions` -> `GET questions/waiting`
- `.reply` -> `POST questions/answer`
- `.removeQuestion` -> `DELETE questions`
- `.removeMutedQuestions` -> `DELETE questions/masked`
- `.like` -> `POST likes`
- `.unlike` -> `DELETE likes`
- `.likersOf` -> `GET likes/list/:id`
- `.likersIdsOf` -> `GET likes/ids/:id`
- `.questionsOf` -> `GET questions`
- `.askedQuestionsOf` -> `GET questions/sent`
- `.homeTimeline` -> `GET questions/timeline`
- `.ancestorsOf` -> `GET questions/tree/:root`
- `.repliesOf` -> `GET questions/replies/:id`
- `.relationshipWith` -> `GET relationships/with/:id`
- `.relationshipBetween` -> `GET relationships/between`
- `.follow` -> `POST relationships/:id`
- `.unfollow` -> `DELETE relationships/:id`
- `.followers` -> `GET relationships/followers`
- `.followings` -> `GET relationships/followings`
- `.block` -> `POST blocks/:id`
- `.unblock` -> `DELETE blocks/:id`
- `.getNotifications` -> `GET notifications`
- `.removeNotification` -> `DELETE notifications/:id`
- `.getNotificationCount` -> `GET notifications/count`
- `.notificationsAllMarkAsSeen` -> `POST notifications/bulk_seen`

### .getUser

This method can fetch an user by user ID or by slug.

It automatically choose between ID and slug regarding the given string ; if it's numeric, ID endpoint will be used.

```ts
client.getUser('2');  # calls users/id/2
client.getUser('questionitspace');  # calls users/slug/questionitspace
```

### .ask

You can attach multiple choices "polls" directly with this method.
Just give a simple list of strings in the `poll` parameter.

```ts
client.ask('Cat or dog?', '2', true, '36', ['Cats!!', 'Dogs :(']);
```

### .reply

When you reply to a question, you can attach medias (JPEG, PNG and GIF images).

You must attach the picture in the `picture` parameter of `.reply` by following this example:

```ts
import fs from 'fs';

const path = 'path-to-file.ext';

client.reply(
  'Yes, cats are the best.', 
  '32',
  false,
  fs.createReadStream(path),
);
```
