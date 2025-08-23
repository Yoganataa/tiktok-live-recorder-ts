import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { StatusCode } from '../utils/enums';
import { logger } from '../utils/logger-manager';
import { CookiesConfig } from '../types';
import { isTermux } from '../utils/utils';

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

    this.req = axios.create({
      headers: this.headers,
      timeout: 30000
    });

    this.reqStream = axios.create({
      headers: this.headers,
      timeout: 0,
      responseType: 'stream'
    });

    this.configureSession();
  }

  private configureSession(): void {
    if (this.cookies) {
      const cookieString = Object.entries(this.cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      
      this.req.defaults.headers.Cookie = cookieString;
      this.reqStream.defaults.headers.Cookie = cookieString;
    }

    this.checkProxy();
  }

  private async checkProxy(): Promise<void> {
    if (!this.proxy) {
      return;
    }

    try {
      logger.info(`Testing ${this.proxy}...`);
      
      const response = await axios.get('https://ifconfig.me/ip', {
        proxy: this.parseProxy(this.proxy),
        timeout: 10000
      });

      if (response.status === StatusCode.OK) {
        this.req.defaults.proxy = this.parseProxy(this.proxy);
        this.reqStream.defaults.proxy = this.parseProxy(this.proxy);
        logger.info("Proxy set up successfully");
      }
    } catch (error) {
      logger.error(`Proxy test failed: ${error}`);
    }
  }

  private parseProxy(proxyString: string) {
    const url = new URL(proxyString);
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: parseInt(url.port),
      auth: url.username && url.password ? {
        username: url.username,
        password: url.password
      } : undefined
    };
  }
}