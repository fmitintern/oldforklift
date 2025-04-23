import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the creds.env file
dotenv.config({ path: path.resolve(__dirname, '../../creds.env') });

// Check if environment variables are correctly loaded
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_CONNECT_STRING:", process.env.DB_CONNECT_STRING);

export const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 2,
  queueTimeout: 120000,
  poolAlias: "default"
};
