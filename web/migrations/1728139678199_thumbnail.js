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
  pgm.addColumns("editions", {
    thumbnail: {
      type: "INT",
      references: "files",
    },
  });
  pgm.createView(
    "last_editions",
    { replace: true },
    `
    SELECT e.id,
      article_id,
      notes,
      published_at,
      title,
      content,
      (SELECT min(editions.published_at) AS min
        FROM editions
        WHERE editions.article_id = e.article_id) AS first_published_at,
      published_at AS last_published_at,
      thumbnail AS thumbnail_id,
      files.name AS thumbnail_name
    FROM editions e
      LEFT JOIN files ON e.thumbnail = files.id
    WHERE published_at = (
      SELECT max(editions.published_at) AS max
      FROM editions
      WHERE editions.article_id = e.article_id)`,
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropView("last_editions");
  /* copy-pasted from existing view */
  pgm.createView(
    "last_editions",
    {},
    `
    SELECT id,
      article_id,
      notes,
      published_at,
      title,
      content,
      (SELECT min(editions.published_at) AS min
        FROM editions
        WHERE editions.article_id = e.article_id) AS first_published_at,
      published_at AS last_published_at
    FROM editions e
    WHERE published_at = (( SELECT max(editions.published_at) AS max
      FROM editions
      WHERE editions.article_id = e.article_id))`,
  );
  pgm.dropColumns("editions", ["thumbnail"]);
};
