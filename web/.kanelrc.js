const kanel = require("kanel");
const { makeKyselyHook } = require("kanel-kysely");

/** @type {import('kanel').KanelConfig} */
module.exports = {
  connection: process.env.DATABASE_URL,
  preRenderHooks: [
    makeKyselyHook(),
    (acc) => ({
      ...acc,
      "src/nndb/utils": {
        declarations: [
          {
            declarationType: "typeDeclaration",
            name: "PgTimestamp",
            typeDefinition: ['string & { __brand?: "PgTimestamp" }'],
            exportAs: "named",
          },
        ],
      },
    }),
  ],
  postRenderHooks: [
    (path, lines) =>
      path !== "src/nndb/utils.ts" &&
      lines.some((l) => l.includes("PgTimestamp"))
        ? ['import { PgTimestamp } from "@/nndb/utils";', ...lines]
        : lines,
  ],
  outputPath: "./src/nndb",
  customTypeMap: {
    "pg_catalog.timestamp": "PgTimestamp",
    "pg_catalog.int8": "number",
  },
  generateIdentifierType: (column, details, config) => {
    const result = kanel.defaultGenerateIdentifierType(column, details, config);
    result.typeDefinition = result.typeDefinition.map((t) =>
      t.replace("__brand:", "__brand?:"),
    );
    return result;
  },
  enumStyle: "type",
};
