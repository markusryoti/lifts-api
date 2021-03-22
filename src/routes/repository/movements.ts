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

export interface DbMovementUserMovementJoin {
  id: string;
  user_id: string;
  name: string;
}

export interface DatabaseMovementResponse {
  rows: DbMovementObject[];
}

export interface DatabaseUserMovementResponse {
  rows: DbUserMovementObject[];
}

export const seeIfMovementInMovementTable = async (
  name: string
): Promise<DbMovementObject | null> => {
  const sqlSeeIfExists = 'SELECT id, name FROM movements WHERE name = $1';
  const movementExistsResult: DatabaseMovementResponse = await db.query(
    sqlSeeIfExists,
    [name]
  );
  const movement = movementExistsResult.rows[0];
  if (movement) {
    return movement;
  }
  return null;
};

export const addMovementToMovementTable = async (
  name: string
): Promise<DbMovementObject | null> => {
  const sqlAddToMovements =
    'INSERT INTO movements (name) VALUES ($1) RETURNING *';
  const movementAddResult: DatabaseMovementResponse = await db.query(
    sqlAddToMovements,
    [name]
  );
  const movement = movementAddResult.rows[0];
  if (movement) {
    return movement;
  }
  return null;
};

export const seeIfMovementInUserMovementTable = async (
  id: string
): Promise<DbUserMovementObject | null> => {
  const sqlSeeIfExistsInUserMovements =
    'SELECT id, movement_id, user_id FROM user_movements WHERE movement_id = $1';
  const userMovementExistsResult: DatabaseUserMovementResponse = await db.query(
    sqlSeeIfExistsInUserMovements,
    [id]
  );
  const userMovement = userMovementExistsResult.rows[0];
  if (userMovement) {
    return userMovement;
  }
  return null;
};

export const checkByNameIfMovementInUserMovements = async (name: string) => {
  const sql = `
    SELECT id AS user_movement_id, movement_id, user_id
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
};

export const addMovementToUserMovementTable = async (
  movementId: string,
  userId: string
): Promise<DbUserMovementObject | null> => {
  const sqlAddToUserMovements =
    'INSERT INTO user_movements (movement_id, user_id) VALUES ($1, $2) RETURNING *';
  const userMovementAddResult: DatabaseUserMovementResponse = await db.query(
    sqlAddToUserMovements,
    [movementId, userId]
  );
  const userMovement = userMovementAddResult.rows[0];
  if (userMovement) {
    return userMovement;
  }
  return null;
};

export const joinMovementAndUserMovementTables = async (
  movementId: string
): Promise<DbMovementUserMovementJoin | null> => {
  const sqlMovementJoin = `
      SELECT user_movements.id, user_movements.user_id, movements.name
      FROM user_movements
      JOIN movements
      ON user_movements.movement_id = movements.id
      WHERE user_movements.movement_id = $1`;
  const userMovementJoinResponse = await db.query(sqlMovementJoin, [
    movementId,
  ]);
  const userMovement = userMovementJoinResponse.rows[0];
  if (userMovement) {
    return userMovement;
  }
  return null;
};

export const getUserMovementIdByMovementName = async (
  movementName: string,
  userId: string
): Promise<string | null> => {
  const sql = `
        SELECT * FROM user_movements
        JOIN movements
        ON user_movements.movement_id = movements.id
        WHERE movements.name = $1 AND user_movements.user_id = $2
      `;

  const userMovementIdQueryResult = await db.query(sql, [movementName, userId]);
  const userMovementId = userMovementIdQueryResult.rows[0].id;

  if (!userMovementId) return null;
  return userMovementId;
};
