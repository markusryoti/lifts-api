interface WorkoutJsonItem {
  workout_id: string;
}

export const workoutJsonFormatter = (json: Array<WorkoutJsonItem>) => {
  const workouts: any = {};
  json.forEach((item: WorkoutJsonItem) => {
    const workoutId = item.workout_id.toString();
    if (workouts[workoutId] === undefined) {
      workouts[workoutId] = [item];
    } else {
      workouts[workoutId].push(item);
    }
  });
  return workouts;
};
