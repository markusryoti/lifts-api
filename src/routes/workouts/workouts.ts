import express from 'express';
const router = express.Router();

import db from '../../db';
import auth from '../../middleware/auth';
import { workoutSetRowObjectsToWorkouts } from './jsonFormatter';
import { DatabaseNewWorkoutResponse, DbWorkoutObject } from './types';

router.get('/', auth, async (req: any, res: any) => {
  const userId = req.user.id;

  console.log(userId);

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
      ORDER BY workouts.created_at DESC
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
      ORDER BY workouts.created_at DESC
    `;
    const result = await db.query(sql, [userId, workoutId]);
    const transformedWorkouts = workoutSetRowObjectsToWorkouts(result.rows);
    res.send(transformedWorkouts);
  } catch (error) {
    console.log(error.stack);
    res.sendStatus(500);
  }
});

router.post('/new', auth, async (req: any, res: any) => {
  const userId = req.user.id;

  let { name } = req.body;
  name = name === undefined ? null : name;

  const sql =
    'INSERT INTO workouts (user_id, name) VALUES ($1, $2) RETURNING *';
  const values = [userId, name];

  try {
    const result: DatabaseNewWorkoutResponse = await db.query(sql, values);
    const workout: DbWorkoutObject = result.rows[0];
    res.send(workout);
  } catch (error) {
    console.log(error.stack);
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
