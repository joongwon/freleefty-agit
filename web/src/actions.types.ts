/** Types generated for queries found in "src/actions.ts" */

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

