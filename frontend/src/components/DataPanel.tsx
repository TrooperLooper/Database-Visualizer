import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Database, AlertCircle } from 'lucide-react';
import { DatabaseAPI } from '../services/api';

interface DataPanelProps {
  tableName: string | null;
  onClose: () => void;
}

// Type for table row data (generic record)
type TableRow = Record<string, unknown>;

const DataPanel: React.FC<DataPanelProps> = ({ tableName, onClose }) => {
  const [data, setData] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTableData = useCallback(async () => {
    if (!tableName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const tableData = await DatabaseAPI.getTableData(tableName);
      setData(tableData || []);
    } catch (err) {
      setError('Failed to load table data');
      console.error('Error loading table data:', err);
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

    if (typeof value === 'boolean') {
      return (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {value.toString().toUpperCase()}
        </span>
      );
    }

    if (typeof value === 'number') {
      return (
        <span className="font-mono text-blue-600 font-medium">
          {value.toLocaleString()}
        </span>
      );
    }

    if (value instanceof Date) {
      return (
        <span className="text-purple-600 text-xs">
          {value.toLocaleString()}
        </span>
      );
    }

    // Handle timestamp strings
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return (
        <span className="text-purple-600 text-xs">
          {new Date(value).toLocaleString()}
        </span>
      );
    }

    // Regular string - truncate if too long
    const stringValue = String(value);
    if (stringValue.length > 50) {
      return (
        <div className="group relative">
          <span className="cursor-help">
            {stringValue.substring(0, 50)}...
          </span>
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 whitespace-pre-wrap max-w-xs z-50">
            {stringValue}
          </div>
        </div>
      );
    }

    return <span className="text-gray-800">{stringValue}</span>;
  };

  if (!tableName) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-1/3 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5" />
          <div>
            <h2 className="text-lg font-semibold">{tableName}</h2>
            <p className="text-sm text-blue-100">
              {loading ? (
                'Loading...'
              ) : error ? (
                'Error loading data'
              ) : (
                `${data.length} ${data.length === 1 ? 'row' : 'rows'}`
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={loadTableData}
            disabled={loading}
            className="p-2 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
            title="Close panel"
          >
            <X className="w-4 h-4" />
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
            <div className="p-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {data.length > 0 && Object.keys(data[0]).map((column) => (
                          <th
                            key={column}
                            className="text-left p-3 font-semibold text-gray-700 text-sm uppercase tracking-wide"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                            rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          {Object.values(row).map((value, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="p-3 text-sm border-r border-gray-100 last:border-r-0"
                            >
                              {formatCellValue(value)}
                            </td>
                          ))}
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