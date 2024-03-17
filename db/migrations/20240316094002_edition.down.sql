ALTER TABLE articles
  ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN content TEXT NOT NULL DEFAULT '',
  ADD COLUMN published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE articles
SET title        = e.title,
    content      = e.content,
    published_at = e.published_at
FROM last_editions e
WHERE articles.id = e.article_id;

DROP VIEW last_editions;

DROP TABLE editions;

ALTER TABLE articles
  ALTER COLUMN title   DROP DEFAULT,
  ALTER COLUMN content DROP DEFAULT;

ALTER TABLE drafts
  DROP COLUMN article_id;
