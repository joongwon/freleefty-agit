#[macro_use]
extern crate napi_derive;

type DbPool = sqlx::PgPool;

fn init_dbpool(database_url: &str) -> Result<DbPool, sqlx::Error> {
  // logger initialization may fail when called multiple times, but it's okay
  _ = env_logger::try_init();
  sqlx::postgres::PgPoolOptions::new()
    .acquire_timeout(std::time::Duration::from_secs(1))
    .connect_lazy(database_url)
}

mod articles;
mod comments;
mod drafts;
mod likes;
mod schema;
mod users;
mod views;

use log::{error, debug};
use articles::{
  delete_article, get_article, get_article_author_id, get_next_article, get_previous_article,
  list_articles, list_popular_articles,
};
use comments::{create_comment, delete_comment, get_comment_author, list_comments};
use drafts::{
  copy_draft_to_article, create_draft, delete_draft, get_draft, get_draft_title_length,
  list_drafts, update_draft,
};
use users::{create_user, get_user_by_id, get_user_by_naver_id};
use views::create_view_log;
use likes::{like_article, unlike_article, list_likers};

#[napi]
pub struct QueryEngine {
  pool: DbPool,
}

fn err(scope: &str) -> impl Fn(sqlx::Error) -> napi::Error {
  let scope = scope.to_owned();
  move |e| {
    let msg = format!("{}: {}", scope, e);
    error!("{}", msg);
    napi::Error::new(napi::Status::GenericFailure, msg)
  }
}

#[napi]
impl QueryEngine {
  #[napi(factory)]
  pub fn new(database_url: String) -> Result<Self, napi::Error> {
    debug!("QueryEngine.new");
    let pool = init_dbpool(&database_url).map_err(err("QueryEngine.new"))?;
    Ok(Self { pool })
  }

  #[napi]
  pub async fn list_articles(&self) -> Result<Vec<schema::ArticleSummary>, napi::Error> {
    debug!("QueryEngine.list_articles");
    list_articles(&self.pool).await.map_err(err("QueryEngine.list_articles"))
  }

  #[napi]
  pub async fn list_popular_articles(&self) -> Result<Vec<schema::ArticleSummary>, napi::Error> {
    debug!("QueryEngine.list_popular_articles");
    list_popular_articles(&self.pool, 5, 14)
      .await
      .map_err(err("QueryEngine.list_popular_articles"))
  }

  #[napi]
  pub async fn get_article(&self, id: i32) -> Result<Option<schema::Article>, napi::Error> {
    debug!("QueryEngine.get_article");
    let err = err("QueryEngine.get_article");
    let mut tx = self.pool.begin().await.map_err(&err)?;
    let mut article = get_article(&mut *tx, id).await.map_err(&err)?;
    if let Some(ref mut article) = article {
      debug!("QueryEngine.get_article: exists");
      article.comments = list_comments(&mut *tx, id).await.map_err(&err)?;
      article.next = get_next_article(&mut *tx, id)
        .await
        .map_err(&err)?;
      article.prev = get_previous_article(&mut *tx, id)
        .await
        .map_err(&err)?;
    } else {
      debug!("QueryEngine.get_article: not found");
    }
    tx.commit().await.map_err(err)?;
    Ok(article)
  }

  #[napi]
  pub async fn get_user_by_naver_id(
    &self,
    naver_id: String,
  ) -> Result<Option<schema::User>, napi::Error> {
    debug!("QueryEngine.get_user_by_naver_id");
    get_user_by_naver_id(&self.pool, &naver_id)
      .await
      .map_err(err("QueryEngine.get_user_by_naver_id"))
  }

  #[napi]
  pub async fn get_user_by_id(&self, user_id: String) -> Result<Option<schema::User>, napi::Error> {
    debug!("QueryEngine.get_user_by_id");
    get_user_by_id(&self.pool, &user_id)
      .await
      .map_err(err("QueryEngine.get_user_by_id"))
  }

