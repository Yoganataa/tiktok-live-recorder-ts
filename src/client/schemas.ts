// src/client/schemas.ts
import { z } from 'zod';

export const RoomAliveSchema = z.object({
  data: z
    .array(
      z.object({
        alive: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const StreamUrlSchema = z.object({
  live_core_sdk_data: z
    .object({
      pull_data: z
        .object({
          stream_data: z.string().optional(),
          options: z
            .object({
              qualities: z
                .array(
                  z.object({
                    sdk_key: z.string(),
                    level: z.number(),
                    name: z.string().optional(),
                  }),
                )
                .optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
  flv_pull_url: z.record(z.string(), z.string()).optional(),
  rtmp_pull_url: z.string().optional(),
});

export const RoomInfoSchema = z.object({
  data: z
    .object({
      stream_url: StreamUrlSchema.optional(),
    })
    .optional(),
  status_code: z.number().optional(),
});

// Structure for the Webcast Feed (List of LIVE users)
export const WebcastFeedSchema = z.object({
  data: z
    .object({
      data: z
        .array(
          z.object({
            data: z
              .object({
                user: z
                  .object({
                    unique_id: z.string().optional(),
                    nickname: z.string().optional(),
                  })
                  .optional(),
                room: z
                  .object({
                    room_id: z.string().optional(),
                  })
                  .optional(),
              })
              .optional(),
          }),
        )
        .optional(),
      has_more: z.boolean().optional(),
    })
    .optional(),
});
