interface WorkoutJsonItem {
  workout_id: string;
  workout_name: string;
  workout_created_at: Date;
  set_id: string;
  reps: number;
  weight: number;
  movement_name: string;
  set_created_at: Date;
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
      movement_name,
      set_created_at,
    } = item;

    const workoutData: any = {
      workout_id: workoutId,
      workout_name,
      workout_created_at,
    };
    const setData = { set_id, reps, weight, movement_name, set_created_at };

    workoutData['sets'] = setData;

    if (workouts[workoutId] === undefined) {
      workouts[workoutId] = workoutData;
      workouts[workoutId]['sets'] = [setData];
    } else {
      workouts[workoutId]['sets'].push(setData);
    }
  });
  return Object.values(workouts);
};
