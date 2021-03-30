import db from '../../db';

export interface DbMovementObject {
  id: number;
  name: string;
}

export interface DbUserMovementObject {
  id: number;
  movement_id: number;
  user_id: number;
}

export interface DbUserMovementAndMovementJoin {
  user_movement_id: string;
  movement_id: string;
  user_id: string;
  movement_name: string;
}

export interface DatabaseMovementResponse {
  rows: DbMovementObject[];
}

export interface DatabaseUserMovementResponse {
  rows: DbUserMovementObject[];
}

/**
 * See if movement exists in movements
 * @param name Movement name
 * @returns `DbMovementObject` or `null`
 * @throws Throw error if query fails for some reason
 **/
export const seeIfMovementInMovementTable = async (
  name: string
): Promise<DbMovementObject | null> => {
  try {
    const sql = 'SELECT id, name FROM movements WHERE name = $1';
    const movementExistsResult: DatabaseMovementResponse = await db.query(sql, [
      name,
    ]);
    const movement = movementExistsResult.rows[0];
    if (movement) {
      return movement;
    }
    return null;
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't retrieve movement");
  }
};

/**
 * Adds a new movement
 * @param name Movement name
 * @returns `DbMovementObject` promise or `null`
 * @throws Throw error if query fails for some reason
 **/
export const addMovementToMovementTable = async (
  name: string
): Promise<DbMovementObject> => {
  try {
    const sql = 'INSERT INTO movements (name) VALUES ($1) RETURNING *';
    const movementAddResult: DatabaseMovementResponse = await db.query(sql, [
      name,
    ]);
    const movement = movementAddResult.rows[0];
    if (movement) {
      return movement;
    }
    throw new Error();
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't add movement");
  }
};

/**
 * Check if movement id exists in user movements
 * @param id Movement id
 * @param userId
 * @returns `DbUserMovementObject` promise or `null`
 * @throws Throw error if query fails for some reason
 **/
export const seeIfMovementInUserMovementTable = async (
  id: string,
  userId: string
): Promise<DbUserMovementObject | null> => {
  try {
    const sql = `SELECT id, movement_id, user_id FROM user_movements
      WHERE movement_id = $1 AND user_id = $2`;
    const userMovementExistsResult: DatabaseUserMovementResponse = await db.query(
      sql,
      [id, userId]
    );
    const userMovement = userMovementExistsResult.rows[0];
    if (userMovement) {
      return userMovement;
    }
    return null;
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't get user movement");
  }
};

/**
 * Check if movement name exists in user movements
 * @param name Movement name
 * @returns `DbUserMovementAndMovementJoin` promise or `null`
 * @throws Throw error if query fails for some reason
 **/
export const checkByNameIfMovementInUserMovements = async (
  name: string
): Promise<DbUserMovementAndMovementJoin | null> => {
  try {
    const sql = `
      SELECT user_movements.id AS user_movement_id, movement_id, user_id,
        movements.name AS movement_name
        FROM user_movements
        JOIN movements
        ON movements.id = user_movements.movement_id
      WHERE movements.name = $1`;
    const userMovementExistsResult = await db.query(sql, [name]);
    const userMovement = userMovementExistsResult.rows[0];
    if (userMovement) {
      return userMovement;
    }
    return null;
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't execute query for user movements");
  }
};

/**
 * Add a new user movement
 * @param movementId Movement id
 * @param userId User id
 * @returns `DbUserMovementObject` promise or `null`
 * @throws Throw error if cannot add to database
 **/
export const addMovementToUserMovementTable = async (
  movementId: string,
  userId: string
): Promise<DbUserMovementObject> => {
  try {
    const sql = `
      INSERT INTO user_movements (movement_id, user_id)
      VALUES ($1, $2) RETURNING *`;
    const userMovementAddResult: DatabaseUserMovementResponse = await db.query(
      sql,
      [movementId, userId]
    );
    const userMovement = userMovementAddResult.rows[0];
    if (userMovement) {
      return userMovement;
    }
    throw new Error();
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't add to user movements");
  }
};

/**
 * Gets joined movement and user movement data
 * @param movementId Movement id
 * @returns `DbUserMovementAndMovementJoin` promise or `null`
 * @throws Throw error if cannot add to database
 **/
export const getMovementAndUserMovements = async (
  movementId: string
): Promise<DbUserMovementAndMovementJoin> => {
  try {
    const sql = `
      SELECT user_movements.id AS user_movement_id,
        movement_id, user_id
        movements.name AS movement_name
      FROM user_movements
      JOIN movements
      ON user_movements.movement_id = movements.id
      WHERE user_movements.movement_id = $1`;
    const userMovementJoinResponse = await db.query(sql, [movementId]);
    const userMovement = userMovementJoinResponse.rows[0];
    if (userMovement) {
      return userMovement;
    }
    throw new Error();
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't execute query");
  }
};

/**
 * Gets user movement id when given the movement name
 * @param movementName Movement name
 * @param userId User id
 * @returns Promise for user movement id as a string or `null`
 * @throws Throw error if cannot add to database
 **/
export const getUserMovementIdByMovementName = async (
  movementName: string,
  userId: string
): Promise<string> => {
  try {
    const sql = `
        SELECT * FROM user_movements
        JOIN movements
        ON user_movements.movement_id = movements.id
        WHERE movements.name = $1 AND user_movements.user_id = $2
      `;
    const userMovementIdQueryResult = await db.query(sql, [
      movementName,
      userId,
    ]);
    const userMovementId = userMovementIdQueryResult.rows[0].id;
    if (!userMovementId) throw new Error();
    return userMovementId;
  } catch (error) {
    console.error(error.stack);
    throw new Error("Couldn't execute query");
  }
};
