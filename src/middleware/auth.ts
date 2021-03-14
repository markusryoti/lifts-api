import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.headers['authorization'];
  if (token === null) return res.sendStatus(401); // if there isn't any token

  const secret = process.env.ACCESS_TOKEN_SECRET as string;

  jwt.verify(token, secret, (err: any, user: any) => {
    console.log(err);
    if (err) return res.sendStatus(403);
    req.user = user;
    next(); // pass the execution off to whatever request the client intended
  });
};

export default authenticateToken;
