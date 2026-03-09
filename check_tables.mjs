import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});

const [rows] = await conn.execute("SHOW TABLES LIKE '%survey%'");
console.log("Survey tables:", JSON.stringify(rows, null, 2));

const [rows2] = await conn.execute("SELECT COUNT(*) as cnt FROM survey_templates");
console.log("Template count:", rows2[0].cnt);

await conn.end();
