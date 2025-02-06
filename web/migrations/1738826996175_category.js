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
  pgm.createTable("categories", {
    id: "id",
    name: { type: "varchar(255)", notNull: true },
    is_group: { type: "boolean", notNull: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    parent_id: {
      type: "integer",
      references: "categories",
      onDelete: "SET NULL",
    },
  });
  pgm.createTable("article_categories", {
    article_id: {
      type: "integer",
      references: "articles",
      onDelete: "CASCADE",
      notNull: true,
    },
    category_id: {
      type: "integer",
      references: "categories",
      onDelete: "CASCADE",
      notNull: true,
    },
  }, {
    constraints: {
      unique: ["article_id", "category_id"]
    }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("article_categories");
  pgm.dropTable("categories");
};
