import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  RefreshCw,
  Database,
  AlertCircle,
  Hash,
  Type,
  Calendar,
  CheckSquare,
  Key,
  Table,
} from "lucide-react";
import { api } from "../services/api";

interface DataPanelProps {
  tableName: string | null;
  onClose: () => void;
}

// Type for table row data (generic record)
type TableRow = Record<string, unknown>;

// Function to get table color based on name patterns (same as TableNode)
const getTableColor = (tableName: string) => {
  if (
    tableName.includes("user") ||
    tableName.includes("customer") ||
    tableName.includes("account")
  ) {
    return "db-blue";
  }
  if (
    tableName.includes("order") ||
    tableName.includes("payment") ||
    tableName.includes("transaction")
  ) {
    return "db-green";
  }
  if (
    tableName.includes("product") ||
    tableName.includes("item") ||
    tableName.includes("inventory")
  ) {
    return "db-orange";
  }
  if (
    tableName.includes("category") ||
    tableName.includes("tag") ||
    tableName.includes("group")
  ) {
    return "db-purple";
  }
  if (
    tableName.includes("log") ||
    tableName.includes("session") ||
    tableName.includes("config")
  ) {
    return "db-red";
  }

  // Default color assignment based on first letter
  const firstChar = tableName.charAt(0).toLowerCase();
  const colorIndex = firstChar.charCodeAt(0) % 5;
  const colors = ["db-blue", "db-orange", "db-green", "db-purple", "db-red"];
  return colors[colorIndex];
};

// Function to get header gradient classes based on color
const getHeaderGradient = (color: string) => {
  const gradientMap = {
    "db-blue": "bg-gradient-to-r from-blue-500 to-blue-600",
    "db-orange": "bg-gradient-to-r from-orange-500 to-orange-600",
    "db-green": "bg-gradient-to-r from-green-500 to-green-600",
    "db-purple": "bg-gradient-to-r from-purple-500 to-purple-600",
    "db-red": "bg-gradient-to-r from-red-500 to-red-600",
  };

  return (
    gradientMap[color as keyof typeof gradientMap] || gradientMap["db-blue"]
  );
};

