export interface DbWorkoutObject {
  id: number;
  name: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseNewWorkoutResponse {
  rows: DbWorkoutObject[];
}
