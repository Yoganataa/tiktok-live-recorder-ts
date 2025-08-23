export class TikTokRecorderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TikTokRecorderError';
  }
}

export class UserLiveError extends TikTokRecorderError {
  constructor(message: string) {
    super(message);
    this.name = 'UserLiveError';
  }
}

export class IPBlockedByWAF extends TikTokRecorderError {
  constructor(message: string = "IP blocked by WAF") {
    super(message);
    this.name = 'IPBlockedByWAF';
  }
}

export class LiveNotFound extends TikTokRecorderError {
  constructor(message: string) {
    super(message);
    this.name = 'LiveNotFound';
  }
}

export class ArgsParseError extends TikTokRecorderError {
  constructor(message: string) {
    super(message);
    this.name = 'ArgsParseError';
  }
}

export class NetworkError extends TikTokRecorderError {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}