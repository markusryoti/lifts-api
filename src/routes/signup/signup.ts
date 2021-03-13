import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

import db from '../../db';

interface DbUserObject {
  id: string;
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

      const payload = {
        id: user.id,
        username: user.username,
      };

      const token = jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET as string,
        {
          expiresIn: process.env.TOKEN_EXPIRATION_TIME,
        }
      );

      res.json(token);
    } catch (err) {
      console.log(err.stack);
      res.sendStatus(500);
    }
  }
});

export default router;
