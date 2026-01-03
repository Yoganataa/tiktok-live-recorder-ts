export interface RoomResolveResult {
  roomId: string | null;
  blocked?: boolean;
}

export interface RoomResolver {
  resolve(username: string): Promise<RoomResolveResult>;
}