const DataPanel: React.FC<DataPanelProps> = ({ tableName, onClose }) => {
  const [data, setData] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTableData = useCallback(async () => {
    if (!tableName) return;

    setLoading(true);
    setError(null);

    try {
      const tableData = await api.getTableData(tableName);
      setData(tableData || []);
    } catch (err) {
      setError("Failed to load table data");
      console.error("Error loading table data:", err);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    if (tableName) {
      loadTableData();
    }
  }, [tableName, loadTableData]);

  // Format cell values based on data type
  const formatCellValue = (value: unknown) => {
    if (value === null || value === undefined) {
      return (
        <span className="text-gray-400 italic text-xs bg-gray-100 px-2 py-1 rounded">
          NULL
        </span>
      );
    }

    if (typeof value === "boolean") {
      return (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value.toString().toUpperCase()}
        </span>
      );
    }

    if (typeof value === "number") {
      return (
        <span className="font-mono text-blue-600 font-medium">
          {value.toLocaleString()}
        </span>
      );
    }

    if (value instanceof Date) {
      return (
        <span className="text-red-600 text-xs">{value.toLocaleString()}</span>
      );
    }

    // Handle timestamp strings
    if (
      typeof value === "string" &&
      value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    ) {
      return (
        <span className="text-red-600 text-xs">
          {new Date(value).toLocaleString()}
        </span>
      );
    }

    // Regular string - truncate if too long
    const stringValue = String(value);
    if (stringValue.length > 50) {
      return (
        <div className="group relative">
          <span className="cursor-help">{stringValue.substring(0, 50)}...</span>
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 whitespace-pre-wrap max-w-xs z-50">
            {stringValue}
          </div>
        </div>
      );
    }

    return <span className="text-gray-800">{stringValue}</span>;
  };

  // Calculate dynamic width based on column count (minimum 25% of viewport, maximum 50%)
  const calculatePanelWidth = () => {
    if (!data || data.length === 0) return "w-1/3";

    const columnCount = Object.keys(data[0]).length;

    if (columnCount <= 3) return "w-1/4";
    if (columnCount <= 6) return "w-1/3";
    if (columnCount <= 9) return "w-2/5";
    return "w-1/2";
  };

  const isIdColumn = (columnName: string) => {
    // Enhanced ID pattern matching for numbered IDs like USER_ID, CATEGORY_ID
    const idPatterns = /^(id|.*_id|.*_id[0-9]*|[a-z]+_?id[0-9]*)$/i;
    return idPatterns.test(columnName);
  };

  // Get data type icon based on inferred type
  const getDataTypeIcon = (columnName: string, inferredType: string) => {
    const isId = isIdColumn(columnName);
    const isNumeric = inferredType === "integer" || inferredType === "number";

    return (
      <div className="flex items-center gap-1">
        {/* Primary/Foreign key icon */}
        {isId && <Key className="w-3 h-3 text-yellow-400" />}

        {/* Data type icon */}
        {inferredType === "boolean" && (
          <CheckSquare className="w-3 h-3 text-green-400" />
        )}
        {isNumeric && <Hash className="w-3 h-3 text-blue-400" />}
        {(inferredType === "date" || inferredType === "timestamp") && (
          <Calendar className="w-3 h-3 text-red-400" />
        )}
        {inferredType === "varchar" && !isId && (
          <Type className="w-3 h-3 text-gray-400" />
        )}
      </div>
    );
  };

  // Smart column width categorization
  const getColumnWidth = (columnName: string, dataType: string) => {
    const name = columnName.toLowerCase();
    const type = dataType.toLowerCase();

    // Narrow columns (60px) - IDs, flags, single chars, short codes
    if (
      // ID patterns - includes numbered IDs like USER_ID, CATEGORY_ID
      /^(id|.*_id|.*_id[0-9]*|[a-z]+_?id[0-9]*)$/i.test(columnName) ||
      // Boolean/flag patterns
      /^(is_|has_|can_|should_|active|enabled|visible|deleted|archived)/.test(
        name
      ) ||
      // Status and simple codes
      /^(status|state|type|kind|flag|code)$/i.test(columnName) ||
      // Data types
      type.includes("boolean") ||
      type.includes("bit") ||
      // Short varchar
      (type.includes("varchar") && type.match(/varchar\(([1-5])\)/))
    ) {
      return "60px";
    }

    // Wide columns (200px) - Emails, longer descriptions, URLs
    if (
      // Email patterns
      /email|mail/.test(name) ||
      // Description patterns
      /description|desc|summary|title|subject|caption/.test(name) ||
      // Address patterns
      /address|location|url|link|path/.test(name) ||
      // Name patterns for full names
      /full_name|display_name|complete_name/.test(name) ||
      // Medium text fields
      (type.includes("varchar") && type.match(/varchar\(([1-9][0-9]{2,})\)/)) ||
      type.includes("text")
    ) {
      return "200px";
    }

    // Extra large columns (300px) - Long content fields
    if (
      // Content patterns
      /content|body|message|comment|note|review|feedback/.test(name) ||
      // Large text types
      type.includes("longtext") ||
      type.includes("mediumtext") ||
      (type.includes("varchar") && type.match(/varchar\(([5-9][0-9]{2,})\)/))
    ) {
      return "300px";
    }

    // Medium columns (120px) - Default for most fields
    return "120px";
  };

  if (!tableName) return null;

  // Get table color and header gradient
  const tableColor = getTableColor(tableName);
  const headerGradient = getHeaderGradient(tableColor);

  return (
    <div
      className={`fixed right-4 bottom-4 h-2/3 ${calculatePanelWidth()} bg-white shadow-2xl z-50 flex flex-col rounded-xl border border-gray-200`}
    >
      {/* Header */}
      <div
        className={`${headerGradient} text-white p-4 flex justify-between items-center rounded-t-xl`}
      >
        <div className="flex items-start gap-3">
          <Table className="w-6 h-6 mt-2" />
          <div>
            <h2 className="text-xl font-bold">{tableName}</h2>
            <p className="text-sm opacity-90">
              {loading
                ? "Loading..."
                : error
                ? "Error loading data"
                : `${data.length} ${data.length === 1 ? "row" : "rows"}`}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={loadTableData}
            disabled={loading}
            className=" !bg-transparent w-5 rounded-lg transition-colors disabled:opacity-50 !border-none"
            title="Refresh data"
          >
            <RefreshCw
              className={`w-4 h-4 text-white ${loading ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={onClose}
            className="!bg-transparent rounded-lg transition-colors !border-none"
            title="Close panel"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-gray-500">Loading table data...</p>
            </div>
          </div>
        ) : data.length === 0 && !error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-lg font-medium">No data found</p>
              <p className="text-sm">This table appears to be empty</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="p-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-auto max-h-full">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-600 border-b border-gray-500">
                        {data.length > 0 &&
                          Object.keys(data[0]).map((column) => {
                            // Get the data type for this column from the first non-null value
                            const sampleValue = data.find(
                              (row) => row[column] !== null
                            )?.[column];
                            let inferredType = "varchar";

                            if (typeof sampleValue === "boolean") {
                              inferredType = "boolean";
                            } else if (typeof sampleValue === "number") {
                              inferredType = "integer";
                            } else if (sampleValue instanceof Date) {
                              inferredType = "date";
                            } else if (
                              typeof sampleValue === "string" &&
                              sampleValue.match(
                                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
                              )
                            ) {
                              inferredType = "timestamp";
                            }

                            const columnWidth = getColumnWidth(
                              column,
                              inferredType
                            );

                            return (
                              <th
                                key={column}
                                className={`text-left p-3 font-bold text-white text-sm uppercase tracking-wide`}
                                style={{
                                  width: columnWidth,
                                  minWidth: columnWidth,
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  {getDataTypeIcon(column, inferredType)}
                                  <span>{column}</span>
                                </div>
                              </th>
                            );
                          })}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={`border-b border-gray-100 hover:bg-blue-50 transition-colors group ${
                            rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          {Object.entries(row).map(
                            ([columnName, value], cellIndex) => {
                              // Get the same width calculation as header
                              const sampleValue = data.find(
                                (r) => r[columnName] !== null
                              )?.[columnName];
                              const inferredType =
                                typeof sampleValue === "boolean"
                                  ? "boolean"
                                  : typeof sampleValue === "number"
                                  ? "integer"
                                  : "varchar";
                              const columnWidth = getColumnWidth(
                                columnName,
                                inferredType
                              );

                              return (
                                <td
                                  key={cellIndex}
                                  className={`p-3 text-sm border-r border-gray-100 last:border-r-0 transition-colors ${
                                    isIdColumn(columnName)
                                      ? "bg-yellow-50 group-hover:bg-yellow-100"
                                      : "group-hover:bg-blue-50"
                                  }`}
                                  style={{
                                    width: columnWidth,
                                    minWidth: columnWidth,
                                  }}
                                >
                                  {formatCellValue(value)}
                                </td>
                              );
                            }
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-4 text-xs text-gray-500 text-center">
                Showing all rows • Click refresh to reload data
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPanel;
