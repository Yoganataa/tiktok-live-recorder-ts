export enum Mode {
  MANUAL = 0,
  AUTOMATIC = 1,
  FOLLOWERS = 2
}

export enum StatusCode {
  OK = 200,
  MOVED = 301,
  REDIRECT = 302
}

export enum TimeOut {
  ONE_MINUTE = 60,
  AUTOMATIC_MODE = 5,
  CONNECTION_CLOSED = 2
}

export enum TikTokError {
  USER_NOT_CURRENTLY_LIVE = "The user is not hosting a live stream at the moment.",
  ACCOUNT_PRIVATE_FOLLOW = "This account is private. Follow the creator to access their LIVE.",
  ACCOUNT_PRIVATE = "Account is private, login required. Please add your cookies to cookies.json",
  COUNTRY_BLACKLISTED = "Captcha required or country blocked. Use a VPN, room_id, or authenticate with cookies.",
  COUNTRY_BLACKLISTED_AUTO_MODE = "Automatic mode is available only in unblocked countries. Use a VPN or authenticate with cookies.",
  COUNTRY_BLACKLISTED_FOLLOWERS_MODE = "Followers mode is available only in unblocked countries. Use a VPN or authenticate with cookies.",
  USERNAME_ERROR = "Username / RoomID not found or the user has never been in live.",
  ROOM_ID_ERROR = "Error extracting RoomID",
  RETRIEVE_LIVE_URL = "Unable to retrieve live streaming url. Please try again later.",
  INVALID_TIKTOK_LIVE_URL = "The provided URL is not a valid TikTok live stream.",
  LIVE_RESTRICTION = "Live is private, login required. Please add your cookies to cookies.json"
}

export enum Error {
  CONNECTION_CLOSED = "Connection broken by the server.",
  CONNECTION_CLOSED_AUTOMATIC = "Connection broken by the server. Try again after delay of 2 minutes"
}

import * as packageJson from '../../package.json';

const VERSION = packageJson.version;

export const Info: {
  VERSION: string;
  NEW_FEATURES: string[];
  BANNER: string;
} = {
  VERSION,
  NEW_FEATURES: [
    "Fixed interrupt issue when using Ctrl+C"
  ],
  BANNER: `

 ████████ ███████ ████████  ██████  ██   ██
    ██    ██         ██    ██    ██ ██  ██ 
    ██    ███████    ██    ██    ██ █████  
    ██         ██    ██    ██    ██ ██  ██ 
    ██    ███████    ██     ██████  ██   ██

   V${VERSION}
`
};

export const Regex = {
  IS_TIKTOK_LIVE: /.*www\.tiktok\.com.*|.*vm\.tiktok\.com.*/
};