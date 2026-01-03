/**
 * Configuration interface for TikTok session cookies
 * @interface CookiesConfig
 */
export interface CookiesConfig {
  /** TikTok session ID for authentication */
  sessionid_ss: string;
  /** TikTok target IDC (data center) */
  'tt-target-idc': string;
  /** Additional cookie properties */
  [key: string]: string; // Allow additional cookie properties
}

/**
 * Configuration interface for Telegram upload settings
 * @interface TelegramConfig
 */
export interface TelegramConfig {
  /** Telegram API ID */
  api_id: string;
  /** Telegram API hash */
  api_hash: string;
  /** Telegram bot token */
  bot_token: string;
  /** Telegram chat ID for uploading recordings */
  chat_id: number;
}

/**
 * Stream main interface for TikTok live stream URLs
 * @interface StreamMain
 */
export interface StreamMain {
  /** FLV stream URL */
  flv?: string;
  /** HLS stream URL */
  hls?: string;
}

/**
 * Stream entry interface for TikTok live streams
 * @interface StreamEntry
 */
export interface StreamEntry {
  /** Main stream URLs */
  main?: StreamMain;
  /** Additional stream properties */
  [key: string]: any;
}

/**
 * Stream data interface containing stream entries
 * @interface StreamData
 */
export interface StreamData {
  /** Record of stream entries */
  data: Record<string, StreamEntry>;
}

/**
 * Stream quality interface for TikTok live streams
 * @interface StreamQuality
 */
export interface StreamQuality {
  /** SDK key for the stream quality */
  sdk_key: string;
  /** Quality level */
  level: number;
}

/**
 * Stream options interface for TikTok live streams
 * @interface StreamOptions
 */
export interface StreamOptions {
  /** Available stream qualities */
  qualities: StreamQuality[];
}

/**
 * Pull data interface for TikTok live streams
 * @interface PullData
 */
export interface PullData {
  /** Stream data as JSON string */
  stream_data?: string;
  /** Stream options */
  options?: StreamOptions;
}

/**
 * Live core SDK data interface
 * @interface LiveCoreSdkData
 */
export interface LiveCoreSdkData {
  /** Pull data for the live stream */
  pull_data?: PullData;
}

/**
 * FLV pull URL interface for different quality levels
 * @interface FlvPullUrl
 */
export interface FlvPullUrl {
  /** Full HD stream URL */
  FULL_HD1?: string;
  /** HD stream URL */
  HD1?: string;
  /** SD stream URL */
  SD2?: string;
  /** Low quality SD stream URL */
  SD1?: string;
}

/**
 * Stream URL data interface containing all stream URLs
 * @interface StreamUrlData
 */
export interface StreamUrlData {
  /** Live core SDK data */
  live_core_sdk_data?: LiveCoreSdkData;
  /** FLV pull URLs for different qualities */
  flv_pull_url?: FlvPullUrl;
  /** RTMP pull URL */
  rtmp_pull_url?: string;
}

/**
 * Owner interface for TikTok user information
 * @interface Owner
 */
export interface Owner {
  /** Display ID of the user */
  display_id?: string;
  /** Unique ID of the user */
  uniqueId?: string;
  /** Additional owner properties */
  [key: string]: any;
}

/**
 * Room data interface containing live stream information
 * @interface RoomData
 */
export interface RoomData {
  /** Owner information */
  owner?: Owner;
  /** Stream URLs */
  stream_url?: StreamUrlData;
  /** Additional room properties */
  [key: string]: any;
}

/**
 * Room info interface containing room data and status
 * @interface RoomInfo
 */
export interface RoomInfo {
  /** Room data */
  data?: RoomData;
  /** Status code */
  status_code?: number;
  /** Additional room info properties */
  [key: string]: any;
}

/**
 * User data interface containing room information
 * @interface UserData
 */
export interface UserData {
  /** Room ID */
  roomId?: string;
  /** Additional user data properties */
  [key: string]: any;
}

/**
 * User room response interface
 * @interface UserRoomResponse
 */
export interface UserRoomResponse {
  /** User data */
  user?: UserData;
  /** Additional response properties */
  [key: string]: any;
}

/**
 * User room data interface containing user room response
 * @interface UserRoomData
 */
export interface UserRoomData {
  /** User room response */
  data?: UserRoomResponse;
  /** Additional data properties */
  [key: string]: any;
}

/**
 * User info interface for TikTok users
 * @interface UserInfo
 */
export interface UserInfo {
  /** Unique ID of the user */
  uniqueId?: string;
  /** Additional user info properties */
  [key: string]: any;
}

/**
 * Follower user interface containing user information
 * @interface FollowerUser
 */
export interface FollowerUser {
  /** User information */
  user?: UserInfo;
  /** Additional follower properties */
  [key: string]: any;
}

/**
 * Followers data interface containing list of live followers
 * @interface FollowersData
 */
export interface FollowersData {
  /** List of follower users */
  userList?: FollowerUser[];
  /** Whether there are more followers */
  hasMore?: boolean;
  /** Minimum cursor for pagination */
  minCursor?: number;
  /** Additional followers data properties */
  [key: string]: any;
}

/**
 * Check alive data interface for verifying live status
 * @interface CheckAliveData
 */
export interface CheckAliveData {
  /** Array of alive status data */
  data?: Array<{
    /** Whether the stream is alive */
    alive?: boolean;
    /** Additional alive data properties */
    [key: string]: any;
  }>;
  /** Additional check alive data properties */
  [key: string]: any;
}