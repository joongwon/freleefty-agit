DROP TABLE IF EXISTS files;

CREATE TABLE files (
  id          INT           PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  edition_id  INT           REFERENCES articles (id) ON DELETE CASCADE,
  draft_id    INT           REFERENCES drafts (id) ON DELETE CASCADE,
  name        VARCHAR(255)  NOT NULL,
  mime_type   VARCHAR(255)  NOT NULL,
  uploaded_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (draft_id, name)
);