  #[napi]
  pub async fn create_user(
    &self,
    naver_id: String,
    user_id: String,
    user_name: String,
  ) -> Result<Option<schema::UserConflict>, napi::Error> {
    debug!("QueryEngine.create_user");
    create_user(&self.pool, &naver_id, &user_id, &user_name)
      .await
      .map_err(err("QueryEngine.create_user"))
  }

  #[napi]
  pub async fn list_or_create_draft(
    &self,
    user_id: String,
  ) -> Result<napi::Either<schema::DraftSummary, Vec<schema::DraftSummary>>, napi::Error> {
    debug!("QueryEngine.list_or_create_draft");
    let err = err("QueryEngine.list_or_create_draft");
    let mut tx = self.pool.begin().await.map_err(&err)?;
    let drafts = list_drafts(&mut *tx, &user_id)
      .await
      .map_err(&err)?;
    if drafts.is_empty() {
      debug!("QueryEngine.list_or_create_draft: create");
      let draft = create_draft(&mut *tx, &user_id)
        .await
        .map_err(&err)?;
      tx.commit().await.map_err(&err)?;
      Ok(napi::Either::A(draft))
    } else {
      debug!("QueryEngine.list_or_create_draft: list");
      tx.commit().await.map_err(&err)?;
      Ok(napi::Either::B(drafts))
    }
  }

  #[napi]
  pub async fn get_draft(
    &self,
    id: i32,
    author_id: String,
  ) -> Result<Option<schema::Draft>, napi::Error> {
    debug!("QueryEngine.get_draft");
    get_draft(&self.pool, id, &author_id)
      .await
      .map_err(err("QueryEngine.get_draft"))
  }

  #[napi]
  pub async fn update_draft(
    &self,
    id: i32,
    author_id: String,
    title: String,
    body: String,
  ) -> Result<MaybeNotFound, napi::Error> {
    debug!("QueryEngine.update_draft");
    let res = update_draft(&self.pool, id, &author_id, &title, &body)
      .await
      .map_err(err("QueryEngine.update_draft"))?;
    if res == 0 {
      debug!("QueryEngine.update_draft: not found");
      Ok(MaybeNotFound::NotFound)
    } else {
      debug!("QueryEngine.update_draft: ok");
      Ok(MaybeNotFound::Ok)
    }
  }

  #[napi]
  pub async fn delete_draft(
    &self,
    id: i32,
    author_id: String,
  ) -> Result<MaybeNotFound, napi::Error> {
    debug!("QueryEngine.delete_draft");
    let res = delete_draft(&self.pool, id, &author_id)
      .await
      .map_err(err("QueryEngine.delete_draft"))?;
    if res == 0
    {
      debug!("QueryEngine.delete_draft: not found");
      Ok(MaybeNotFound::NotFound)
    } else {
      debug!("QueryEngine.delete_draft: ok");
      Ok(MaybeNotFound::Ok)
    }
  }

  #[napi]
  pub async fn delete_article(
    &self,
    id: i32,
    user_id: String,
  ) -> Result<MaybeNotFoundForbidden, napi::Error> {
    debug!("QueryEngine.delete_article");
    let err = err("QueryEngine.delete_article");
    let mut tx = self.pool.begin().await.map_err(&err)?;
    match get_article_author_id(&mut *tx, id)
      .await
      .map_err(&err)?
    {
      Some(author_id) if author_id == user_id => {
        debug!("QueryEngine.delete_article: ok");
        delete_article(&mut *tx, id).await.map_err(&err)?;
        tx.commit().await.map_err(&err)?;
        Ok(MaybeNotFoundForbidden::Ok)
      }
      Some(_) => {
        debug!("QueryEngine.delete_article: forbidden");
        tx.commit().await.map_err(&err)?;
        Ok(MaybeNotFoundForbidden::Forbidden)
      }
      None => {
        debug!("QueryEngine.delete_article: not found");
        tx.commit().await.map_err(&err)?;
        Ok(MaybeNotFoundForbidden::NotFound)
      }
    }
  }

