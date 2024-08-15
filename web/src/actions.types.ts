/** Types generated for queries found in "src/actions.ts" */
export type role = 'admin' | 'user';

/** 'GetUserByNaverId' parameters type */
export interface IGetUserByNaverIdParams {
  naverId?: string | null | void;
}

/** 'GetUserByNaverId' return type */
export interface IGetUserByNaverIdResult {
  id: string;
  name: string;
  role: role;
}

/** 'GetUserByNaverId' query type */
export interface IGetUserByNaverIdQuery {
  params: IGetUserByNaverIdParams;
  result: IGetUserByNaverIdResult;
}

/** 'CreateUser' parameters type */
export interface ICreateUserParams {
  id: string;
  name: string;
  naverId: string;
}

/** 'CreateUser' return type */
export type ICreateUserResult = void;

/** 'CreateUser' query type */
export interface ICreateUserQuery {
  params: ICreateUserParams;
  result: ICreateUserResult;
}

/** 'GetUserById' parameters type */
export interface IGetUserByIdParams {
  userId?: string | null | void;
}

/** 'GetUserById' return type */
export interface IGetUserByIdResult {
  id: string;
  name: string;
  role: role;
}

/** 'GetUserById' query type */
export interface IGetUserByIdQuery {
  params: IGetUserByIdParams;
  result: IGetUserByIdResult;
}

/** 'ListDrafts' parameters type */
export interface IListDraftsParams {
  authorId: string;
}

/** 'ListDrafts' return type */
export interface IListDraftsResult {
  article_id: number;
  createdAt: string;
  id: number;
  published: boolean | null;
  title: string;
  updatedAt: string;
}

/** 'ListDrafts' query type */
export interface IListDraftsQuery {
  params: IListDraftsParams;
  result: IListDraftsResult;
}

/** 'GetDraft' parameters type */
export interface IGetDraftParams {
  authorId: string;
  id: number;
}

/** 'GetDraft' return type */
export interface IGetDraftResult {
  articleId: number;
  content: string;
  createdAt: string;
  id: number;
  published: boolean | null;
  title: string;
  updatedAt: string;
}

/** 'GetDraft' query type */
export interface IGetDraftQuery {
  params: IGetDraftParams;
  result: IGetDraftResult;
}

/** 'ListDraftFiles' parameters type */
export interface IListDraftFilesParams {
  id: number;
}

/** 'ListDraftFiles' return type */
export interface IListDraftFilesResult {
  id: number;
  name: string;
}

/** 'ListDraftFiles' query type */
export interface IListDraftFilesQuery {
  params: IListDraftFilesParams;
  result: IListDraftFilesResult;
}

/** 'UpdateDraft' parameters type */
export interface IUpdateDraftParams {
  authorId: string;
  content: string;
  id: number;
  title: string;
}

/** 'UpdateDraft' return type */
export interface IUpdateDraftResult {
  ok: boolean;
}

/** 'UpdateDraft' query type */
export interface IUpdateDraftQuery {
  params: IUpdateDraftParams;
  result: IUpdateDraftResult;
}

