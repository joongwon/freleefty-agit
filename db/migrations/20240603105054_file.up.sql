CREATE TABLE files (
  id          INT           PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  edition_id  INT           REFERENCES articles (id),
  draft_id    INT           REFERENCES drafts (id),
  name        VARCHAR(255)  NOT NULL,
  uploaded_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (draft_id, name)
);
