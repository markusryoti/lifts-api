import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

import { DbUser, getUserWithUsernameOrEmail } from '../repository/users';

const checkLoginType = (loginValue: string): string => {
  if (loginValue.includes('@')) {
    return 'email';
  } else {
    return 'username';
  }
};

router.post('/', async (req: any, res: any) => {
  const { loginValue, password } = req.body;

  try {
    if (!loginValue) {
      res
        .status(400)
        .json('Invalid request, must contain username/email and password');
    }

    const loginType = checkLoginType(loginValue);

    const user: DbUser | null = await getUserWithUsernameOrEmail(
      loginType,
      loginValue
    );

    if (!user) {
      res.status(404).json('No user with given username/email');
      return;
    }

    if (!bcrypt.compareSync(password, user.password as string)) {
      res.status(403).json("Passwords don't match");
      return;
    }

    const payload = {
      id: user.id,
      username: user.username,
    };

    // Otherwise found user with matching password
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, {
      expiresIn: process.env.TOKEN_EXPIRATION_TIME,
    });

    res.json(token);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

export default router;
