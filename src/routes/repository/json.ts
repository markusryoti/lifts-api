interface WorkoutJsonItem {
  workout_id: string;
  workout_name: string;
  workout_created_at: Date;
  set_id: string;
  reps: number;
  weight: number;
  user_movement_id: string;
  movement_id: string;
  movement_name: string;
  set_created_at: Date;
}

export interface ISet {
  set_id: string;
  reps: number;
  weight: number;
  user_movement_id: string;
  movement_id: string;
  movement_name: string;
  set_created_at: Date;
}

export interface IWorkoutOut {
  workout_id: string;
  workout_name: string;
  workout_created_at: Date;
  sets: ISet[];
}

export const workoutSetRowObjectsToWorkouts = (
  json: Array<WorkoutJsonItem>
) => {
  const workouts: any = {};

  //  Loop through the json and convert set rows to workout objectss
  json.forEach((item: WorkoutJsonItem) => {
    const workoutId = item.workout_id.toString();
    const {
      workout_name,
      workout_created_at,
      set_id,
      reps,
      weight,
      user_movement_id,
      movement_id,
      movement_name,
      set_created_at,
    } = item;

    const workoutData: IWorkoutOut = {
      workout_id: workoutId,
      workout_name,
      workout_created_at,
      sets: [],
    };
    const setData: ISet = {
      set_id,
      reps,
      weight,
      user_movement_id,
      movement_id,
      movement_name,
      set_created_at,
    };

    if (workouts[workoutId] === undefined) {
      workouts[workoutId] = workoutData;
      workouts[workoutId]['sets'] = [setData];
    } else {
      workouts[workoutId]['sets'].push(setData);
    }
  });

  // Sort workouts
  const sortedWorkouts = Object.values(workouts).sort(
    (workout1: any, workout2: any) =>
      workout2.workout_created_at - workout1.workout_created_at
  );

  // Sort sets in workouts
  // Now with set ids, maybe change to timestamps
  sortedWorkouts.forEach((workout: any) => {
    workout.sets.sort((a: any, b: any) => a.set_id - b.set_id);
  });

  // Transform that sets are listed under a movement name
  const transformed = sortedWorkouts.map((workout: any): any => {
    const movements: any = {};
    const sets = workout.sets;

    sets.forEach((set: ISet) => {
      if (movements[set.movement_name] === undefined) {
        movements[set.movement_name] = [set];
      } else {
        movements[set.movement_name].push(set);
      }
    });

    return {
      ...workout,
      movements: movements,
    };
  });

  // No need for sets anymore
  transformed.forEach((workout: any) => {
    delete workout.sets;
  });

  return transformed;
};
