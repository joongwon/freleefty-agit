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
  // 기존 사용자들은 0으로 초기화
  pgm.addColumn("users", {
    name_updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("TO_TIMESTAMP(0)"),
    },
  });
  // 새로운 사용자들은 생성 시간으로 초기화
  pgm.alterColumn("users", "name_updated_at", {
    default: pgm.func("CURRENT_TIMESTAMP"),
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropColumn("users", "name_updated_at");
};
