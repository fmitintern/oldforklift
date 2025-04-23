import oracledb from "oracledb";
import { dbConfig } from "./db.config.js";

export async function initializeDB() {
  try {
    oracledb.initOracleClient();
    console.log("Oracle Instant Client Initialized.");
    
    await oracledb.createPool(dbConfig);
    console.log("Database Pool Initialized.");
  } catch (error) {
    console.error("Initialization Error:", error);
    process.exit(1);
  }
}

export async function closeDB() {
  try {
    const pool = oracledb.getPool("default");
    await pool.close();
    console.log("Oracle DB Connection Closed.");
  } catch (error) {
    console.error("Error Closing Pool:", error);
  }
}

// Re-export query executor from utils
export { executeQuery } from "./db.utils.js";