  #[napi]
  pub async fn publish_draft(
    &self,
    id: i32,
    author_id: String,
  ) -> Result<napi::Either<i32, BadRequest>, napi::Error> {
    debug!("QueryEngine.publish_draft");
    let err = err("QueryEngine.publish_draft");
    let mut tx = self.pool.begin().await.map_err(&err)?;
    let draft_len = get_draft_title_length(&mut *tx, id, &author_id)
      .await
      .map_err(&err)?;
    if draft_len > 0 {
      debug!("QueryEngine.publish_draft: ok");
      let article_id = copy_draft_to_article(&mut *tx, id, &author_id)
        .await
        .map_err(&err)?;
      delete_draft(&mut *tx, id, &author_id)
        .await
        .map_err(&err)?;
      tx.commit().await.map_err(&err)?;
      Ok(napi::Either::A(article_id))
    } else {
      debug!("QueryEngine.publish_draft: bad");
      tx.commit().await.map_err(&err)?;
      Ok(napi::Either::B(BadRequest::Bad))
    }
  }

  #[napi]
  pub async fn create_comment(
    &self,
    article_id: i32,
    author_id: String,
    body: String,
  ) -> Result<i32, napi::Error> {
    debug!("QueryEngine.create_comment");
    create_comment(&self.pool, article_id, &author_id, &body)
      .await
      .map_err(err("QueryEngine.create_comment"))
  }

  #[napi]
  pub async fn delete_comment(
    &self,
    id: i32,
    user_id: String,
  ) -> Result<MaybeNotFoundForbidden, napi::Error> {
    debug!("QueryEngine.delete_comment");
    let err = err("QueryEngine.delete_comment");
    let mut tx = self.pool.begin().await.map_err(&err)?;
    match get_comment_author(&mut *tx, id)
      .await
      .map_err(&err)?
    {
      Some(author_id) if author_id == user_id => {
        debug!("QueryEngine.delete_comment: ok");
        delete_comment(&mut *tx, id).await.map_err(&err)?;
        tx.commit().await.map_err(&err)?;
        Ok(MaybeNotFoundForbidden::Ok)
      }
      Some(_) => {
        debug!("QueryEngine.delete_comment: forbidden");
        tx.commit().await.map_err(&err)?;
        Ok(MaybeNotFoundForbidden::Forbidden)
      }
      None => {
        debug!("QueryEngine.delete_comment: not found");
        tx.commit().await.map_err(&err)?;
        Ok(MaybeNotFoundForbidden::NotFound)
      }
    }
  }

  #[napi]
  pub async fn create_view_log(&self, article_id: i32) -> Result<(), napi::Error> {
    debug!("QueryEngine.create_view_log");
    create_view_log(&self.pool, article_id)
      .await
      .map_err(err("QueryEngine.create_view_log"))
  }

  #[napi]
  pub async fn like_article(
    &self,
    article_id: i32,
    user_id: String,
  ) -> Result<i64, napi::Error> {
    debug!("QueryEngine.like_article");
    like_article(&self.pool, article_id, &user_id)
      .await
      .map_err(err("QueryEngine.like_article"))
  }

  #[napi]
  pub async fn unlike_article(
    &self,
    article_id: i32,
    user_id: String,
  ) -> Result<i64, napi::Error> {
    debug!("QueryEngine.unlike_article");
    unlike_article(&self.pool, article_id, &user_id)
      .await
      .map_err(err("QueryEngine.unlike_article"))
  }

  #[napi]
  pub async fn list_likers(&self, article_id: i32) -> Result<Vec<String>, napi::Error> {
    debug!("QueryEngine.list_likers");
    list_likers(&self.pool, article_id).await.map_err(err("QueryEngine.list_likers"))
  }
}

#[napi(string_enum)]
pub enum MaybeNotFound {
  Ok,
  NotFound,
}

#[napi(string_enum)]
pub enum MaybeNotFoundForbidden {
  Ok,
  Forbidden,
  NotFound,
}

#[napi(string_enum)]
pub enum BadRequest {
  Bad,
}
