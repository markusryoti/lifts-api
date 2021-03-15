import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

import db from '../../db';
import { DatabaseResponse, DbUserObject } from './types';

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

  console.log(req.body);
  if (credentialsAreGiven(username, email, password)) {
    res
      .status(400)
      .json('Invalid request, must contain username/email and password');
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
        res.sendStatus(401);
        return;
      }

      const user: DbUserObject = result.rows[0];
      if (!user) {
        res.status(404).json('No user with given username/email');
        return;
      }

      if (!bcrypt.compareSync(password, user.password)) {
        res.status(403).json("Passwords don't match");
        return;
      }

      const payload = {
        id: user.id,
        username: user.username,
      };

      // Otherwise found user with matching password
      const token = jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET as string,
        {
          expiresIn: process.env.TOKEN_EXPIRATION_TIME,
        }
      );

      res.json(token);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  }
});

export default router;
