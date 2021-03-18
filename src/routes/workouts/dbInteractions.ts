import db from '../../db';
import { ISet } from './jsonFormatter';
import { IWorkout } from './types';

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
