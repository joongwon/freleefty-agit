/* tslint:disable */
/* eslint-disable */

/* auto-generated by NAPI-RS */

export interface ArticleSummary {
  id: number
  title: string
  publishedAt: string
  author: Author
  commentsCount: number
  likesCount: number
  viewsCount: number
}
export interface Author {
  id: string
  name: string
}
export interface Article {
  id: number
  editionId: number
  title: string
  content: string
  publishedAt: string
  lastPublishedAt: string
  author: Author
  viewsCount: number
  likesCount: number
  editionsCount: number
  comments: Array<Comment>
  next?: ArticleSummary
  prev?: ArticleSummary
}
export interface Comment {
  id: number
  content: string
  createdAt: string
  author: Author
}
export enum Role {
  Admin = 'Admin',
  User = 'User'
}
export interface User {
  id: string
  name: string
  role: Role
}
export interface DraftSummary {
  id: number
  articleId?: number
  title: string
  createdAt: string
  updatedAt: string
}
export interface Draft {
  id: number
  articleId?: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
}
export interface LikeLog {
  user: Author
  createdAt: string
}
export enum UserConflict {
  NaverId = 'NaverId',
  Id = 'Id',
  Name = 'Name'
}
export interface EditionSummary {
  id: number
  title: string
  notes: string
  publishedAt: string
}
export interface Edition {
  id: number
  articleId: number
  title: string
  content: string
  notes: string
  publishedAt: string
  editions: Array<EditionSummary>
}
export enum MaybeNotFound {
  Ok = 'Ok',
  NotFound = 'NotFound'
}
export enum MaybeNotFoundForbidden {
  Ok = 'Ok',
  Forbidden = 'Forbidden',
  NotFound = 'NotFound'
}
export enum BadRequest {
  Bad = 'Bad'
}
export enum NotFoundForbidden {
  NotFound = 'NotFound',
  Forbidden = 'Forbidden'
}
export class QueryEngine {
  static new(databaseUrl: string): QueryEngine
  listArticles(): Promise<Array<ArticleSummary>>
  listPopularArticles(): Promise<Array<ArticleSummary>>
  getArticle(id: number): Promise<Article | null>
  getUserByNaverId(naverId: string): Promise<User | null>
  getUserById(userId: string): Promise<User | null>
  createUser(naverId: string, userId: string, userName: string): Promise<UserConflict | null>
  listDrafts(userId: string): Promise<Array<DraftSummary>>
  createDraft(userId: string): Promise<DraftSummary>
  getArticleDraftId(userId: string, articleId: number): Promise<number | null>
  editArticle(userId: string, articleId: number): Promise<number | NotFoundForbidden>
  getDraft(id: number, authorId: string): Promise<Draft | null>
  updateDraft(id: number, authorId: string, title: string, body: string): Promise<MaybeNotFound>
  deleteDraft(id: number, authorId: string): Promise<MaybeNotFound>
  deleteArticle(id: number, userId: string): Promise<MaybeNotFoundForbidden>
  publishDraft(id: number, authorId: string, notes?: string | undefined | null): Promise<number | BadRequest>
  createComment(articleId: number, authorId: string, body: string): Promise<number>
  deleteComment(id: number, userId: string): Promise<MaybeNotFoundForbidden>
  createViewLog(articleId: number): Promise<void>
  likeArticle(articleId: number, userId: string): Promise<number>
  unlikeArticle(articleId: number, userId: string): Promise<number>
  listLikers(articleId: number): Promise<Array<LikeLog>>
  getEdition(editionId: number): Promise<Edition | null>
}
