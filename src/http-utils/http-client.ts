import axios, { AxiosInstance } from 'axios';
import { StatusCode } from '../utils/enums';
import { logger } from '../utils/logger-manager';
import { CookiesConfig } from '../types';

export class HttpClient {
  public req: AxiosInstance;
  public reqStream: AxiosInstance;

  private proxy?: string;
  private cookies?: CookiesConfig;
  private headers = {
    'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Accept-Language': 'en-US',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.127 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,application/json,text/plain,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'document',
    'Priority': 'u=0, i',
    'Referer': 'https://www.tiktok.com/',
    'Origin': 'https://www.tiktok.com'
  };

  constructor(proxy?: string, cookies?: CookiesConfig) {
    this.proxy = proxy;
    this.cookies = cookies;

    // Create regular axios instance
    this.req = axios.create({
      headers: this.headers,
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });

    // Create streaming axios instance
    this.reqStream = axios.create({
      headers: this.headers,
      timeout: 0, // No timeout for streaming
      responseType: 'stream',
      maxRedirects: 5
    });

    this.configureSession();
  }

  private configureSession(): void {
    // Set up cookies
    if (this.cookies) {
      const cookieString = Object.entries(this.cookies)
        .filter(([, value]) => value) // Only include non-empty values
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      
      if (cookieString) {
        this.req.defaults.headers.Cookie = cookieString;
        this.reqStream.defaults.headers.Cookie = cookieString;
      }
    }

    // Set up proxy if provided
    if (this.proxy) {
      this.checkProxy();
    }
  }

  private async checkProxy(): Promise<void> {
    if (!this.proxy) {
      return;
    }

    try {
      logger.info(`Testing ${this.proxy}...`);
      
      const proxyConfig = this.parseProxy(this.proxy);
      
      // Test the proxy with a simple request
      const testInstance = axios.create({
        proxy: proxyConfig,
        timeout: 10000
      });

      const response = await testInstance.get('https://ifconfig.me/ip');

      if (response.status === StatusCode.OK) {
        this.req.defaults.proxy = proxyConfig;
        this.reqStream.defaults.proxy = proxyConfig;
        logger.info("Proxy set up successfully");
      }
    } catch (error) {
      logger.error(`Proxy test failed: ${error}`);
      logger.warning("Continuing without proxy...");
    }
  }

  private parseProxy(proxyString: string) {
    try {
      const url = new URL(proxyString);
      return {
        protocol: url.protocol.replace(':', ''),
        host: url.hostname,
        port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
        auth: url.username && url.password ? {
          username: url.username,
          password: url.password
        } : undefined
      };
    } catch (error) {
      // Fallback parsing for simple host:port format
      const parts = proxyString.split(':');
      if (parts.length >= 2) {
        return {
          protocol: 'http',
          host: parts[0],
          port: parseInt(parts[1]) || 8080
        };
      }
      throw new Error(`Invalid proxy format: ${proxyString}`);
    }
  }
}