import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Table, Key, Link, ArrowLeft, ArrowRight } from "lucide-react";

interface Column {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
}

interface Relationship {
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
}

interface TableNodeProps {
  data: {
    tableName: string;
    columns: Column[];
    onClick: (tableName: string) => void;
    relationships: Relationship[];
    tableColorMap: Record<string, string>;
  };
}

// Color mapping for different table categories
const getColorClasses = (color: string) => {
  const colorMap = {
    "db-blue": {
      border: "border-blue-500",
      header: "bg-gradient-to-r from-blue-500 to-blue-600",
      hover: "hover:border-blue-600 hover:shadow-blue-200",
      shadow: "shadow-lg hover:shadow-xl",
    },
    "db-orange": {
      border: "border-orange-500",
      header: "bg-gradient-to-r from-orange-500 to-orange-600",
      hover: "hover:border-orange-600 hover:shadow-orange-200",
      shadow: "shadow-lg hover:shadow-xl",
    },
    "db-green": {
      border: "border-green-500",
      header: "bg-gradient-to-r from-green-500 to-green-600",
      hover: "hover:border-green-600 hover:shadow-green-200",
      shadow: "shadow-lg hover:shadow-xl",
    },
    "db-purple": {
      border: "border-purple-500",
      header: "bg-gradient-to-r from-purple-500 to-purple-600",
      hover: "hover:border-purple-600 hover:shadow-purple-200",
      shadow: "shadow-lg hover:shadow-xl",
    },
    "db-red": {
      border: "border-red-500",
      header: "bg-gradient-to-r from-red-500 to-red-600",
      hover: "hover:border-red-600 hover:shadow-red-200",
      shadow: "shadow-lg hover:shadow-xl",
    },
  };

  return colorMap[color as keyof typeof colorMap] || colorMap["db-blue"];
};

// Get icon for data type
const getDataTypeIcon = (dataType: string) => {
  if (dataType.includes("id") || dataType === "serial") {
    return <Key className="w-3 h-3 text-yellow-600" />;
  }
  if (dataType.includes("varchar") || dataType.includes("text")) {
    return <span className="text-xs font-bold text-gray-600">T</span>;
  }
  if (dataType.includes("int") || dataType.includes("numeric")) {
    return <span className="text-xs font-bold text-green-600">#</span>;
  }
  if (dataType.includes("bool")) {
    return <span className="text-xs font-bold text-purple-600">B</span>;
  }
  if (dataType.includes("timestamp") || dataType.includes("date")) {
    return <span className="text-xs font-bold text-orange-600">D</span>;
  }
  // Default: show gray T for unknown types
  return <span className="text-xs font-bold text-gray-600">T</span>;
};

// Assign colors based on table name patterns
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

const TableNode: React.FC<TableNodeProps> = ({ data }) => {
  const { tableName, columns, onClick } = data;
  const color = getTableColor(tableName);
  const colorClasses = getColorClasses(color);

  // Detect primary key columns
  const primaryKeyColumns = columns.filter(
    (col) =>
      col.column_name.toLowerCase().includes("id") ||
      col.column_name === "id" ||
      col.data_type === "serial"
  );

  // Detect foreign key columns
  const foreignKeyColumns = columns.filter(
    (col) => col.column_name.endsWith("_id") && col.column_name !== "id"
  );

  return (
    <div
      className={`
        bg-white border-2 ${colorClasses.border} ${colorClasses.hover} 
        rounded-xl ${colorClasses.shadow} min-w-72 cursor-pointer 
        transition-all duration-300 ease-in-out
        transform hover:scale-105 hover:-translate-y-1
      `}
      onClick={() => onClick(tableName)}
    >
      {/* Table Header */}
      <div
        className={`${colorClasses.header} text-white px-4 py-3 rounded-t-xl`}
      >
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5" />
          <h3 className="font-bold text-base uppercase tracking-wide">
            {tableName}
          </h3>
        </div>
        <div className="text-xs opacity-90 mt-1">
          {columns.length} {columns.length === 1 ? "column" : "columns"}
          {primaryKeyColumns.length > 0 && (
            <span className="ml-2">• {primaryKeyColumns.length} PK</span>
          )}
          {foreignKeyColumns.length > 0 && (
            <span className="ml-2">• {foreignKeyColumns.length} FK</span>
          )}
        </div>
      </div>

      {/* Columns List */}
      <div className="p-4 space-y-2">
        {columns.slice(0, 8).map((column: Column, index: number) => {
          const isPrimaryKey = primaryKeyColumns.includes(column);
          const isForeignKey = foreignKeyColumns.includes(column);

          // Outgoing FK: this column is a source_column in a relationship from this table
          const outgoingFK = data.relationships.find(
            (rel: Relationship) =>
              rel.source_table === data.tableName &&
              rel.source_column === column.column_name
          );
          // Incoming FK: this column is a target_column in a relationship to this table
          const incomingFKs = data.relationships.filter(
            (rel: Relationship) =>
              rel.target_table === data.tableName &&
              rel.target_column === column.column_name
          );

          return (
            <div
              key={index}
              className={`
                flex items-center justify-between text-sm py-2 px-3 rounded-lg
                border-l-4 transition-all duration-200 hover:bg-gray-50
                ${
                  isPrimaryKey
                    ? "border-l-yellow-400 bg-yellow-50"
                    : isForeignKey
                    ? "border-l-blue-400 bg-blue-50"
                    : "border-l-gray-200 bg-gray-50"
                }
              `}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getDataTypeIcon(column.data_type)}
                </div>
                <span
                  className={`font-semibold truncate ${
                    isPrimaryKey
                      ? "text-yellow-800"
                      : isForeignKey
                      ? "text-blue-800"
                      : "text-gray-700"
                  }`}
                >
                  {column.column_name}
                </span>
                {isForeignKey && (
                  <Link className="w-3 h-3 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {column.data_type}
                </span>
                {column.is_nullable === "NO" && (
                  <span className="text-red-500 text-sm font-bold">*</span>
                )}
                {outgoingFK && (
                  <ArrowRight
                    className="w-3 h-3"
                    style={{
                      color: colorClasses.border
                        .replace("border-", "")
                        .replace("-500", ""),
                    }}
                  />
                )}
                {incomingFKs.map((rel: Relationship, i: number) => {
                  const senderColor =
                    data.tableColorMap[rel.source_table] || "db-blue";
                  const senderColorClass = getColorClasses(senderColor)
                    .border.replace("border-", "")
                    .replace("-500", "");
                  return (
                    <ArrowLeft
                      key={i}
                      className="w-3 h-3"
                      style={{ color: senderColorClass }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {columns.length > 8 && (
          <div className="text-xs text-gray-400 text-center py-3 italic bg-gray-50 rounded-lg">
            +{columns.length - 8} more columns...
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 border-3 border-white bg-gray-500 hover:bg-gray-700 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 border-3 border-white bg-gray-500 hover:bg-gray-700 transition-colors"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 border-3 border-white bg-gray-500 hover:bg-gray-700 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 border-3 border-white bg-gray-500 hover:bg-gray-700 transition-colors"
      />
    </div>
  );
};

export default TableNode;
