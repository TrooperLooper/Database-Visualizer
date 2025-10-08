// API Service Layer - Handles all communication with backend
// This is where frontend meets backend! 🚀

// Base URL for our backend API
const API_BASE = "http://localhost:3001/api";

// Types for TypeScript (helps catch errors early)
export interface DatabaseConfig {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

export interface ConnectionResponse {
  success: boolean;
  message: string;
}

export interface SchemaResponse {
  tables: Array<{
    table_name: string;
    table_schema: string;
  }>;
  columns: Array<{
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>;
  relationships: Array<{
    source_table: string;
    source_column: string;
    target_table: string;
    target_column: string;
  }>;
}

export interface TableDataResponse {
  [key: string]: string | number | boolean | null; // Table data can be these types
}

// 🎯 API Service Class - Our bridge between frontend and backend
export class DatabaseAPI {
  // 🔌 Method 1: Connect to Database
  // This sends user credentials to backend for PostgreSQL connection
  static async connectDatabase(
    config: DatabaseConfig
  ): Promise<ConnectionResponse> {
    try {
      console.log("🔄 Frontend: Sending connection request to backend...");
      console.log("📍 URL:", `${API_BASE}/database/connect`);
      console.log("📦 Payload:", { ...config, password: "***" }); // Hide password in logs

      const response = await fetch(`${API_BASE}/database/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      console.log("📡 Backend response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ConnectionResponse = await response.json();
      console.log("✅ Backend response data:", data);

      return data;
    } catch (error) {
      console.error("❌ Connection error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  // 📊 Method 2: Get Database Schema
  // This retrieves table structure, columns, and relationships
  static async getSchema(): Promise<SchemaResponse | null> {
    try {
      console.log("🔄 Frontend: Fetching database schema...");
      console.log("📍 URL:", `${API_BASE}/database/schema`);

      const response = await fetch(`${API_BASE}/database/schema`);

      console.log("📡 Schema response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SchemaResponse = await response.json();
      console.log("✅ Schema data received:");
      console.log("  📋 Tables:", data.tables.length);
      console.log("  📄 Columns:", data.columns.length);
      console.log("  🔗 Relationships:", data.relationships.length);

      return data;
    } catch (error) {
      console.error("❌ Schema fetch error:", error);
      return null;
    }
  }

  // 🔍 Method 3: Get Table Data
  // This retrieves actual rows from a specific table
  static async getTableData(
    tableName: string,
    limit = 100
  ): Promise<TableDataResponse[] | null> {
    try {
      console.log(`🔄 Frontend: Fetching data for table '${tableName}'...`);
      console.log(
        "📍 URL:",
        `${API_BASE}/database/table/${tableName}/data?limit=${limit}`
      );

      const response = await fetch(
        `${API_BASE}/database/table/${tableName}/data?limit=${limit}`
      );

      console.log("📡 Table data response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TableDataResponse[] = await response.json();
      console.log(
        `✅ Table '${tableName}' data received:`,
        data.length,
        "rows"
      );

      return data;
    } catch (error) {
      console.error(`❌ Table data fetch error for '${tableName}':`, error);
      return null;
    }
  }

  // 🔌 Method 4: Disconnect from Database
  // Clean up the database connection
  static async disconnect(): Promise<ConnectionResponse> {
    try {
      console.log("🔄 Frontend: Disconnecting from database...");

      const response = await fetch(`${API_BASE}/database/disconnect`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ConnectionResponse = await response.json();
      console.log("✅ Disconnected successfully:", data);

      return data;
    } catch (error) {
      console.error("❌ Disconnect error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Disconnect failed",
      };
    }
  }

  // 🩺 Method 5: Health Check
  // Test if backend is running
  static async healthCheck(): Promise<boolean> {
    try {
      console.log("🔄 Frontend: Checking backend health...");

      const response = await fetch(`${API_BASE}/health`);
      const isHealthy = response.ok;

      console.log(
        "🩺 Backend health:",
        isHealthy ? "✅ Healthy" : "❌ Unhealthy"
      );
      return isHealthy;
    } catch (error) {
      console.error("❌ Health check failed:", error);
      return false;
    }
  }
}

// Export individual methods for convenience
export const api = {
  connectDatabase: DatabaseAPI.connectDatabase,
  getSchema: DatabaseAPI.getSchema,
  getTableData: DatabaseAPI.getTableData,
  disconnect: DatabaseAPI.disconnect,
  healthCheck: DatabaseAPI.healthCheck,
};
