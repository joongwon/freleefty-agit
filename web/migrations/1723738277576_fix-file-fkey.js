/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.db.query(
    "DELETE FROM files WHERE edition_id NOT IN (SELECT id FROM editions)",
  );
  pgm.dropConstraint("files", "files_edition_id_fkey");
  pgm.addConstraint("files", "files_edition_id_fkey", {
    foreignKeys: {
      columns: "edition_id",
      references: "editions(id)",
      onDelete: "CASCADE",
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropConstraint("files", "files_edition_id_fkey");
  pgm.addConstraint("files", "files_edition_id_fkey", {
    foreignKeys: {
      columns: "edition_id",
      references: "articles(id)",
      onDelete: "CASCADE",
    },
  });
};
