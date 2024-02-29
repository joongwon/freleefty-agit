use crate::schema::{Article, ArticleSummary, Author};

/// List articles sorted by publication date
///
/// # Arguments
/// * `con` - The database connection
/// # Returns
/// A vector of `ArticleSummary` containing the most recent articles
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn list_articles<'e, E>(con: E) -> Result<Vec<ArticleSummary>, sqlx::Error>
where
    E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
    sqlx::query!(
        r#"SELECT articles.id, title, author_id, name,
        published_at AS "published_at!",
        (SELECT COUNT(*) FROM comments WHERE comments.article_id = articles.id) AS "comments_count!",
        (SELECT COUNT(*) FROM views WHERE views.article_id = articles.id) AS "views_count!",
        (SELECT COUNT(*) FROM likes WHERE likes.article_id = articles.id) AS "likes_count!"
        FROM articles JOIN users ON articles.author_id = users.id
        WHERE published_at IS NOT NULL
        ORDER BY published_at DESC"#,
    )
    .fetch_all(con)
    .await
    .map(|rows| {
        rows.into_iter()
            .map(|r| ArticleSummary {
                id: r.id,
                title: r.title,
                published_at: r.published_at.to_string(),
                author: Author {
                    id: r.author_id,
                    name: r.name,
                },
                comments_count: r.comments_count,
                views_count: r.views_count,
                likes_count: r.likes_count,
            })
            .collect()
    })
}

/// List articles sorted by views count
///
/// # Arguments
/// * `con` - The database connection
/// * `n` - The number of articles to return
/// * `days` - The number of days to consider for the views count
///           If `None`, all views are considered
///           If `Some(days)`, only views in the last `days` days are considered
/// # Returns
/// A vector of `ArticleSummary` containing the most popular articles
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn list_popular_articles<'e, E>(
    con: E,
    n: i64,
    days: Option<i32>,
) -> Result<Vec<ArticleSummary>, sqlx::Error>
where
    E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
    sqlx::query!(
        r#"SELECT * FROM (
            SELECT articles.id, title, author_id, name,
            published_at AS "published_at!",
            (SELECT COUNT(*) FROM comments WHERE comments.article_id = articles.id) AS "comments_count!",
            (SELECT COUNT(*) FROM views WHERE views.article_id = articles.id
                AND ($2::INTERVAL IS NULL OR now() - views.created_at < $2)) AS "views_count!",
            (SELECT COUNT(*) FROM likes WHERE likes.article_id = articles.id) AS "likes_count!"
            FROM articles JOIN users ON articles.author_id = users.id
            WHERE published_at IS NOT NULL
            ORDER BY "views_count!" DESC LIMIT $1
        ) AS t WHERE "views_count!" > 0"#,
        n,
        days.map(|d| sqlx::postgres::types::PgInterval { days: d, months: 0, microseconds: 0 }),
    )
    .fetch_all(con)
    .await
    .map(|rows| {
        rows.into_iter()
            .map(|r| ArticleSummary {
                id: r.id,
                title: r.title,
                published_at: r.published_at.to_string(),
                author: Author {
                    id: r.author_id,
                    name: r.name,
                },
                comments_count: r.comments_count,
                views_count: r.views_count,
                likes_count: r.likes_count,
            })
            .collect()
    })
}

/// Get an article by its ID
///
/// # Arguments
/// * `con` - The database connection
/// * `id` - The article ID
/// # Returns
/// An `Article` containing the article
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_article<'e, E>(con: E, id: i32) -> Result<Option<Article>, sqlx::Error>
where
    E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
    sqlx::query!(
        r#"SELECT articles.id, title, content, author_id, name, published_at AS "published_at!",
        (SELECT COUNT(*) FROM views WHERE views.article_id = articles.id) AS "views_count!",
        (SELECT COUNT(*) FROM likes WHERE likes.article_id = articles.id) AS "likes_count!"
        FROM articles
        JOIN users ON articles.author_id = users.id
        WHERE articles.id = $1"#,
        id,
    )
    .fetch_optional(con)
    .await
    .map(|r| {
        r.map(|r| Article {
            id: r.id,
            title: r.title,
            content: r.content,
            published_at: r.published_at.to_string(),
            author: Author {
                id: r.author_id,
                name: r.name,
            },
            views_count: r.views_count,
            likes_count: r.likes_count,
            /* these fields will be filled by following queries */
            comments: vec![],
            next: None,
            prev: None,
        })
    })
}

/// Get next article ordered by publication date
/// # Arguments
/// * `con` - The database connection
/// * `id` - The article ID
/// # Returns
/// An `Option<ArticleSummary>` containing the next article
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_next_article<'e, E>(con: E, id: i32) -> Result<Option<ArticleSummary>, sqlx::Error>
where
    E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
    sqlx::query!(
        r#"SELECT articles.id, title, author_id, name,
        published_at AS "published_at!",
        (SELECT COUNT(*) FROM comments WHERE comments.article_id = articles.id) AS "comments_count!",
        (SELECT COUNT(*) FROM views WHERE views.article_id = articles.id) AS "views_count!",
        (SELECT COUNT(*) FROM likes WHERE likes.article_id = articles.id) AS "likes_count!"
        FROM articles JOIN users ON articles.author_id = users.id
        WHERE published_at IS NOT NULL AND published_at > (SELECT published_at FROM articles WHERE id = $1)
        ORDER BY published_at ASC LIMIT 1"#,
        id,
    )
    .fetch_optional(con)
    .await
    .map(|r| {
        r.map(|r| ArticleSummary {
            id: r.id,
            title: r.title,
            published_at: r.published_at.to_string(),
            author: Author {
                id: r.author_id,
                name: r.name,
            },
            comments_count: r.comments_count,
            views_count: r.views_count,
            likes_count: r.likes_count,
        })
    })
}

/// Get previous article ordered by publication date
/// # Arguments
/// * `con` - The database connection
/// * `id` - The article ID
/// # Returns
/// An `Option<ArticleSummary>` containing the previous article
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_previous_article<'e, E>(
    con: E,
    id: i32,
) -> Result<Option<ArticleSummary>, sqlx::Error>
where
    E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
    sqlx::query!(
        r#"SELECT articles.id, title, author_id, name,
        published_at AS "published_at!",
        (SELECT COUNT(*) FROM comments WHERE comments.article_id = articles.id) AS "comments_count!",
        (SELECT COUNT(*) FROM views WHERE views.article_id = articles.id) AS "views_count!",
        (SELECT COUNT(*) FROM likes WHERE likes.article_id = articles.id) AS "likes_count!"
        FROM articles JOIN users ON articles.author_id = users.id
        WHERE published_at IS NOT NULL AND published_at < (SELECT published_at FROM articles WHERE id = $1)
        ORDER BY published_at DESC LIMIT 1"#,
        id,
    )
    .fetch_optional(con)
    .await
    .map(|r| {
        r.map(|r| ArticleSummary {
            id: r.id,
            title: r.title,
            published_at: r.published_at.to_string(),
            author: Author {
                id: r.author_id,
                name: r.name,
            },
            comments_count: r.comments_count,
            views_count: r.views_count,
            likes_count: r.likes_count,
        })
    })
}
