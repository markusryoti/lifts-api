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
      return res
        .status(400)
        .json('Invalid request, must contain username/email and password');
    }

    const loginType = checkLoginType(loginValue);
    const user = await getUserWithUsernameOrEmail(loginType, loginValue);

    if (!bcrypt.compareSync(password, user.password as string)) {
      return res.status(403).json("Passwords don't match");
    }

    const payload = {
      id: user.id,
      username: user.username,
    };

    // Otherwise found user with matching password
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, {
      expiresIn: process.env.TOKEN_EXPIRATION_TIME,
    });

    return res.json(token);
  } catch (err) {
    console.error(err.stack);
    return res.sendStatus(500);
  }
});

export default router;
