import express from 'express';
const router = express.Router();

import auth from '../../middleware/auth';
import { DbUser, getUserWithUsernameOrEmail } from '../repository/users';

router.get('/', auth, async (req: any, res: any) => {
  const reqUser = req.user;

  try {
    const user: DbUser | null = await getUserWithUsernameOrEmail(
      'username',
      reqUser.username
    );

    if (!user) {
      return res.status(404).json('No user exists with given username');
    }

    delete user?.password;

    return res.send(user);
  } catch (error) {
    console.log(error.stack);
    return res.sendStatus(500);
  }
});

export default router;
