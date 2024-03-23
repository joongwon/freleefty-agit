DROP VIEW last_editions;

CREATE VIEW last_editions AS
  SELECT *,
    (SELECT MIN(published_at) FROM editions WHERE article_id = e.article_id) as first_published_at,
    published_at as last_published_at
  FROM editions e
  WHERE e.published_at = (SELECT MAX(published_at) FROM editions WHERE article_id = e.article_id);
