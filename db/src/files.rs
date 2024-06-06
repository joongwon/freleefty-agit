use crate::schema::{File, FileInfo};

/// List files for a given article
/// # Arguments
/// * `con` - The database connection
/// * `article_id` - The article id
/// # Returns
/// A vector of files
/// # Errors
/// If the query fails, an error is returned
pub async fn list_article_files<'e, E>(con: E, article_id: i32) -> Result<Vec<File>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT id, name
        FROM files
        WHERE edition_id = (SELECT id FROM last_editions WHERE article_id = $1)"#,
    article_id
  )
  .fetch_all(con)
  .await
  .map(|rows| {
    rows
      .into_iter()
      .map(|row| File {
        id: row.id,
        name: row.name,
      })
      .collect()
  })
}

/// List files for a given edition
/// # Arguments
/// * `con` - The database connection
/// * `edition_id` - The edition id
/// # Returns
/// A vector of files
/// # Errors
/// If the query fails, an error is returned
pub async fn list_edition_files<'e, E>(con: E, edition_id: i32) -> Result<Vec<File>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT id, name
        FROM files
        WHERE edition_id = $1"#,
    edition_id
  )
  .fetch_all(con)
  .await
  .map(|rows| {
    rows
      .into_iter()
      .map(|row| File {
        id: row.id,
        name: row.name,
      })
      .collect()
  })
}

/// List files for a given draft
/// # Arguments
/// * `con` - The database connection
/// * `draft_id` - The draft id
/// # Returns
/// A vector of files
/// # Errors
/// If the query fails, an error is returned
pub async fn list_draft_files<'e, E>(con: E, draft_id: i32) -> Result<Vec<File>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT id, name
        FROM files
        WHERE draft_id = $1"#,
    draft_id
  )
  .fetch_all(con)
  .await
  .map(|rows| {
    rows
      .into_iter()
      .map(|row| File {
        id: row.id,
        name: row.name,
      })
      .collect()
  })
}

pub enum CreateFileResult {
  Ok(i32),
  NameConflict,
}

/// Create a new file
/// # Arguments
/// * `con` - The database connection
/// * `draft_id` - The draft id
/// * `name` - The file name
/// # Returns
/// Created file
/// # Errors
/// If the query fails, an error is returned
pub async fn create_file<'e, E>(
  con: E,
  draft_id: i32,
  name: &str,
) -> Result<CreateFileResult, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  let result = sqlx::query!(
    r#"INSERT INTO files (draft_id, name)
        VALUES ($1, $2)
        RETURNING id"#,
    draft_id,
    name
  )
  .fetch_one(con)
  .await
  .map(|row| row.id);
  match result {
    Ok(id) => Ok(CreateFileResult::Ok(id)),
    Err(sqlx::Error::Database(err)) => match err.constraint() {
      Some("files_draft_id_name_key") => Ok(CreateFileResult::NameConflict),
      _ => Err(sqlx::Error::Database(err)),
    },
    Err(err) => Err(err),
  }
}

/// Get file info
/// # Arguments
/// * `con` - The database connection
/// * `file_id` - The file id
/// # Returns
/// File info
/// # Errors
/// If the query fails, an error is returned
pub async fn get_file_info<'e, E>(con: E, file_id: i32) -> Result<Option<FileInfo>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT author_id, name, draft_id
        FROM files
        JOIN drafts ON files.draft_id = drafts.id
        JOIN articles ON drafts.article_id = articles.id
        WHERE files.id = $1 AND draft_id IS NOT NULL"#,
    file_id
  )
  .fetch_optional(con)
  .await
  .map(|row| {
    row.map(|row| FileInfo {
      author_id: row.author_id,
      name: row.name,
      draft_id: row.draft_id.unwrap(),
    })
  })
}

/// Delete a file
/// # Arguments
/// * `con` - The database connection
/// * `file_id` - The file id
/// # Returns
/// None
/// # Errors
/// If the query fails, an error is returned
pub async fn delete_file<'e, E>(con: E, file_id: i32) -> Result<(), sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"DELETE FROM files
        WHERE id = $1"#,
    file_id
  )
  .execute(con)
  .await
  .map(|_| ())
}

/// Copy article files to a draft
/// # Arguments
/// * `con` - The database connection
/// * `article_id` - The article id
/// * `draft_id` - The draft id
/// # Returns
/// List of old and new file ids and names
/// # Errors
/// If the query fails, an error is returned
pub async fn copy_article_files_to_draft<'e, E>(
  con: E,
  article_id: i32,
  draft_id: i32,
) -> Result<Vec<(i32, i32, String)>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"WITH new_files as (
        INSERT INTO files (draft_id, name)
          SELECT $1, name
          FROM files
          WHERE edition_id = (SELECT id FROM last_editions WHERE article_id = $2)
        RETURNING id, name)
      SELECT files.id as old_id, new_files.id as new_id, files.name
      FROM files JOIN new_files ON files.name = new_files.name
      WHERE edition_id = (SELECT id FROM last_editions WHERE article_id = $2)"#,
    draft_id,
    article_id
  )
  .fetch_all(con)
  .await
  .map(|rows| {
    rows
      .into_iter()
      .map(|row| (row.old_id, row.new_id, row.name))
      .collect()
  })
}

/// Copy draft files to an edition
/// # Arguments
/// * `con` - The database connection
/// * `draft_id` - The draft id
/// * `edition_id` - The edition id
/// # Returns
/// None
/// # Errors
/// If the query fails, an error is returned
pub async fn move_draft_files_to_edition<'e, E>(
  con: E,
  draft_id: i32,
  edition_id: i32,
) -> Result<(), sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"UPDATE files
        SET edition_id = $1, draft_id = NULL
        WHERE draft_id = $2"#,
    edition_id,
    draft_id
  )
  .execute(con)
  .await
  .map(|_| ())
}
