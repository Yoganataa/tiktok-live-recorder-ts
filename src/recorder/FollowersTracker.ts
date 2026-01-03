import { logger } from '../utils/logger';

export class FollowersTracker {
  private readonly active = new Map<string, Promise<void>>();

  has(user: string): boolean {
    return this.active.has(user);
  }

  add(user: string, task: Promise<void>): void {
    this.active.set(user, task);

    task.finally(() => {
      this.active.delete(user);
      logger.debug({ user }, 'Removed user from active recordings');
    });
  }

  size(): number {
    return this.active.size;
  }

  async stopAll(): Promise<void> {
    logger.info({ count: this.active.size }, 'Stopping all active recordings');
    await Promise.allSettled(this.active.values());
    this.active.clear();
  }
}