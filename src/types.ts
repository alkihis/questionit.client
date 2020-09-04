/* FORMATTED API RESULTS */

export interface AccessTokenResult {
  token: string;
  user: SentUser;
}


/* REAL TYPES RETURNED BY API */

export type NotificationType = 'answered' | 'question' | 'follow' | 'follow-back';

export interface SentNotification {
  id: string;
  created_at: string;
  seen: boolean;
  type: NotificationType,
  /** Defined if {type} is 'answered' or 'question' */
  question?: SentQuestion,
  // Si follow: {type} is 'follow' or 'follow-back'.
  user?: SentUser;
}

export interface WrappedApiError {
  response: Response;
  result: QuestionItApiError;
}

export interface QuestionItApiError {
  code: number;
  message: string;
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
  id: string;
  name: string;
  slug: string;
  twitter_id: string;
  ask_me_message: string;
  created_at: string;
  profile_picture: string | null;
  banner_picture: string | null;
  allow_anonymous: boolean;
  default_send_twitter: boolean | null;
  allow_question_of_the_day: boolean | null;
  visible: boolean;

  // Advanced infos
  pinned_question?: SentQuestion;
  question_count: number;
  follower_count: number;
  following_count: number;
  relationship?: SentRelationship;
  drop_on_block_match?: boolean;
  safe_mode?: boolean;
}

export interface SentQuestion {
  id: string;
  emitter: SentUser | null;
  receiver: SentUser;
  like_count: number;
  created_at: string;
  content: string;
  seen: boolean;
  answer: string | null;
  answer_created_at: string;
  in_reply_to: string | null;
  reply_count: number;
  liked: boolean;
  of_the_day: boolean;
  image: string | null;
  is_gif: boolean;
  attachements?: SentQuestionAttachements;
}

export interface SentQuestionAttachements {
  poll?: SentPoll;
}

export interface SentPoll {
  id: string;
  options: string[];
}

export interface SentRelationship {
  following: boolean;
  followed_by: boolean;
  has_blocked: boolean;
  is_blocked_by: boolean;
}
