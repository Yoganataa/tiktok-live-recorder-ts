// src/client/HttpClient.ts
import { fetch, ProxyAgent, Agent } from 'undici';

import { logger } from '../utils/logger';

import type { RequestInit, Response } from 'undici';
import type { ZodType } from 'zod';

export interface HttpClientOptions {
  proxy?: string;
  cookies?: Record<string, string>;
}

interface RequestOptions<T = unknown> extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  retries?: number;
  schema?: ZodType<T>;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

export class HttpClient {
  private readonly agent: ProxyAgent | Agent;
  private readonly cookieHeader?: string;
  private readonly userAgent: string;

  constructor(options: HttpClientOptions = {}) {
    if (options.proxy) {
      this.agent = new ProxyAgent(options.proxy);
    } else {
      this.agent = new Agent({
        connect: {
          timeout: 30_000,
        },
        bodyTimeout: 30_000,
        headersTimeout: 30_000,
        keepAliveTimeout: 10_000,
        keepAliveMaxTimeout: 10_000,
      });
    }

    if (options.cookies) {
      this.cookieHeader = Object.entries(options.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    }
    this.userAgent =
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] ?? USER_AGENTS[0]!;
  }

  private buildHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'user-agent': this.userAgent,
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      referer: 'https://www.tiktok.com/',
      ...customHeaders, // Custom headers will override defaults
    };

    // Special handling: if Referer is explicitly empty string, remove it entirely
    if (customHeaders['referer'] === '') {
      delete headers['referer'];
    }

    if (this.cookieHeader) {
      headers['cookie'] = this.cookieHeader;
    }
    return headers;
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private shouldRetry(status: number | undefined, error?: unknown): boolean {
    if (!status && error) return true;
    if (status) {
      if (status === 429) return true;
      if (status >= 500) return true;
      if (status >= 400 && status < 500) return false;
    }
    return false;
  }

  private getRetryDelay(attempt: number, status?: number): number {
    if (status === 429) {
      const base = 5000;
      return base * (attempt + 1);
    }
    return Math.pow(2, attempt) * 1000;
  }

  /**
   * Internal wrapper to perform the raw fetch request with configured agent and headers.
   */
  private async makeRequest(url: string, options: RequestOptions): Promise<Response> {
    const headers = this.buildHeaders(options.headers);
    const res = await fetch(url, {
      ...options,
      dispatcher: this.agent,
      headers,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return res;
  }

  /**
   * Centralized retry logic wrapper.
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    url: string,
    options: RequestOptions,
  ): Promise<T> {
    const maxRetries = options.retries ?? 3;
    let lastError: Error | unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        if (err instanceof Error && err.message.startsWith('API Schema Validation')) {
          throw err;
        }

        let status: number | undefined;
        if (err instanceof Error) {
          const match = err.message.match(/HTTP (\d{3})/);
          if (match) status = parseInt(match[1]!, 10);
        }

        if (!this.shouldRetry(status, err)) {
          throw err;
        }

        if (attempt < maxRetries && !options.signal?.aborted) {
          const delay = this.getRetryDelay(attempt, status);
          const logLevel = status === 429 ? 'warn' : 'debug';
          logger[logLevel](
            {
              url,
              attempt: attempt + 1,
              status: status || 'NetworkError',
              delay,
            },
            `Request failed. Retrying...`,
          );
          await this.wait(delay);
          continue;
        }
      }
    }
    throw lastError;
  }

  async get<T = unknown>(url: string, options: RequestOptions<T> = {}): Promise<T> {
    return this.executeWithRetry(async () => {
      const res = await this.makeRequest(url, options);
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      let data: unknown;

      if (contentType.includes('application/json')) {
        try {
          data = text ? JSON.parse(text) : {};
        } catch (err) {
          throw new Error(
            `JSON Parse Error: ${(err as Error).message}. Body Preview: ${text.slice(0, 50)}`,
          );
        }
      } else {
        data = text;
      }

      if (options.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          const errorMsg = result.error.issues
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join(', ');
          throw new Error(`API Schema Validation Failed: ${errorMsg}`);
        }
        return result.data;
      }

      return data as T;
    }, url, options);
  }

  async getStream(url: string, options: RequestOptions = {}): Promise<ReadableStream<Uint8Array>> {
    return this.executeWithRetry(async () => {
      const res = await this.makeRequest(url, options);
      if (res.body) {
        return res.body as ReadableStream<Uint8Array>;
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText} - No content body`);
    }, url, options);
  }
}