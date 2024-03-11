#[napi(object)]
pub struct ArticleSummary {
  pub id: i32,
  pub title: String,
  pub published_at: String,
  pub author: Author,
  pub comments_count: i64,
  pub likes_count: i64,
  pub views_count: i64,
}

#[napi(object)]
pub struct Author {
  pub id: String,
  pub name: String,
}

#[napi(object)]
pub struct Article {
  pub id: i32,
  pub title: String,
  pub content: String,
  pub published_at: String,
  pub author: Author,
  pub views_count: i64,
  pub likes_count: i64,
  pub comments: Vec<Comment>,
  pub next: Option<ArticleSummary>,
  pub prev: Option<ArticleSummary>,
}

#[napi(object)]
pub struct Comment {
  pub id: i32,
  pub content: String,
  pub created_at: String,
  pub author: Author,
}

#[napi(string_enum)]
#[derive(sqlx::Type)]
#[sqlx(rename_all = "lowercase")]
pub enum Role {
  Admin,
  User,
}

#[napi(object)]
pub struct User {
  pub id: String,
  pub name: String,
  pub role: Role,
}

#[napi(object)]
pub struct DraftSummary {
  pub id: i32,
  pub title: String,
  pub created_at: String,
  pub updated_at: String,
}

#[napi(object)]
pub struct Draft {
  pub id: i32,
  pub title: String,
  pub content: String,
  pub created_at: String,
  pub updated_at: String,
}

#[napi(string_enum)]
pub enum UserConflict {
  NaverId,
  Id,
  Name,
}
