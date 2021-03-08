import express from 'express';
const router = express.Router();

import db from '../../db';
import { workoutJsonFormatter } from './jsonFormatter';

interface DbWorkoutObject {
  id: number;
  name: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

interface DatabaseResponse {
  rows: DbWorkoutObject[];
}

router.post('/new', async (req: any, res: any) => {
  const { userId, name } = req.body;
  if (!userId) {
    res.status(400).send('Invalid request, must include user');
    return;
  }
  const sql =
    'INSERT INTO workouts (user_id, name) VALUES ($1, $2) RETURNING *';
  const values = [userId, name];

  try {
    const result: DatabaseResponse = await db.query(sql, values);
    const workout: DbWorkoutObject = result.rows[0];
    res.send(workout);
  } catch (error) {
    console.log(error.stack);
    res.sendStatus(500);
  }
});

router.get('/', async (req: any, res: any) => {
  const { userId } = req.body;
  try {
    const sql = `
      SELECT sets.id AS set_id, reps, weight,
          workouts.id AS workout_id,
              workouts.created_at, workouts.name,
              movements.name AS name
      FROM sets
      JOIN users ON sets.user_id = users.id
      JOIN workouts ON sets.workout_id = workouts.id
      JOIN user_movements ON user_movements.id = sets.user_movement_id
      JOIN movements ON user_movements.movement_id = movements.id
      WHERE users.id = $1 
    `;
    const result = await db.query(sql, [userId]);
    const transformedWorkouts = workoutJsonFormatter(result.rows);
    res.send(transformedWorkouts);
  } catch (error) {
    console.log(error.stack);
    res.sendStatus(500);
  }
});

router.get('/:workoutId', async (req: any, res: any) => {
  const { workoutId } = req.params;
  const { userId } = req.body;
  try {
    const sql = `
      SELECT sets.id AS set_id, reps, weight,
          workouts.id AS workout_id,
              workouts.created_at, workouts.name,
              movements.name AS name
      FROM sets
      JOIN users ON sets.user_id = users.id
      JOIN workouts ON sets.workout_id = workouts.id
      JOIN user_movements ON user_movements.id = sets.user_movement_id
      JOIN movements ON user_movements.movement_id = movements.id
      WHERE users.id = $1 AND sets.workout_id = $2
    `;
    const result = await db.query(sql, [userId, workoutId]);
    const transformedWorkouts = workoutJsonFormatter(result.rows);
    res.send(transformedWorkouts);
  } catch (error) {
    console.log(error.stack);
    res.sendStatus(500);
  }
});

// FIX SQL
router.post('/:workoutId/sets/', async (req: any, res: any) => {
  const { workoutId } = req.params;
  const { reps, weight, userId, userMovementId } = req.body;

  try {
    if (!inputsAreValid(reps, userId, userMovementId)) {
      res
        .status(403)
        .send('Not valid, must include reps, userId and userMovementId');
      return;
    }

    const weightToAdd = weight === undefined ? null : weight;
    const sqlAdd = `
    INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
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
