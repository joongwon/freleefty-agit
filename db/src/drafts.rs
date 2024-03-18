use crate::schema::{Draft, DraftSummary};

/// Create an empty draft
/// # Arguments
/// * `con` - The database connection
/// * `author_id` - The author ID
/// * `article_id` - The article ID (if the draft is for an existing article)
/// # Returns
/// The created draft
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn create_draft<'e, E>(con: E, article_id: i32) -> Result<DraftSummary, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"INSERT INTO drafts (article_id) VALUES ($1) RETURNING id, title, created_at, updated_at"#,
    article_id,
  )
  .fetch_one(con)
  .await
  .map(|r| DraftSummary {
    id: r.id,
    title: r.title,
    created_at: r.created_at.to_string(),
    updated_at: r.updated_at.to_string(),
  })
}

/// List drafts sorted by last update date
/// # Arguments
/// * `con` - The database connection
/// * `author_id` - The author ID
/// # Returns
/// A vector of `DraftSummary` containing the most recent drafts
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn list_drafts<'e, E>(con: E, author_id: &str) -> Result<Vec<DraftSummary>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT drafts.id, title, created_at, updated_at
    FROM drafts
    JOIN articles ON drafts.article_id = articles.id
    WHERE author_id = $1
    ORDER BY updated_at DESC"#,
    author_id,
  )
  .fetch_all(con)
  .await
  .map(|rows| {
    rows.into_iter()
      .map(|r| DraftSummary {
        id: r.id,
        title: r.title,
        created_at: r.created_at.to_string(),
        updated_at: r.updated_at.to_string(),
      })
      .collect()
  })
}

/// Get draft by its ID and author ID
/// # Arguments
/// * `con` - The database connection
/// * `id` - The draft ID
/// * `author_id` - The author ID
/// # Returns
/// An `Option<Draft>` containing the draft
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_draft<'e, E>(
  con: E,
  id: i32,
  author_id: &str,
) -> Result<Option<Draft>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT drafts.id, title, content, created_at, updated_at
    FROM drafts
    JOIN articles ON drafts.article_id = articles.id
    WHERE drafts.id = $1 AND author_id = $2"#,
    id,
    author_id,
  )
  .fetch_optional(con)
  .await
  .map(|r| {
    r.map(|r| Draft {
      id: r.id,
      title: r.title,
      content: r.content,
      created_at: r.created_at.to_string(),
      updated_at: r.updated_at.to_string(),
    })
  })
}

/// Update a draft by its ID and author ID
/// # Arguments
/// * `con` - The database connection
/// * `id` - The draft ID
/// * `author_id` - The author ID
/// * `title` - The new title
/// * `content` - The new content
/// # Returns
/// The number of rows affected
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn update_draft<'e, E>(
  con: E,
  id: i32,
  author_id: &str,
  title: &str,
  content: &str,
) -> Result<i64, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"UPDATE drafts SET title = $1, content = $2, updated_at = now()
    WHERE id = $3 AND (SELECT author_id FROM articles WHERE drafts.id = article_id) = $4"#,
    title,
    content,
    id,
    author_id,
  )
  .execute(con)
  .await
  .map(|r| r.rows_affected() as i64)
}

/// Delete a draft by its ID and author ID
/// # Arguments
/// * `con` - The database connection
/// * `id` - The draft ID
/// * `author_id` - The author ID
/// # Returns
/// * Some: The id of the article the draft was for
/// * None: If the draft was not found
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn delete_draft<'e, E>(con: E, id: i32, author_id: &str) -> Result<Option<i32>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"DELETE FROM drafts WHERE id = $1 AND (SELECT author_id FROM articles WHERE drafts.id = article_id) = $2
    RETURNING article_id"#,
    id,
    author_id,
  )
  .fetch_optional(con)
  .await
  .map(|r| r.map(|r| r.article_id))
}

/// Get the length of a draft title by its ID and author ID (used for validation before publishing)
/// # Arguments
/// * `con` - The database connection
/// * `id` - The draft ID
/// * `author_id` - The author ID
/// # Returns
/// The length of the draft title
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_draft_title_length<'e, E>(
  con: E,
  id: i32,
  author_id: &str,
) -> Result<i32, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT LENGTH(title) FROM drafts WHERE id = $1 AND (SELECT author_id FROM articles WHERE drafts.id = article_id) = $2"#,
    id,
    author_id,
  )
  .fetch_one(con)
  .await
  .map(|r| r.length.unwrap_or(0))
}

/// Create an edition of an article from a draft
/// # Arguments
/// * `con` - The database connection
/// * `draft_id` - The draft ID
/// * `author_id` - The author ID
/// # Returns
/// The article ID of the created edition
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn create_edition_from_draft<'e, E>(
  con: E,
  draft_id: i32,
  author_id: &str,
  notes: &str,
) -> Result<i32, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"INSERT INTO editions (article_id, title, content, notes)
    SELECT article_id, title, content, $1
    FROM drafts
    WHERE id = $2 AND (SELECT author_id FROM articles WHERE drafts.id = article_id) = $3
    RETURNING article_id"#,
    notes,
    draft_id,
    author_id,
  )
  .fetch_one(con)
  .await
  .map(|r| r.article_id)
}
