import express from 'express';
const router = express.Router();

import db from '../../db';
import auth from '../../middleware/auth';
import {
  addMovementToMovementTable,
  addMovementToUserMovementTable,
} from '../movements/dbInteractions';
import {
  insertToMovementTable,
  insertToUserMovementTable,
  linkSetsToWorkout,
  updateWorkoutSets,
} from './dbInteractions';
import { IWorkoutOut, workoutSetRowObjectsToWorkouts } from './jsonFormatter';
import { IWorkout } from './types';

router.get('/', auth, async (req: any, res: any) => {
  const userId = req.user.id;

  try {
    const sql = `
      SELECT
        sets.id AS set_id, reps, weight, workouts.id AS workout_id,
        workouts.created_at AS workout_created_at, workouts.name AS workout_name,
        movements.name AS movement_name, sets.created_at AS set_created_at
      FROM sets
      JOIN users ON sets.user_id = users.id
      JOIN workouts ON sets.workout_id = workouts.id
      JOIN user_movements ON user_movements.id = sets.user_movement_id
      JOIN movements ON user_movements.movement_id = movements.id
      WHERE users.id = $1 
      ORDER BY workouts.created_at DESC;
    `;
    const result = await db.query(sql, [userId]);
    const transformedWorkouts = workoutSetRowObjectsToWorkouts(result.rows);
    res.send(transformedWorkouts);
  } catch (error) {
    console.log(error.stack);
    res.sendStatus(500);
  }
});

router.get('/:workoutId', auth, async (req: any, res: any) => {
  const userId = req.user.id;
  const { workoutId } = req.params;

  try {
    const sql = `
      SELECT
        sets.id AS set_id, reps, weight, workouts.id AS workout_id,
        workouts.created_at AS workout_created_at, workouts.name AS workout_name,
        movements.name AS movement_name, sets.created_at AS set_created_at
      FROM sets
      JOIN users ON sets.user_id = users.id
      JOIN workouts ON sets.workout_id = workouts.id
      JOIN user_movements ON user_movements.id = sets.user_movement_id
      JOIN movements ON user_movements.movement_id = movements.id
      WHERE users.id = $1 AND sets.workout_id = $2
      ORDER BY workouts.created_at DESC;
    `;
    const result = await db.query(sql, [userId, workoutId]);
    const transformedWorkouts = workoutSetRowObjectsToWorkouts(result.rows);
    res.send(transformedWorkouts[0]);
  } catch (error) {
    console.log(error.stack);
    res.sendStatus(500);
  }
});

router.put('/:workoutId', auth, async (req: any, res: any) => {
  const userId = req.user.id;
  const { workoutId } = req.params;
  const editedWorkout: IWorkoutOut = req.body;
  console.log(editedWorkout);

  try {
    const workoutName = editedWorkout.workout_name;
    const workoutNameUpdateSql = `
    UPDATE workouts
    SET name = $1, updated_at = current_timestamp
    WHERE id = $2;
  `;

    const nameUpdateResult = await db.query(workoutNameUpdateSql, [
      workoutName,
      workoutId,
    ]);

    // Something went wrong
    if (nameUpdateResult.rowCount === 0) {
      res.sendStatus(500);
      return;
    }

    const movementNames = editedWorkout.sets.map(set => set.movement_name);
    const uniqueNames = [...new Set(movementNames)];

    const updatedMovementNames: any = {};

    for (const name of uniqueNames) {
      const sqlSeeIfExists = `
        SELECT * FROM movements
        LEFT JOIN user_movements
        ON movements.id = user_movements.movement_id
        WHERE name = $1
      `;
      const result = await db.query(sqlSeeIfExists, [name]);
      const row = result.rows[0];

      let movementId: string = '';
      let userMovementId;

      if (!row) {
        const newMovement = await addMovementToMovementTable(name);
        if (!newMovement) {
          res.sendStatus(500);
          return;
        }
        movementId = newMovement.id.toString();

        const userMovementResponse = await addMovementToUserMovementTable(
          movementId,
          userId
        );

        userMovementId = userMovementResponse?.id;

        if (!userMovementId) {
          res.sendStatus(500);
          return;
        }
      } else if (row.user_id === null) {
        movementId = row.id;
        const userMovementResponse = await addMovementToUserMovementTable(
          movementId,
          userId
        );

        userMovementId = userMovementResponse?.id;

        if (!userMovementId) {
          res.sendStatus(500);
          return;
        }
      } else {
      }

      if (!row || name !== row.name) {
        updatedMovementNames[name] = userMovementId;
      }
    }

    await updateWorkoutSets(
      editedWorkout.sets,
      userId,
      workoutId,
      updatedMovementNames
    );

    res.sendStatus(200);
  } catch (error) {
    console.log(error.stack);
    res.sendStatus(500);
  }
});

router.delete('/:workoutId', auth, async (req: any, res: any) => {
  const userId = req.user.id;
  const { workoutId } = req.params;

  try {
    const sql = `
      DELETE FROM workouts
      WHERE id = $1 AND user_id = $2;
    `;
    const result = await db.query(sql, [workoutId, userId]);

    // Something went wrong
    if (result.rowCount === 0) {
      res.sendStatus(500);
    }

    res.sendStatus(200);
  } catch (error) {
    console.log(error.stack);
    res.sendStatus(500);
  }
});

router.post('/new', auth, async (req: any, res: any) => {
  const userId = req.user.id;
  const workout: IWorkout = req.body;

  try {
    // First add a new workout
    const newWorkoutSql =
      'INSERT INTO workouts (user_id, name) VALUES ($1, $2) RETURNING id';
    const newWorkoutResult = await db.query(newWorkoutSql, [
      userId,
      workout.name,
    ]);
    const newWorkoutId: number = newWorkoutResult.rows[0].id;

    // Insert to movements table if needed
    const movementNames: string[] = workout.movements.map(item => item.name);
    const movementIds: string[] = await insertToMovementTable(movementNames);

    // Update user movements table if needed
    await insertToUserMovementTable(movementIds, userId);

    // Add workout/movement data to sets
    await linkSetsToWorkout(workout, movementIds, userId, newWorkoutId);

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

router.post('/:workoutId/sets/', async (req: any, res: any) => {
  const userId = req.user.id;

  const { workoutId } = req.params;
  const { reps, weight, userMovementId } = req.body;

  try {
    if (!inputsAreValid(reps, userId, userMovementId)) {
      res
        .status(403)
        .send('Not valid, must include reps, userId and userMovementId');
      return;
    }

    const weightToAdd = weight === undefined ? null : weight;
    const sqlAdd = `
    INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id)
    VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const values = [reps, weightToAdd, userId, userMovementId, workoutId];

    const result = await db.query(sqlAdd, values);
    const addedSet = result.rows[0];

    if (!addedSet) {
      res.sendStatus(500);
      return;
    }

    res.send(addedSet);
  } catch (error) {
    console.log(error.stack);
    res.sendStatus(500);
    return;
  }
});

const inputsAreValid = (
  reps: number,
  userId: number,
  userMovementId: number
): boolean => {
  if (
    reps === undefined ||
    userId === undefined ||
    userMovementId === undefined
  )
    return false;
  return true;
};

export default router;
