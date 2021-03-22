import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.headers['authorization'];
  const secret = process.env.ACCESS_TOKEN_SECRET as string;

  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export default authenticateToken;
