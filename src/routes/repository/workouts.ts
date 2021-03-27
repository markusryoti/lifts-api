import db from '../../db';
import { IWorkout, workoutSetRowObjectsToWorkouts } from './json';

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

export interface IDbWorkout {
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
  movementName: string
): Promise<string | null> => {
  const setMovementsSql = `
      INSERT INTO movements (name)
      VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
      RETURNING id;
      `;
  const movementUpdate = await db.query(setMovementsSql, [movementName]);

  const id = movementUpdate.rows[0].id;
  if (!id) return null;
  return id;
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
  newWorkoutId: string
) => {
  const cache: any = {};
  for (const [index, set] of workout.sets.entries()) {
    let userMovementId;
    if (!(movementIds[index] in cache)) {
      const userMovementSql = `
      SELECT id from user_movements
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
  const workoutSet: Array<DbWorkoutSet> | undefined = result.rows;

  if (workoutSet) {
    const transformedWorkouts = workoutSetRowObjectsToWorkouts(workoutSet);
    return transformedWorkouts[0];
  }
  return null;
};

export const updateWorkoutName = async (
  newName: string,
  newId: string
): Promise<boolean> => {
  const sql = `
    UPDATE workouts
    SET name = $1, updated_at = current_timestamp
    WHERE id = $2;
  `;
  const nameUpdateResult = await db.query(sql, [newName, newId]);
  if (nameUpdateResult.rowCount === 0) return false;
  return true;
};

export const deleteWorkoutById = async (
  id: string,
  userId: string
): Promise<boolean> => {
  const sql = `
      DELETE FROM workouts
      WHERE id = $1 AND user_id = $2;
    `;
  const result = await db.query(sql, [id, userId]);
  if (result.rowCount === 0) {
    return false;
  }
  return true;
};

export const deleteMovementFromWorkout = async (
  workoutId: string,
  userId: string,
  userMovementId: string
): Promise<boolean> => {
  const sql = `
      DELETE FROM sets
      WHERE workout_id = $1 AND user_id = $2
      AND user_movement_id = $3;
    `;
  const result = await db.query(sql, [workoutId, userId, userMovementId]);
  if (result.rowCount === 0) {
    return false;
  }
  return true;
};

export const deleteSetByIdAndUserId = async (
  setId: string,
  userId: string
): Promise<boolean> => {
  const sql = `
      DELETE FROM sets
      WHERE id = $1 AND user_id = $2;
    `;
  const result = await db.query(sql, [setId, userId]);
  if (result.rowCount === 0) {
    return false;
  }
  return true;
};

export const createNewWorkout = async (
  userId: string,
  name: string
): Promise<string | null> => {
  const sql =
    'INSERT INTO workouts (user_id, name) VALUES ($1, $2) RETURNING id';
  const newWorkoutResult = await db.query(sql, [userId, name]);
  const newWorkoutId = newWorkoutResult.rows[0].id;
  if (!newWorkoutId) {
    return null;
  }
  return newWorkoutId;
};

export const createNewSet = async (
  reps: string,
  weightToAdd: string,
  userId: string,
  userMovementId: string,
  workoutId: string
): Promise<any> => {
  const sql = `
    INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id AS set_id, reps, weight, user_movement_id,
    created_at AS set_created_at`;
  const values = [reps, weightToAdd, userId, userMovementId, workoutId];
  const result = await db.query(sql, values);
  const addedSet = result.rows[0];

  if (!addedSet) return null;
  return addedSet;
};
