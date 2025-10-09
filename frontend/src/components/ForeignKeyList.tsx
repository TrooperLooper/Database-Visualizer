import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

// Helper functions from DataPanel for color matching
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
  const firstChar = tableName.charAt(0).toLowerCase();
  const colorIndex = firstChar.charCodeAt(0) % 5;
  const colors = ["db-blue", "db-orange", "db-green", "db-purple", "db-red"];
  return colors[colorIndex];
};

// Solid color classes for pills (no gradients)
const getSolidColor = (color: string) => {
  const solidMap: Record<string, string> = {
    "db-blue": "bg-blue-600",
    "db-orange": "bg-orange-500",
    "db-green": "bg-green-600",
    "db-purple": "bg-purple-600",
    "db-red": "bg-red-600",
  };
  return solidMap[color] || solidMap["db-blue"];
};

// Foreign key type
export interface ForeignKey {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
}

interface ForeignKeyListProps {
  foreignKeys: ForeignKey[];
}

export const ForeignKeyList: React.FC<ForeignKeyListProps> = ({
  foreignKeys,
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="fixed top-4 right-1 z-50 w-96 max-w-full">
      <div className="bg-white shadow-xl rounded-xl border border-gray-200">
        <div className="px-2 py-2 border-b border-gray-100 flex items-center justify-between bg-white">
          <span className="font-bold text-xl flex items-center gap-2 text-gray-900">
            <ArrowRight className="text-green-600" style={{ height: '1em', width: '1em' }} />
            Foreign Keys
          </span>
        </div>
        <ul className="divide-y divide-gray-100">
          {foreignKeys.map((fk) => {
            const sourceColor = getSolidColor(getTableColor(fk.sourceTable));
            const targetColor = getSolidColor(getTableColor(fk.targetTable));
            return (
              <li key={fk.id}>
                <button
                  className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-gray-50 focus:outline-none bg-white text-gray-900"
                  onClick={() => setExpanded(expanded === fk.id ? null : fk.id)}
                  style={{ minHeight: 0 }}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${sourceColor}`}
                    >
                      {fk.sourceTable}
                    </span>
                    <span className="mx-0 text-gray-400 text-xs">&gt;</span>
                    <span
                      className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${targetColor}`}
                    >
                      {fk.targetTable}
                    </span>
                  </div>
                </button>
                {expanded === fk.id && (
                  <div className="px-8 pb-2 text-xs text-gray-700 flex items-center gap-2">
                    <span className={`font-mono`}>
                      {fk.sourceTable}.{fk.sourceColumn}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className={`font-mono`}>
                      {fk.targetTable}.{fk.targetColumn}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
