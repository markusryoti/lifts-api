import db from '../../db';
import { workoutSetRowObjectsToWorkouts } from './json';

export interface ISet {
  set_id: string;
  reps: number;
  weight: number;
  user_movement_id: string;
  movement_id: string;
  movement_name: string;
  set_created_at: Date;
  set_updated_at: Date;
}

export interface DbWorkoutSet {
  set_id: string;
  reps: number;
  weight: number;
  workout_id: string;
  workout_created_at: Date;
  workout_updated_at: Date;
  workout_name: string;
  movement_name: string;
  movement_id: string;
  user_movement_id: string;
  set_created_at: Date;
  set_updated_at: Date;
}

/**
 * Update values in sets
 * @param sets `ISet` objects
 * @param userId User id
 * @param workoutId Workout id
 * @param userMovementIds User movement ids
 * @throws Throw error if couldn't update sets
 */
export const updateWorkoutSets = async (
  sets: ISet[],
  userId: string,
  workoutId: string,
  userMovementIds: any
) => {
  try {
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
  } catch (error) {
    console.error(error);
    throw new Error("Couldn't update sets");
  }
};

/**
 * Joins workout data for each set in all workouts in database response
 * This is then transformed to array of `IWorkout` json objects
 * @param userId User id
 * @throws Throw an error if either database query or json trasform fails
 */
export const getUserTransformedWorkouts = async (userId: string) => {
  try {
    const sql = `
      SELECT
        sets.id AS set_id, reps, weight, workouts.id AS workout_id,
        workouts.created_at AS workout_created_at,
        workouts.updated_at AS workout_updated_at,
        workouts.name AS workout_name,
        movements.name AS movement_name, movements.id AS movement_id,
        user_movements.id AS user_movement_id,
        sets.created_at AS set_created_at,
        sets.updated_at AS set_updated_at
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
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couln't produce workout objects");
  }
};

/**
 * Joins workout data for each set in workout in database response
 * This is then transformed to array of `IWorkout` json objects
 * @param userId User id
 * @throws Throw an error if either database query or json trasform fails
 */
export const getUserTransformedWorkoutById = async (
  userId: string,
  workoutId: string
) => {
  try {
    const sql = `
      SELECT
        sets.id AS set_id, reps, weight, workouts.id AS workout_id,
        workouts.created_at AS workout_created_at,
        workouts.updated_at AS workout_updated_at,
        workouts.name AS workout_name,
        movements.name AS movement_name, movements.id AS movement_id,
        user_movements.id AS user_movement_id,
        sets.created_at AS set_created_at,     
        sets.updated_at AS set_updated_at 
      FROM sets
      JOIN users ON sets.user_id = users.id
      JOIN workouts ON sets.workout_id = workouts.id
      JOIN user_movements ON user_movements.id = sets.user_movement_id
      JOIN movements ON user_movements.movement_id = movements.id
      WHERE users.id = $1 AND sets.workout_id = $2
      ORDER BY workouts.created_at DESC;
    `;
    const result = await db.query(sql, [userId, workoutId]);
    const workoutSet: Array<DbWorkoutSet> | undefined = result.rows;

    if (workoutSet) {
      const transformedWorkouts = workoutSetRowObjectsToWorkouts(workoutSet);
      return transformedWorkouts[0];
    }
    return null;
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't produce single workout object");
  }
};

/**
 * Delete all sets with a specific movement
 * @param workoutId Workout id
 * @param userId User id
 * @param userMovementId User movement id
 * @returns `boolean` if delete was successful or not
 * @throws Throw an error if delete fails
 */
export const deleteMovementFromWorkout = async (
  workoutId: string,
  userId: string,
  userMovementId: string
): Promise<void> => {
  try {
    const sql = `
      DELETE FROM sets
      WHERE workout_id = $1 AND user_id = $2
      AND user_movement_id = $3;
    `;
    const result = await db.query(sql, [workoutId, userId, userMovementId]);
    if (result.rowCount === 0) {
      throw new Error();
    }
  } catch (error) {
    console.error(error.stack);
    throw new Error('Deleting movement failed');
  }
};

/**
 * Delete individual set
 * @param setId Set id
 * @param userId User id
 * @returns `boolean` if delete was successful or not
 * @throws Throw an error if delete fails
 */
export const deleteSetByIdAndUserId = async (
  setId: string,
  userId: string
): Promise<void> => {
  try {
    const sql = `
      DELETE FROM sets
      WHERE id = $1 AND user_id = $2;
    `;
    const result = await db.query(sql, [setId, userId]);
    if (result.rowCount === 0) {
      throw new Error();
    }
  } catch (error) {
    console.error(error.stack);
    throw new Error('Deleting set failed');
  }
};

/**
 * Insert a new set to database
 * @param reps Number of reps
 * @param weight Weight used
 * @param userId User id
 * @param userMovementId User movement id
 * @param workoutId Workout id
 * @throws Throw an exception if insert fails
 */
export const createNewSet = async (
  reps: string,
  weight: string,
  userId: string,
  userMovementId: string,
  workoutId: string
): Promise<ISet> => {
  try {
    const sql = `
    INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id AS set_id, reps, weight, user_movement_id,
    created_at AS set_created_at`;
    const values = [reps, weight, userId, userMovementId, workoutId];
    const result = await db.query(sql, values);
    const addedSet: ISet = result.rows[0];

    if (addedSet) return addedSet;
    throw new Error();
  } catch (error) {
    console.error(error.stack);
    throw new Error('Error while inserting a new set');
  }
};
