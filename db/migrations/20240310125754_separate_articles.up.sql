CREATE TABLE drafts
(
    id           INT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    title        VARCHAR(255) NOT NULL DEFAULT '',
    content      TEXT         NOT NULL DEFAULT '',
    author_id    VARCHAR(20)  NOT NULL REFERENCES users (id) ON UPDATE CASCADE,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO drafts (title, content, author_id, created_at, updated_at)
  SELECT title, content, author_id, created_at, updated_at
  FROM articles
  WHERE published_at IS NULL;

DELETE FROM articles
  WHERE published_at IS NULL;

ALTER TABLE articles
  DROP COLUMN created_at,
  DROP COLUMN updated_at,
  ALTER COLUMN published_at SET NOT NULL,
  ALTER COLUMN published_at SET DEFAULT CURRENT_TIMESTAMP;

CREATE VIEW article_stats AS
SELECT
  a.id,
  (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id) AS comments_count,
  (SELECT COUNT(*) FROM views v WHERE v.article_id = a.id) AS views_count,
  (SELECT COUNT(*) FROM likes l WHERE l.article_id = a.id) AS likes_count
FROM articles a;
