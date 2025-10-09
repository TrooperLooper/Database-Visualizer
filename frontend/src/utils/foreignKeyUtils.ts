import type { ForeignKey } from "../components/ForeignKeyList";
import type { SchemaResponse } from "../services/api";

// Utility to convert SchemaResponse.relationships to ForeignKey[]
export function extractForeignKeys(schema: SchemaResponse): ForeignKey[] {
  return schema.relationships.map(
    (
      rel: {
        source_table: string;
        source_column: string;
        target_table: string;
        target_column: string;
      },
      idx: number
    ) => ({
      id: `${rel.source_table}_${rel.source_column}_${rel.target_table}_${rel.target_column}_${idx}`,
      sourceTable: rel.source_table,
      sourceColumn: rel.source_column,
      targetTable: rel.target_table,
      targetColumn: rel.target_column,
    })
  );
}
