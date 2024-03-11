/// Mark an article as liked by the user
/// # Arguments
/// * `con` - The database connection
/// * `article_id` - The id of the article
/// * `user_id` - The id of the user
/// # Returns
/// the number of newly liked articles
/// * `1` if the article was liked successfully
/// * `0` if the article was already liked
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn like_article<'e, E>(con: E, article_id: i32, user_id: &str) -> Result<i64, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  let res = sqlx::query!(
    r#"INSERT INTO likes (article_id, user_id) VALUES ($1, $2)"#,
    article_id,
    user_id
  )
  .execute(con)
  .await;
  match res {
    Ok(_) => Ok(1),
    Err(sqlx::Error::Database(err)) => match err.constraint() {
      Some("likes_pkey") => Ok(0),
      _ => Err(sqlx::Error::Database(err)),
    },
    Err(err) => Err(err),
  }
}

/// Mark an article as unliked by the user
/// # Arguments
/// * `con` - The database connection
/// * `article_id` - The id of the article
/// * `user_id` - The id of the user
/// # Returns
/// the number of unliked articles
/// * `1` if the article was unliked successfully
/// * `0` if the article was not liked
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn unlike_article<'e, E>(
  con: E,
  article_id: i32,
  user_id: &str,
) -> Result<i64, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"DELETE FROM likes WHERE article_id = $1 AND user_id = $2"#,
    article_id,
    user_id
  )
  .execute(con)
  .await
  .map(|res| res.rows_affected() as i64)
}

/// Get users who liked the article
/// # Arguments
/// * `con` - The database connection
/// * `article_id` - The id of the article
/// # Returns
/// A list of users who liked the article
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn list_likers<'e, E>(
  con: E,
  article_id: i32,
) -> Result<Vec<String>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT user_id FROM likes WHERE article_id = $1"#,
    article_id
  )
  .fetch_all(con)
  .await
  .map(|res| res.into_iter().map(|row| row.user_id).collect())
}
