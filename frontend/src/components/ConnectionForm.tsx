import { useState } from "react";
import { Database, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { api, type DatabaseConfig } from "../services/api";

interface ConnectionFormProps {
  onConnected: (config: DatabaseConfig) => void;
  onCancel?: () => void;
}

export default function ConnectionForm({
  onConnected,
  onCancel,
}: ConnectionFormProps) {
  // 🏗️ Form state management
  const [config, setConfig] = useState<DatabaseConfig>({
    host: "localhost",
    port: "5432",
    database: "",
    username: "",
    password: "",
  });

  // 🔄 Connection status tracking
  const [status, setStatus] = useState<{
    type: "idle" | "connecting" | "success" | "error";
    message: string;
  }>({
    type: "idle",
    message: "",
  });

  // 📝 Handle form input changes
  const handleChange = (field: keyof DatabaseConfig, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear status when user starts typing
    if (status.type !== "idle") {
      setStatus({ type: "idle", message: "" });
    }
  };

  // 🔌 Handle connection attempt
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!config.database || !config.username || !config.password) {
      setStatus({
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    setStatus({ type: "connecting", message: "Connecting to database..." });

    try {
      console.log("🔄 Attempting database connection...");
      const result = await api.connectDatabase(config);

      if (result.success) {
        setStatus({
          type: "success",
          message: "Connected successfully! Loading schema...",
        });

        // 🎉 Success! Pass the config back to parent
        setTimeout(() => {
          onConnected(config);
        }, 1000); // Brief delay to show success message
      } else {
        setStatus({
          type: "error",
          message: result.message || "Connection failed",
        });
      }
    } catch (error) {
      console.error("❌ Connection error:", error);
      setStatus({
        type: "error",
        message: "Network error - is the backend running?",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 🎨 Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
            <Database className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connect to Database
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your PostgreSQL connection details to visualize your schema
          </p>
        </div>

        {/* 📋 Connection Form */}
        <form className="mt-8 space-y-6" onSubmit={handleConnect}>
          <div className="space-y-4">
            {/* Host */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Host <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={config.host}
                onChange={(e) => handleChange("host", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:ring-opacity-60 focus:border-blue-500 !text-gray-900 !bg-white autofill:!bg-white autofill:!text-gray-900"
                placeholder="localhost"
              />
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Port <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={config.port}
                onChange={(e) => handleChange("port", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:ring-opacity-60 focus:border-blue-500 !text-gray-900 !bg-white autofill:!bg-white autofill:!text-gray-900"
                placeholder="5432"
              />
            </div>

            {/* Database */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Database Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={config.database}
                onChange={(e) => handleChange("database", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:ring-opacity-60 focus:border-blue-500 !text-gray-900 !bg-white autofill:!bg-white autofill:!text-gray-900"
                placeholder="my_database"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={config.username}
                onChange={(e) => handleChange("username", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:ring-opacity-60 focus:border-blue-500 !text-gray-900 !bg-white autofill:!bg-white autofill:!text-gray-900"
                placeholder="postgres"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={config.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:ring-opacity-60 focus:border-blue-500 !text-gray-900 !bg-white autofill:!bg-white autofill:!text-gray-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* 📊 Status Message */}
          {status.message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md ${
                status.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : status.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : status.type === "connecting"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-gray-50 text-gray-700 border border-gray-200"
              }`}
            >
              {status.type === "success" && <CheckCircle className="w-4 h-4" />}
              {status.type === "error" && <AlertCircle className="w-4 h-4" />}
              {status.type === "connecting" && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span className="text-sm">{status.message}</span>
            </div>
          )}

          {/* 🔘 Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={status.type === "connecting"}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white !bg-green-500 !bg-opacity-80 hover:!bg-green-600 hover:!bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed !border-none"
            >
              {status.type === "connecting" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Connect to Database
                </>
              )}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* 💡 Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: Make sure your PostgreSQL server is running and accessible
          </p>
        </div>
      </div>
    </div>
  );
}
