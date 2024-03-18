ALTER TABLE drafts
  ADD COLUMN author_id VARCHAR(20) REFERENCES users(id);

UPDATE drafts
SET author_id = a.author_id
FROM articles a
WHERE drafts.article_id = a.id;

ALTER TABLE drafts
  ALTER COLUMN author_id SET NOT NULL,
  DROP COLUMN article_id;

DELETE FROM articles
  WHERE id NOT IN (SELECT article_id FROM editions);

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
