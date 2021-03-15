export interface DbUserObject {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseResponse {
  rows: DbUserObject[];
}
