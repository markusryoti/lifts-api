import express from 'express';
const router = express.Router();

import db from '../../db';

interface DbUserObject {
  username: string;
  email: string;
  password?: string;
  created_at: Date;
  updated_at: Date;
}

interface DatabaseResponse {
  rows: DbUserObject[];
}

router.post('/', async (req: any, res: any) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res
      .sendStatus(400)
      .send('Invalid request, must contain username, email and password');
  } else {
    const sql =
      'INSERT INTO users(username, email, password) VALUES($1, $2, $3) RETURNING *';
    const values = [username, email, password];
    try {
      const result: DatabaseResponse = await db.query(sql, values);
      const user: DbUserObject = result.rows[0];
      delete user.password;
      res.send(user);
    } catch (err) {
      console.log(err.stack);
      res.sendStatus(500);
    }
  }
});

export default router;
