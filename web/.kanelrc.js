const kanel = require('kanel');
const { makeKyselyHook } = require('kanel-kysely');

/** @type {import('kanel').KanelConfig} */
module.exports = {
  connection: process.env.DATABASE_URL,
  preRenderHooks: [makeKyselyHook()],
  outputPath: './src/nndb',
  customTypeMap: {
    'pg_catalog.timestamp': 'string',
  },
  generateIdentifierType: (column, details, config) => {
    const result = kanel.defaultGenerateIdentifierType(column, details, config);
    result.typeDefinition = result.typeDefinition.map(t => t.replace('__brand:', '__brand?:'));
    return result;
  },
  enumStyle: 'type',
};
