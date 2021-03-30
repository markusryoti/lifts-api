import db from '../../db';

export interface DbUser {
  id: number;
  username: string;
  email: string;
  password?: string; // optional, don't want to return this from the api
  created_at: Date;
  updated_at: Date;
}

export interface UserDbResponse {
  rows: DbUser[];
}

/**
 * Takes login type (email/username) and returns user object
 * @param loginType login type (email/username)
 * @param loginValue login value (e.g. user@gmail.com or user123)
 * @returns Promise with `DbUser` object from database as json
 * @throws Throw an error if can't get user
 */
export const getUserWithUsernameOrEmail = async (
  loginType: string,
  loginValue: string
): Promise<DbUser> => {
  let sql;
  let result: UserDbResponse;
  try {
    if (loginType === 'username') {
      sql = 'SELECT * FROM users WHERE username = $1';
      result = await db.query(sql, [loginValue]);
    } else {
      sql = 'SELECT * FROM users WHERE email = $1';
      result = await db.query(sql, [loginValue]);
    }
    const user: DbUser = result.rows[0];
    if (user) {
      return user;
    }
    throw new Error();
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't get user from database");
  }
};

/**
 * Takes values for creating a new user
 * @param username
 * @param email
 * @param hashedPassword
 * @returns Promise with `DbUser` object from database as json
 * @throws Throw an error if couldn't add a new user
 */
export const createNewUser = async (
  username: string,
  email: string,
  hashedPassword: string
): Promise<DbUser> => {
  try {
    const sql =
      'INSERT INTO users(username, email, password) VALUES($1, $2, $3) RETURNING *';
    const values = [username, email, hashedPassword];
    const result = await db.query(sql, values);
    const user = result.rows[0];
    if (user) {
      return user;
    }
    throw new Error();
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't insert new user");
  }
};
