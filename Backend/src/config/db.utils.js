import oracledb from "oracledb";

export async function executeQuery(query, params = {}, options = {}) {
  let connection;
  try {
    console.log(`Executing: ${query}`, params);

    connection = await oracledb.getConnection({ poolAlias: "default" });

    const execOptions = {
      autoCommit: true,
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options // Allow things like bindDefs
    };

    return await connection.execute(query, params, execOptions);
  } catch (error) {
    console.error("❌ Query Error:", error);
    throw error;
  } finally {
    if (connection) await safeClose(connection);
  }
}

async function safeClose(connection) {
  try {
    await connection.close();
  } catch (err) {
    console.error("❌ Connection Close Error:", err);
  }
}
