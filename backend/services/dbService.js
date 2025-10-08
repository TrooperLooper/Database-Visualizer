const { Pool } = require("pg");

class DatabaseService {
  constructor() {
    this.pool = null;
  }

  async connect(config) {
    this.pool = new Pool(config);
    try {
      await this.pool.query("SELECT NOW()");
      return { success: true, message: "Connected successfully" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getSchemaInfo() {
    if (!this.pool) throw new Error("Not connected to database");

    // Get all tables
    const tablesQuery = `
      SELECT 
        table_name,
        table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    // Get all columns
    const columnsQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;

    // Get foreign key relationships
    const foreignKeysQuery = `
      SELECT
        tc.table_name as source_table,
        kcu.column_name as source_column,
        ccu.table_name as target_table,
        ccu.column_name as target_column
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema = 'public';
    `;

    const [tables, columns, foreignKeys] = await Promise.all([
      this.pool.query(tablesQuery),
      this.pool.query(columnsQuery),
      this.pool.query(foreignKeysQuery),
    ]);

    return {
      tables: tables.rows,
      columns: columns.rows,
      relationships: foreignKeys.rows,
    };
  }

  async getTableData(tableName, limit = 100) {
    if (!this.pool) throw new Error("Not connected to database");

    // Sanitize table name to prevent SQL injection
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const query = `SELECT * FROM "${escapedTableName}" LIMIT $1`;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

module.exports = new DatabaseService();
