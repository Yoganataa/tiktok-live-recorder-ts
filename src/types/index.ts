export interface CookiesConfig {
  sessionid_ss: string;
  'tt-target-idc': string;
}

export interface TelegramConfig {
  api_id: string;
  api_hash: string;
  bot_token: string;
  chat_id: number;
}

export interface StreamData {
  data: Record<string, any>;
}

export interface RoomInfo {
  data: {
    owner: {
      display_id: string;
    };
    stream_url: {
      live_core_sdk_data?: {
        pull_data?: {
          stream_data: string;
          options?: {
            qualities: Array<{
              sdk_key: string;
              level: number;
            }>;
          };
        };
      };
      flv_pull_url?: {
        FULL_HD1?: string;
        HD1?: string;
        SD2?: string;
        SD1?: string;
      };
      rtmp_pull_url?: string;
    };
  };
  status_code?: number;
}

export interface UserRoomData {
  data?: {
    user?: {
      roomId: string;
    };
  };
}

export interface FollowersData {
  userList: Array<{
    user: {
      uniqueId: string;
    };
  }>;
  hasMore: boolean;
  minCursor: number;
}
