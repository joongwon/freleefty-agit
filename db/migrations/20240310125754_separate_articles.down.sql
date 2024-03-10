DROP VIEW article_stats;

ALTER TABLE articles
  ALTER COLUMN published_at DROP NOT NULL,
  ALTER COLUMN published_at DROP DEFAULT,
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

INSERT INTO articles (title, content, author_id, created_at, updated_at)
  SELECT title, content, author_id, created_at, updated_at
  FROM drafts;

DROP TABLE drafts;
