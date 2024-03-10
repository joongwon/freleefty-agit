/// Create view log
/// # Arguments
/// * `con` - The database connection
/// * `article_id` - The article ID
/// # Returns
/// None
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn create_view_log<'e, E>(con: E, article_id: i32) -> Result<(), sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"INSERT INTO views (article_id) VALUES ($1)"#,
    article_id,
  )
  .execute(con)
  .await?;
  Ok(())
}
