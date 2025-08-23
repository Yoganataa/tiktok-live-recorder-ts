export interface CookiesConfig {
  sessionid_ss: string;
  'tt-target-idc': string;
  [key: string]: string; // Allow additional cookie properties
}

export interface TelegramConfig {
  api_id: string;
  api_hash: string;
  bot_token: string;
  chat_id: number;
}

export interface StreamMain {
  flv?: string;
  hls?: string;
}

export interface StreamEntry {
  main?: StreamMain;
  [key: string]: any;
}

export interface StreamData {
  data: Record<string, StreamEntry>;
}

export interface StreamQuality {
  sdk_key: string;
  level: number;
}

export interface StreamOptions {
  qualities: StreamQuality[];
}

export interface PullData {
  stream_data?: string;
  options?: StreamOptions;
}

export interface LiveCoreSdkData {
  pull_data?: PullData;
}

export interface FlvPullUrl {
  FULL_HD1?: string;
  HD1?: string;
  SD2?: string;
  SD1?: string;
}

export interface StreamUrlData {
  live_core_sdk_data?: LiveCoreSdkData;
  flv_pull_url?: FlvPullUrl;
  rtmp_pull_url?: string;
}

export interface Owner {
  display_id?: string;
  uniqueId?: string;
  [key: string]: any;
}

export interface RoomData {
  owner?: Owner;
  stream_url?: StreamUrlData;
  [key: string]: any;
}

export interface RoomInfo {
  data?: RoomData;
  status_code?: number;
  [key: string]: any;
}

export interface UserData {
  roomId?: string;
  [key: string]: any;
}

export interface UserRoomResponse {
  user?: UserData;
  [key: string]: any;
}

export interface UserRoomData {
  data?: UserRoomResponse;
  [key: string]: any;
}

export interface UserInfo {
  uniqueId?: string;
  [key: string]: any;
}

export interface FollowerUser {
  user?: UserInfo;
  [key: string]: any;
}

export interface FollowersData {
  userList?: FollowerUser[];
  hasMore?: boolean;
  minCursor?: number;
  [key: string]: any;
}

export interface CheckAliveData {
  data?: Array<{
    alive?: boolean;
    [key: string]: any;
  }>;
  [key: string]: any;
}