export interface DbMovementObject {
  id: number;
  name: string;
}

export interface DbUserMovementObject {
  id: number;
  movement_id: number;
  user_id: number;
}

export interface DbMovementUserMovementJoin {
  id: string;
  user_id: string;
  name: string;
}

export interface DatabaseMovementResponse {
  rows: DbMovementObject[];
}

export interface DatabaseUserMovementResponse {
  rows: DbUserMovementObject[];
}
