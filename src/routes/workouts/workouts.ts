import express from 'express';
const router = express.Router();

import db from '../../db';

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

router.post('/:id/sets/', async (req: any, res: any) => {});

export default router;
