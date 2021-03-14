import express from 'express';
const router = express.Router();

import db from '../../db';
import auth from '../../middleware/auth';

interface DbUserObject {
  id: number;
  username: string;
  email: string;
  password?: string;
  created_at: Date;
  updated_at: Date;
}

interface DatabaseResponse {
  rows: DbUserObject[];
}

router.get('/', auth, async (req: any, res: any) => {
  const userId = req.user.id;
  const sql = 'SELECT * FROM users WHERE users.id = $1';
  try {
    const result: DatabaseResponse = await db.query(sql, [userId]);
    const user: DbUserObject = result.rows[0];
    if (user) {
      delete user.password;
      res.send(user);
      return;
    }
    res.status(404).json('No user found with given id');
  } catch (error) {
    console.log(error.stack);
    res.sendStatus(500);
  }
});

export default router;
