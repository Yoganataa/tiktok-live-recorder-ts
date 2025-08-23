import * as crypto from 'crypto';
import { IPBlockedByWAF } from '../utils/custom-exceptions';

export class WAFSolver {
  static solve(htmlContent: string): Record<string, string> {
    function fixBase64Padding(b64String: string): string {
      const paddingNeeded = (4 - b64String.length % 4) % 4;
      return b64String + ('='.repeat(paddingNeeded));
    }

    // Extract wci
    const wciMatch = htmlContent.match(/<p\s+[^>]*id=["']wci["'][^>]*class=["']([^"']+)["']/);
    if (!wciMatch) {
      throw new Error("wci not found in HTML");
    }
    const wci = wciMatch[1];

    // Extract cs
    const csMatch = htmlContent.match(/<p\s+[^>]*id=["']cs["'][^>]*class=["']([^"']+)["']/);
    if (!csMatch) {
      throw new Error("cs not found in HTML");
    }
    const cs = csMatch[1];

    // Decode json from base64
    const c = JSON.parse(Buffer.from(fixBase64Padding(cs), 'base64').toString());
    const prefix = Buffer.from(c.v.a, 'base64');
    const expect = Buffer.from(c.v.c, 'base64').toString('hex');

    for (let i = 0; i < 1000000; i++) {
      const tried = crypto.createHash('sha256')
        .update(Buffer.concat([prefix, Buffer.from(i.toString())]))
        .digest('hex');
      
      if (expect === tried) {
        const d = Buffer.from(i.toString()).toString('base64');
        c.d = d;
        const result = JSON.stringify(c);
        const cookie = Buffer.from(result).toString('base64');
        return { [wci]: cookie };
      }
    }

    throw new IPBlockedByWAF();
  }
}
