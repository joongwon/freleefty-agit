use crate::schema::{Edition, EditionSummary};

/// Create an edition of an article from a draft
/// # Arguments
/// * `con` - The database connection
/// * `draft_id` - The draft ID
/// * `author_id` - The author ID
/// # Returns
/// (article_id, edition_id) of the created edition
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn create_edition_from_draft<'e, E>(
  con: E,
  draft_id: i32,
  author_id: &str,
  notes: &str,
) -> Result<(i32, i32), sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"INSERT INTO editions (article_id, title, content, notes)
    SELECT article_id, title, content, $1
    FROM drafts
    WHERE id = $2 AND (SELECT author_id FROM articles WHERE articles.id = article_id) = $3
    RETURNING article_id, id"#,
    notes,
    draft_id,
    author_id,
  )
  .fetch_one(con)
  .await
  .map(|r| (r.article_id, r.id))
}

/// List editions of an article
/// # Arguments
/// * `con` - The database connection
/// * `article_id` - The article ID
/// # Returns
/// A vector of `EditionSummary` containing the most recent editions
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn list_editions<'e, E>(
  con: E,
  article_id: i32,
) -> Result<Vec<EditionSummary>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT id, title, notes, published_at
    FROM editions
    WHERE article_id = $1
    ORDER BY published_at DESC"#,
    article_id,
  )
  .fetch_all(con)
  .await
  .map(|rows| {
    rows
      .into_iter()
      .map(|r| EditionSummary {
        id: r.id,
        title: r.title,
        notes: r.notes,
        published_at: r.published_at.to_string(),
      })
      .collect()
  })
}

/// List edition ids of an article
/// # Arguments
/// * `con` - The database connection
/// * `article_id` - The article ID
/// # Returns
/// A vector of edition IDs
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn list_edition_ids<'e, E>(con: E, article_id: i32) -> Result<Vec<i32>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT id
    FROM editions
    WHERE article_id = $1"#,
    article_id,
  )
  .fetch_all(con)
  .await
  .map(|rows| rows.into_iter().map(|r| r.id).collect())
}

/// Get an edition by its ID
/// # Arguments
/// * `con` - The database connection
/// * `id` - The edition ID
/// # Returns
/// An `Option<Edition>` containing the edition
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_edition<'e, E>(con: E, id: i32) -> Result<Option<Edition>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT id, article_id, title, content, notes, published_at
    FROM editions
    WHERE id = $1"#,
    id,
  )
  .fetch_optional(con)
  .await
  .map(|r| {
    r.map(|r| Edition {
      id: r.id,
      article_id: r.article_id,
      title: r.title,
      content: r.content,
      notes: r.notes,
      published_at: r.published_at.to_string(),
      editions: vec![],
      files: vec![],
    })
  })
}
