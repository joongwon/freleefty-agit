CREATE TABLE editions (
  id           INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  article_id   INT          NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  notes        VARCHAR(255) NOT NULL,
  published_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  title        VARCHAR(255) NOT NULL,
  content      TEXT NOT NULL
);

INSERT INTO editions (article_id, notes, published_at, title, content)
  SELECT id, '초판', published_at, title, content
  FROM articles;

ALTER TABLE articles
  DROP COLUMN title,
  DROP COLUMN content,
  DROP COLUMN published_at;

ALTER TABLE drafts
  -- 개정하고자 하는 일지. 새로운 일지를 쓰고자 한다면 NULL
  -- 한 일지에 대해 한번에 하나의 개정 초안만을 만들 수 있다.
  ADD COLUMN article_id INT UNIQUE;

CREATE VIEW last_editions AS
  SELECT * FROM editions e
  WHERE e.published_at = (SELECT MAX(published_at) FROM editions WHERE article_id = e.article_id);
