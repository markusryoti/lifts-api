import db from '../../db';
import { workoutSetRowObjectsToWorkouts } from './json';

export interface DbWorkoutObject {
  id: number;
  name: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface DbNewWorkoutResponse {
  rows: DbWorkoutObject[];
}

interface ISet {
  movement_name: any;
  set_id: string;
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

interface DbWorkoutSet {
  set_id: string;
  reps: number;
  weight: number;
  workout_id: string;
  workout_created_at: Date;
  workout_name: string;
  movement_name: string;
  movement_id: string;
  user_movement_id: string;
  set_created_at: Date;
}

export const insertToMovementTable = async (
  movementNames: string[]
): Promise<string[]> => {
  const setMovementsSql = `
      INSERT INTO movements (name)
      VALUES 
      ${movementNames.map((_, index) => `($${index + 1})`).join(',\n')}
      ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
      RETURNING id;
      `;
  const movementUpdate = await db.query(setMovementsSql, movementNames);

  return movementUpdate.rows.map(obj => obj.id);
};

export const insertToUserMovementTable = async (
  movementIds: string[],
  userId: string
): Promise<void> => {
  const addUserMovementIfNotExists = `
      INSERT INTO user_movements (movement_id, user_id)
      SELECT $1, $2
      WHERE
        NOT EXISTS (
          SELECT movement_id FROM user_movements
          WHERE user_id = $2 AND movement_id = $1
        ) RETURNING id;
    `;

  for (const movementId of movementIds) {
    await db.query(addUserMovementIfNotExists, [movementId, userId]);
  }
};

export const linkSetsToWorkout = async (
  workout: IWorkout,
  movementIds: string[],
  userId: string,
  newWorkoutId: number
) => {
  for (const [index, movement] of workout.movements.entries()) {
    const userMovementSql = `
      SELECT id from user_movements
      WHERE movement_id = $1 AND user_id = $2;
      `;
    const userMovementResponse = await db.query(userMovementSql, [
      movementIds[index],
      userId,
    ]);
    const userMovementId = userMovementResponse.rows[0].id;

    for (const set of movement.sets) {
      const setAddSql = `
        INSERT INTO sets
          (reps, weight, user_id, user_movement_id, workout_id)
        VALUES
          ($1, $2, $3, $4, $5)
        `;
      await db.query(setAddSql, [
        set.reps,
        set.weight,
        userId,
        userMovementId,
        newWorkoutId,
      ]);
    }
  }
};

export const updateWorkoutSets = async (
  sets: ISet[],
  userId: string,
  workoutId: string,
  userMovementIds: any
) => {
  for (const set of sets) {
    const sqlWithMovementChanges = `
      UPDATE sets
      SET
        reps = $1,
        weight = $2,
        user_movement_id = $3,
        updated_at = current_timestamp
      WHERE user_id = $4 AND workout_id = $5 AND id = $6
      `;
    await db.query(sqlWithMovementChanges, [
      set.reps.toString(),
      set.weight.toString(),
      userMovementIds[set.movement_name],
      userId,
      workoutId,
      set.set_id,
    ]);
  }
};

export const getUserTransformedWorkouts = async (userId: string) => {
  const sql = `
      SELECT
        sets.id AS set_id, reps, weight, workouts.id AS workout_id,
        workouts.created_at AS workout_created_at, workouts.name AS workout_name,
        movements.name AS movement_name, movements.id AS movement_id,
        user_movements.id AS user_movement_id,
        sets.created_at AS set_created_at
      FROM sets
      JOIN users ON sets.user_id = users.id
      JOIN workouts ON sets.workout_id = workouts.id
      JOIN user_movements ON user_movements.id = sets.user_movement_id
      JOIN movements ON user_movements.movement_id = movements.id
      WHERE users.id = $1 
      ORDER BY workouts.created_at DESC;
    `;
  const result = await db.query(sql, [userId]);
  const workoutSets: Array<DbWorkoutSet> | undefined = result.rows;

  if (workoutSets.length > 0) {
    const transformedWorkouts = workoutSetRowObjectsToWorkouts(workoutSets);
    return transformedWorkouts;
  }
  return null;
};

export const getUserTransformedWorkoutById = async (
  userId: string,
  workoutId: string
) => {
  const sql = `
      SELECT
        sets.id AS set_id, reps, weight, workouts.id AS workout_id,
        workouts.created_at AS workout_created_at, workouts.name AS workout_name,
        movements.name AS movement_name, movements.id AS movement_id,
        user_movements.id AS user_movement_id,
        sets.created_at AS set_created_at      
      FROM sets
      JOIN users ON sets.user_id = users.id
      JOIN workouts ON sets.workout_id = workouts.id
      JOIN user_movements ON user_movements.id = sets.user_movement_id
      JOIN movements ON user_movements.movement_id = movements.id
      WHERE users.id = $1 AND sets.workout_id = $2
      ORDER BY workouts.created_at DESC;
    `;
  const result = await db.query(sql, [userId, workoutId]);
  const workoutSet: DbWorkoutSet | undefined = result.rows[0];

  if (workoutSet) {
    const transformedWorkouts = workoutSetRowObjectsToWorkouts([workoutSet]);
    return transformedWorkouts[0];
  }
  return null;
};