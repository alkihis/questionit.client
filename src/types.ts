/* FORMATTED API RESULTS */

export interface AccessTokenResult {
  token: string;
  user: SentUser;
}

export interface PollResult {
  /** Poll ID to specify in POST questions endpoints. */
  poll_id: string;
  /** UNIX timestamp until poll ID stays valid. */
  until: number;
}

export interface QuestionTree {
  /** Sorted ancestors. First one is the oldest one. */
  ancestors: SentQuestion[];
  /** Root question. */
  question: SentQuestion;
}

export interface TokenVerifyResult {
  user: SentUser;
  rights: { [name: string]: 'true' | 'false' };
}

export interface CursoredLikes<T> {
  /** previous is a cursor meant to be used as "since" parameter to get the newer ones */
  previous_cursor: string,
  /** next is a cursor meant to be used as "until" parameter to get likes made before returned ones */
  next_cursor: string,
  /** `SentUser` of likers */
  likes: T[],
} 

export interface CursoredFollowers {
  /** previous is a cursor meant to be used as "since" parameter to get the newer ones */
  previous_cursor: string,
  /** next is a cursor meant to be used as "until" parameter to get likes made before returned ones */
  next_cursor: string,
  /** `SentUser` array of followers */
  followers: SentUser[],
} 

export interface CursoredFollowings {
  /** previous is a cursor meant to be used as "since" parameter to get the newer ones */
  previous_cursor: string,
  /** next is a cursor meant to be used as "until" parameter to get likes made before returned ones */
  next_cursor: string,
  /** `SentUser` array of followings */
  followings: SentUser[],
} 

export interface QuestionNotificationCount {
  /** Awaiting question count */
  question_count: number;
  /** Unseen notification count */
  notification_count: number;
}

/* GENERIC TYPES RETURNED BY API */

export type NotificationType = 'answered' | 'question' | 'follow' | 'follow-back';

export interface SentNotification {
  /** Notification ID */
  id: string;
  /** ISO date of notification creation */
  created_at: string;
  /** If the notification has been seen by the user */
  seen: boolean;
  /** Notification typeo */
  type: NotificationType,
  /** Defined if {type} is 'answered' or 'question' */
  question?: SentQuestion,
  /** If follow: {type} is 'follow' or 'follow-back'. */
  user?: SentUser;
}

export interface WrappedApiError {
  response: Response;
  result: QuestionItApiError;
}

export interface QuestionItApiError {
  /** API error code (have a correspondance in QuestionItApiErrors enumeration) */
  code: number;
  /** Human-readable error message */
  message: string;
  /** HTTP status code, duplicated */
  status_code: number;
}

export enum QuestionItApiErrors {
  // 400 HTTP Errors
  BadRequest = 1,
  MissingParameter,
  InvalidParameter,
  AskedUserMismatch,
  RelationShouldBeBetweenTwoDifferentUsers,
  SlugAlreadyUsed,
  DayQuestionExpired,
  UnsupportedLanguage,
  TooLongQuestion,
  TooLongAnswer,
  NameInvalidCharacters,
  SlugInvalidCharacters,
  InvalidSentFile,
  InvalidSentHeader,
  InvalidSentProfilePicture,
  InvalidPollAnswer,
  TakenPoll,
  NonUniquePoll,
  TokenAlreadyApproved,

  // 401 HTTP Errors
  InvalidExpiredToken = 100,
  TokenMismatch,
  AlreadyAnswered,

  // 403 HTTP Errors
  Forbidden = 200,
  DontAllowAnonymousQuestions,
  AskerUserMismatch,
  InvalidTwitterCredentials,
  InvalidTwitterCallbackKeys,
  CantSendQuestionToYourself,
  TooManyReplies,
  NotAnsweredYet,
  BlockByThisUser,
  HaveBlockedThisUser,
  BannedUser,
  TokenNotAffilated,
  TooManyApplications,
  SameAppName,
  InvalidTokenRights,

  // 404 HTTP Errors
  UserNotFound = 300,
  PageNotFound,
  ResourceNotFound,
  OriginalQuestionNotFound,
  QuestionNotFound,
  PollNotFound,
  ApplicationNotFound,

  // 429
  TooManyRequests = 450,

  // 500 HTTP Errors
  ServerError = 500,
}

export interface SentUser {
  /** User ID */
  id: string;
  /** User conventional name */
  name: string;
  /** User @ */
  slug: string;
  /** Twitter user.id_str */
  twitter_id: string;
  /** User message displayed on profile question box */
  ask_me_message: string;
  /** User creation ISO date */
  created_at: string;
  /** Absolute link to profile picture */
  profile_picture: string | null;
  /** Absolute link to banner */
  banner_picture: string | null;
  /** If user accepts anon questions or not */
  allow_anonymous: boolean;
  /** If user is visible in searches or not */
  visible: boolean;
  /** Number of questions */
  question_count: number;
  /** Number of followers */
  follower_count: number;
  /** Number of followings */
  following_count: number;
  /** Pinned question (only sent by users/* endpoints) */
  pinned_question?: SentQuestion;

  // Personal infos
  /** If user wants to send questions to Twitter automatically or not (null if this user is not you) */
  default_send_twitter: boolean | null;
  /** If user wants to see QOTD in their waiting question page (null if this user is not you) */
  allow_question_of_the_day: boolean | null;
  /** Your relationship with this user (only sent by numerous users/* endpoints) */
  relationship?: SentRelationship;
  /** If user wants to auto-delete questions that match muted words (undefined if not you) */
  drop_on_block_match?: boolean;
  /** If user wants to have safe mode (undefined if not you) */
  safe_mode?: boolean;
}

export interface SentQuestion {
  /** Question ID */
  id: string;
  /** User object of emitter if any, null if anonymous */
  emitter: SentUser | null;
  /** User object of receiver */
  receiver: SentUser;
  /** Number of likes */
  like_count: number;
  /** Creation date of question */
  created_at: string;
  /** Question text */
  content: string;
  /** @deprecated unused */
  seen: boolean;
  /** Answer text */
  answer: string | null;
  /** Answser date (null if not answered) */
  answer_created_at: string | null;
  /** Question reply ID if this question is a reply, null otherwise */
  in_reply_to: string | null;
  /** Number of replies */
  reply_count: number;
  /** If this question has been liked by logged user (undefined if anonymous) */
  liked: boolean;
  /** If the question is a QOTD */
  of_the_day: boolean;
  /** Absolute path if an image is linked to this question, null otherwise */
  image: string | null;
  /** true if GIF is present in `image` key, false otherwise */
  is_gif: boolean;
  /** Question attachements (undefined if none) */
  attachements?: SentQuestionAttachements;
}

export interface SentQuestionAttachements {
  /** Possible attached poll */
  poll?: SentPoll;
}

export interface SentPoll {
  /** Poll ID */
  id: string;
  /** Poll choices */
  options: string[];
}

export interface SentRelationship {
  /** true if source user is following target user */
  following: boolean;
  /** true if target user is following source user */
  followed_by: boolean;
  /** true if source user has blocked target user */
  has_blocked: boolean;
  /** true if target user has blocked source user */
  is_blocked_by: boolean;
}
