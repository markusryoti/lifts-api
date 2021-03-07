import express from 'express';
const router = express.Router();

import db from '../../db';

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

const credentialsAreGiven = (
  username: string | undefined,
  email: string | undefined,
  password: string | undefined
): boolean => {
  if (!password) return false;
  if (email || username) return false;
  return true;
};

router.post('/', async (req: any, res: any) => {
  const { username, email, password } = req.body;
  if (credentialsAreGiven(username, email, password)) {
    res
      .sendStatus(400)
      .send('Invalid request, must contain username/email and password');
  } else {
    let sql;
    let result: DatabaseResponse;
    try {
      if (username) {
        sql = 'SELECT * FROM users WHERE username = $1';
        result = await db.query(sql, [username]);
      } else if (email) {
        sql = 'SELECT * FROM users WHERE email = $1';
        result = await db.query(sql, [email]);
      } else {
        res.sendStatus(500);
        return;
      }
      const user: DbUserObject = result.rows[0];
      if (!user) {
        res.status(404).send('No user with given username/email');
        return;
      }
      if (password !== user.password) {
        res.status(403).send("Passwords don't match");
        return;
      }
      delete user.password;
      res.send(user);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  }
});

export default router;
