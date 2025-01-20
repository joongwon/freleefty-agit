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
            declarationType: "generic",
            lines: ["import { z } from 'zod';"],
          },
          {
            declarationType: "typeDeclaration",
            name: "PgTimestamp",
            typeDefinition: ['string & z.BRAND<"PgTimestamp">'],
            exportAs: "named",
          },
        ],
      },
    }),
  ],
  postRenderHooks: [
    (path, lines) => {
      if (path === "src/nndb/utils.ts") {
        return lines;
      }
      let ls = lines;
      if (ls.some((l) => l.includes("PgTimestamp"))) {
        ls = ['import { PgTimestamp } from "@/nndb/utils";', ...ls];
      }
      if (ls.some((l) => l.includes("z.BRAND"))) {
        ls = ['import { z } from "zod";', ...ls];
      }
      return ls;
    },
  ],
  outputPath: "./src/nndb",
  customTypeMap: {
    "pg_catalog.timestamp": "PgTimestamp",
    "pg_catalog.int8": "number",
  },
  generateIdentifierType: (column, details, config) => {
    const result = kanel.defaultGenerateIdentifierType(column, details, config);
    const regex = /\{ __brand: '([^']+)' \}/;
    result.typeDefinition = result.typeDefinition.map((t) =>
      // t.replace("__brand:", "__brand?:"),
      t.replace(regex, "z.BRAND<'$1'>"),
    );
    return result;
  },
  enumStyle: "type",
};
