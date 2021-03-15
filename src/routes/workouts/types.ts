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

interface ISet {
  reps: number;
  weight: number;
}

interface IMovementSection {
  name: string;
  sets: ISet[];
}

export interface IWorkout {
  name: string;
  movements: IMovementSection[];
  createdAt: string;
}
