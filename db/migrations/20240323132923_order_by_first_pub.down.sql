DROP VIEW last_editions;

CREATE VIEW last_editions AS
  SELECT * FROM editions e
  WHERE e.published_at = (SELECT MAX(published_at) FROM editions WHERE article_id = e.article_id);
