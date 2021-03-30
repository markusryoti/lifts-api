import db from '../../db';
import { IWorkout } from './json';

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

/**
 * Insert a new movement to movements. Update if exists already
 * @param movementName Name of the new/updated movement
 * @returns Id of the added movement or null
 */
export const insertToOrUpdateMovementTable = async (
  movementName: string
): Promise<string | null> => {
  try {
    const sql = `
      INSERT INTO movements (name)
      VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
      RETURNING id;
      `;
    const movementUpdate = await db.query(sql, [movementName]);
    const id = movementUpdate.rows[0].id;
    if (!id) return null;
    return id;
  } catch (error) {
    console.error(error.stack);
    throw new Error('Inserting a movement failed');
  }
};

/**
 * Adds multiple movements to user_movements
 * @param movementIds List of
 * @param userId User id
 * @throws Throws an error if something fails
 */
export const insertToUserMovementTable = async (
  movementIds: string[],
  userId: string
): Promise<void> => {
  try {
    const sql = `
      INSERT INTO user_movements (movement_id, user_id)
      SELECT $1, $2
      WHERE
        NOT EXISTS (
          SELECT movement_id FROM user_movements
          WHERE user_id = $2 AND movement_id = $1
        ) RETURNING id;
    `;
    for (const movementId of movementIds) {
      await db.query(sql, [movementId, userId]);
    }
  } catch (error) {
    console.error(error.stack);
    throw new Error('Adding movements to user_movements failed');
  }
};

/**
 * Adds workout/movement data to new sets
 * @param workout `IWorkout` object
 * @param movementIds Movement ids to add
 * @param userId User id
 * @param newWorkoutId Id of the new workout
 * @throws Throw error if set creation failed
 */
export const linkSetsToWorkout = async (
  workout: IWorkout,
  movementIds: string[],
  userId: string,
  newWorkoutId: string
) => {
  try {
    const cache: any = {};
    for (const [index, set] of workout.sets.entries()) {
      let userMovementId;

      // Get user movement ids, either from cache or database
      // TODO
      // Could this be handled in insertToUserMovementTable?
      if (!(movementIds[index] in cache)) {
        const userMovementSql = `
      SELECT id FROM user_movements
      WHERE movement_id = $1 AND user_id = $2;
      `;
        const userMovementResponse = await db.query(userMovementSql, [
          movementIds[index],
          userId,
        ]);
        userMovementId = userMovementResponse.rows[0].id;
        cache[movementIds[index]] = userMovementId;
      } else {
        userMovementId = cache[movementIds[index]];
      }

      // Finally add new sets
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
  } catch (error) {
    console.error(error.stack);
    throw new Error('Adding new sets to workout failed');
  }
};

/**
 * Updates workout name
 * @param newName Name to update
 * @param id Workout id
 * @returns `boolean` whether the insert was successful or not
 */
export const updateWorkoutName = async (
  newName: string,
  id: string
): Promise<void> => {
  try {
    const sql = `
    UPDATE workouts
    SET name = $1, updated_at = current_timestamp
    WHERE id = $2;
  `;
    const nameUpdateResult = await db.query(sql, [newName, id]);
    if (nameUpdateResult.rowCount == 0) {
      throw new Error();
    }
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't update workout name");
  }
};

/**
 * Deletes a workout with given id
 * @param id Workout id
 * @param userId User id
 * @throws Throw an error if deletion failed
 */
export const deleteWorkoutById = async (
  id: string,
  userId: string
): Promise<void> => {
  try {
    const sql = `
      DELETE FROM workouts
      WHERE id = $1 AND user_id = $2;
    `;
    const result = await db.query(sql, [id, userId]);
    if (result.rowCount === 0) {
      throw new Error();
    }
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't delete workout");
  }
};

/**
 * Create a new workout with user id and workout name
 * @param userId User id
 * @param name Name of the workout
 */
export const createNewWorkout = async (
  userId: string,
  name: string
): Promise<string> => {
  try {
    const sql =
      'INSERT INTO workouts (user_id, name) VALUES ($1, $2) RETURNING id';
    const newWorkoutResult = await db.query(sql, [userId, name]);
    const newWorkoutId = newWorkoutResult.rows[0].id;
    if (!newWorkoutId) {
      throw new Error();
    }
    return newWorkoutId;
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't create new workout");
  }
};
