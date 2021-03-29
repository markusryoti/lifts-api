import { DbWorkoutSet, ISet } from './sets';

export interface IWorkout {
  workout_id: string;
  workout_name: string;
  workout_created_at: Date;
  workout_updated_at: Date;
  sets: ISet[];
}

export const workoutSetRowObjectsToWorkouts = (json: Array<DbWorkoutSet>) => {
  const workouts: any = {};

  //  Loop through the json and convert set rows to workout objectss
  json.forEach((item: DbWorkoutSet) => {
    const workoutId = item.workout_id.toString();
    const {
      workout_name,
      workout_created_at,
      workout_updated_at,
      set_id,
      reps,
      weight,
      user_movement_id,
      movement_id,
      movement_name,
      set_created_at,
      set_updated_at,
    } = item;

    const workoutData: IWorkout = {
      workout_id: workoutId,
      workout_name,
      workout_created_at,
      workout_updated_at,
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
      set_updated_at,
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

  return sortedWorkouts;
};
