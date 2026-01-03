export class TikTokError extends Error {
  public readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'TikTokError';
    this.code = code;
    Object.setPrototypeOf(this, TikTokError.prototype);
  }
}

export class UserNotLiveError extends TikTokError {
  constructor(message: string) {
    super(message, 'USER_NOT_LIVE');
    this.name = 'UserNotLiveError';
    Object.setPrototypeOf(this, UserNotLiveError.prototype);
  }
}

export class CountryBlockedError extends TikTokError {
  constructor(message: string) {
    super(message, 'COUNTRY_BLOCKED');
    this.name = 'CountryBlockedError';
    Object.setPrototypeOf(this, CountryBlockedError.prototype);
  }
}

export class LiveNotFoundError extends TikTokError {
  constructor(message: string) {
    super(message, 'LIVE_NOT_FOUND');
    this.name = 'LiveNotFoundError';
    Object.setPrototypeOf(this, LiveNotFoundError.prototype);
  }
}

export class WAFBlockedError extends TikTokError {
  constructor(message: string) {
    super(message, 'WAF_BLOCKED');
    this.name = 'WAFBlockedError';
    Object.setPrototypeOf(this, WAFBlockedError.prototype);
  }
}
