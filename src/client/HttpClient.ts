import { fetch, ProxyAgent, RequestInit } from 'undici';

export interface HttpClientOptions {
  proxy?: string;
  cookies?: Record<string, string>;
}

interface RequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

export class HttpClient {
  private readonly agent?: ProxyAgent;
  private readonly cookieHeader?: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: HttpClientOptions = {}) {
    if (options.proxy) {
      this.agent = new ProxyAgent(options.proxy);
    }

    if (options.cookies) {
      this.cookieHeader = Object.entries(options.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    }

    this.defaultHeaders = {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
    };
  }

  async get<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    if (this.cookieHeader) {
      headers.cookie = this.cookieHeader;
    }

    const res = await fetch(url, {
      ...options,
      dispatcher: this.agent,
      headers,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    
    return (await res.text()) as T;
  }

  async getStream(url: string, options: RequestOptions = {}): Promise<ReadableStream<Uint8Array>> {
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    if (this.cookieHeader) {
      headers.cookie = this.cookieHeader;
    }

    const res = await fetch(url, {
      ...options,
      dispatcher: this.agent,
      headers,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    if (!res.body) {
      throw new Error('Response body is null');
    }

    return res.body as ReadableStream<Uint8Array>;
  }
}