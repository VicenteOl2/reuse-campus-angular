const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const serverName = process.env.DB_SERVER || 'localhost';
const instanceName = process.env.DB_INSTANCE || 'SQLEXPRESS';
const database = process.env.DB_DATABASE || 'reuse_campus_db';
const driver = process.env.DB_ODBC_DRIVER || 'ODBC Driver 17 for SQL Server';

const connectionString = `Driver={${driver}};Server=${serverName}\\${instanceName};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`;

const dbConfig = {
  connectionString,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise = null;

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig).catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

module.exports = { sql, getPool };