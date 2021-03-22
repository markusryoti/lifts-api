import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

import {
  createNewUser,
  DbUser,
  getUserWithUsernameOrEmail,
} from '../repository/users';

router.post('/', async (req: any, res: any) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res
      .sendStatus(400)
      .send('Invalid request, must contain username, email and password');
    return;
  }

  try {
    const existingUser = await getUserWithUsernameOrEmail('email', email);
    console.log(existingUser);

    if (existingUser) {
      res.status(403).json('User with email already exists');
      return;
    }

    const hashedPassword = bcrypt.hashSync(
      password,
      parseInt(process.env.SALT_ROUNDS as string)
    );

    const newUser: DbUser | null = await createNewUser(
      username,
      email,
      hashedPassword
    );

    if (!newUser) {
      res.status(500).json('Error occured while creating a new user');
      return;
    }

    const payload = {
      id: newUser.id,
      username: newUser.username,
    };

    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, {
      expiresIn: process.env.TOKEN_EXPIRATION_TIME,
    });

    res.json(token);
  } catch (err) {
    console.log(err.stack);
    res.sendStatus(500);
  }
});

export default router;
