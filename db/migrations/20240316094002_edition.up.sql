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
  -- 개정하고자 하는 일지. 새 일지를 쓸 때에도 빈 일지가 설정된다.
  -- 한 일지에 대해 한번에 하나의 개정 초안만을 만들 수 있다.
  ADD COLUMN article_id INT UNIQUE REFERENCES articles(id);

-- 기존 초안들에 새로운 일지 할당
ALTER TABLE articles
  ADD COLUMN _draft_id INT;

INSERT INTO articles (_draft_id, author_id)
  SELECT id, author_id
  FROM drafts;

UPDATE drafts
  SET article_id = articles.id
  FROM articles
  WHERE drafts.id = articles._draft_id;

ALTER TABLE articles
  DROP COLUMN _draft_id;

ALTER TABLE drafts
  ALTER COLUMN article_id SET NOT NULL,
  DROP COLUMN author_id;

CREATE VIEW last_editions AS
  SELECT * FROM editions e
  WHERE e.published_at = (SELECT MAX(published_at) FROM editions WHERE article_id = e.article_id);
