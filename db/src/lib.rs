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

use articles::{
  delete_article, get_article, get_article_author_id, get_next_article, get_previous_article,
  list_articles, list_popular_articles, create_article,
};
use comments::{create_comment, delete_comment, get_comment_author, list_comments};
use drafts::{
  create_draft, delete_draft, get_draft, get_draft_title_length,
  list_drafts, update_draft, get_article_id_from_draft, create_edition_from_draft,
};
use likes::{like_article, list_likers, unlike_article};
use log::{debug, error};
use users::{create_user, get_user_by_id, get_user_by_naver_id};
use views::create_view_log;

#[derive(thiserror::Error, Debug)]
pub enum Error {
  #[error("unexpected None value in column {0:?}")]
  UnexpectedNone(&'static str),
}

#[napi]
pub struct QueryEngine {
  pool: DbPool,
}

struct ErrHelper {
  scope: &'static str,
}

impl ErrHelper {
  fn imp<E>(&self) -> impl Fn(E) -> napi::Error
  where E: std::fmt::Display
  {
    let scope = self.scope.to_owned();
    move |e| {
      let msg = format!("{}: {}", scope, e);
      error!("{}", msg);
      napi::Error::new(napi::Status::GenericFailure, msg)
    }
  }
}

fn err(scope: &'static str) -> ErrHelper
{
  ErrHelper { scope }
}

#[napi]
impl QueryEngine {
  #[napi(factory)]
  pub fn new(database_url: String) -> Result<Self, napi::Error> {
    debug!("QueryEngine.new");
    let pool = init_dbpool(&database_url).map_err(err("QueryEngine.new").imp())?;
    Ok(Self { pool })
  }

  #[napi]
  pub async fn list_articles(&self) -> Result<Vec<schema::ArticleSummary>, napi::Error> {
    debug!("QueryEngine.list_articles");
    list_articles(&self.pool)
      .await
      .map_err(err("QueryEngine.list_articles").imp())
  }

  #[napi]
  pub async fn list_popular_articles(&self) -> Result<Vec<schema::ArticleSummary>, napi::Error> {
    debug!("QueryEngine.list_popular_articles");
    list_popular_articles(&self.pool, 5, 14)
      .await
      .map_err(err("QueryEngine.list_popular_articles").imp())
  }

  #[napi]
  pub async fn get_article(&self, id: i32) -> Result<Option<schema::Article>, napi::Error> {
    debug!("QueryEngine.get_article");
    let err = err("QueryEngine.get_article");
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    let mut article = get_article(&mut *tx, id).await.map_err(err.imp())?;
    if let Some(ref mut article) = article {
      debug!("QueryEngine.get_article: exists");
      article.comments = list_comments(&mut *tx, id).await.map_err(err.imp())?;
      article.next = get_next_article(&mut *tx, id).await.map_err(err.imp())?;
      article.prev = get_previous_article(&mut *tx, id).await.map_err(err.imp())?;
    } else {
      debug!("QueryEngine.get_article: not found");
    }
    tx.commit().await.map_err(err.imp())?;
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
      .map_err(err("QueryEngine.get_user_by_naver_id").imp())
  }

  #[napi]
  pub async fn get_user_by_id(&self, user_id: String) -> Result<Option<schema::User>, napi::Error> {
    debug!("QueryEngine.get_user_by_id");
    get_user_by_id(&self.pool, &user_id)
      .await
      .map_err(err("QueryEngine.get_user_by_id").imp())
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
      .map_err(err("QueryEngine.create_user").imp())
  }

  #[napi]
  pub async fn list_drafts(
    &self,
    user_id: String,
  ) -> Result<Vec<schema::DraftSummary>, napi::Error> {
    debug!("QueryEngine.list_drafts");
    list_drafts(&self.pool, &user_id)
      .await
      .map_err(err("QueryEngine.list_drafts").imp())
  }

  #[napi]
  pub async fn create_draft(&self, user_id: String) -> Result<schema::DraftSummary, napi::Error> {
    debug!("QueryEngine.create_draft");
    create_draft(&self.pool, &user_id, None)
      .await
      .map_err(err("QueryEngine.create_draft").imp())
  }

  #[napi]
  pub async fn create_draft_with_article(
    &self,
    user_id: String,
    article_id: i32,
  ) -> Result<napi::Either<schema::DraftSummary, MaybeNotFoundForbidden>, napi::Error> {
    debug!("QueryEngine.create_draft_with_article");
    let author_id = get_article_author_id(&self.pool, article_id)
      .await
      .map_err(err("QueryEngine.create_draft_with_article").imp())?;
    match author_id {
      Some(author_id) if author_id == user_id => {
        debug!("QueryEngine.create_draft_with_article: ok");
        create_draft(&self.pool, &user_id, Some(article_id))
          .await
          .map_err(err("QueryEngine.create_draft_with_article").imp())
          .map(napi::Either::A)
      }
      Some(_) => {
        debug!("QueryEngine.create_draft_with_article: forbidden");
        Ok(napi::Either::B(MaybeNotFoundForbidden::Forbidden))
      }
      None => {
        debug!("QueryEngine.create_draft_with_article: not found");
        Ok(napi::Either::B(MaybeNotFoundForbidden::NotFound))
      }
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
      .map_err(err("QueryEngine.get_draft").imp())
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
      .map_err(err("QueryEngine.update_draft").imp())?;
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
      .map_err(err("QueryEngine.delete_draft").imp())?;
    if res == 0 {
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
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    match get_article_author_id(&mut *tx, id).await.map_err(err.imp())? {
      Some(author_id) if author_id == user_id => {
        debug!("QueryEngine.delete_article: ok");
        delete_article(&mut *tx, id).await.map_err(err.imp())?;
        tx.commit().await.map_err(err.imp())?;
        Ok(MaybeNotFoundForbidden::Ok)
      }
      Some(_) => {
        debug!("QueryEngine.delete_article: forbidden");
        tx.commit().await.map_err(err.imp())?;
        Ok(MaybeNotFoundForbidden::Forbidden)
      }
      None => {
        debug!("QueryEngine.delete_article: not found");
        tx.commit().await.map_err(err.imp())?;
        Ok(MaybeNotFoundForbidden::NotFound)
      }
    }
  }

  #[napi]
  pub async fn publish_draft(
    &self,
    id: i32,
    author_id: String,
    notes: Option<String>,
  ) -> Result<napi::Either<i32, BadRequest>, napi::Error> {
    debug!("QueryEngine.publish_draft");
    let err = err("QueryEngine.publish_draft");

    let mut tx = self.pool.begin().await.map_err(err.imp())?;

    let draft_len = get_draft_title_length(&mut *tx, id, &author_id)
      .await
      .map_err(err.imp())?;
    if draft_len == 0 {
      debug!("QueryEngine.publish_draft: bad");
      tx.commit().await.map_err(err.imp())?;
      return Ok(napi::Either::B(BadRequest::Bad))
    }

    let article_id = get_article_id_from_draft(&mut *tx, id, &author_id)
      .await
      .map_err(err.imp())?;
    let article_id = match article_id {
      Some(article_id) => {
        debug!("QueryEngine.publish_draft: update");
        article_id
      },
      None => {
        debug!("QueryEngine.publish_draft: create");
        create_article(&mut *tx, &author_id).await.map_err(err.imp())?
      },
    };
    create_edition_from_draft(&mut *tx, id, &author_id, article_id, &notes.unwrap_or_default())
      .await
      .map_err(err.imp())?;
    delete_draft(&mut *tx, id, &author_id).await.map_err(err.imp())?;
    tx.commit().await.map_err(err.imp())?;
    Ok(napi::Either::A(article_id))
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
      .map_err(err("QueryEngine.create_comment").imp())
  }

  #[napi]
  pub async fn delete_comment(
    &self,
    id: i32,
    user_id: String,
  ) -> Result<MaybeNotFoundForbidden, napi::Error> {
    debug!("QueryEngine.delete_comment");
    let err = err("QueryEngine.delete_comment");
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    match get_comment_author(&mut *tx, id).await.map_err(err.imp())? {
      Some(author_id) if author_id == user_id => {
        debug!("QueryEngine.delete_comment: ok");
        delete_comment(&mut *tx, id).await.map_err(err.imp())?;
        tx.commit().await.map_err(err.imp())?;
        Ok(MaybeNotFoundForbidden::Ok)
      }
      Some(_) => {
        debug!("QueryEngine.delete_comment: forbidden");
        tx.commit().await.map_err(err.imp())?;
        Ok(MaybeNotFoundForbidden::Forbidden)
      }
      None => {
        debug!("QueryEngine.delete_comment: not found");
        tx.commit().await.map_err(err.imp())?;
        Ok(MaybeNotFoundForbidden::NotFound)
      }
    }
  }

  #[napi]
  pub async fn create_view_log(&self, article_id: i32) -> Result<(), napi::Error> {
    debug!("QueryEngine.create_view_log");
    create_view_log(&self.pool, article_id)
      .await
      .map_err(err("QueryEngine.create_view_log").imp())
  }

  #[napi]
  pub async fn like_article(&self, article_id: i32, user_id: String) -> Result<i64, napi::Error> {
    debug!("QueryEngine.like_article");
    like_article(&self.pool, article_id, &user_id)
      .await
      .map_err(err("QueryEngine.like_article").imp())
  }

  #[napi]
  pub async fn unlike_article(&self, article_id: i32, user_id: String) -> Result<i64, napi::Error> {
    debug!("QueryEngine.unlike_article");
    unlike_article(&self.pool, article_id, &user_id)
      .await
      .map_err(err("QueryEngine.unlike_article").imp())
  }

  #[napi]
  pub async fn list_likers(&self, article_id: i32) -> Result<Vec<schema::LikeLog>, napi::Error> {
    debug!("QueryEngine.list_likers");
    list_likers(&self.pool, article_id)
      .await
      .map_err(err("QueryEngine.list_likers").imp())
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
