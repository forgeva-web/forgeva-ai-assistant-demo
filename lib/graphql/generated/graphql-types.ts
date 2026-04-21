export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  JSON: { input: any; output: any };
};

export type AisoScoreResult = {
  __typename?: 'AisoScoreResult';
  actionItems: Scalars['JSON']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  pageId: Scalars['ID']['output'];
  scores: Scalars['JSON']['output'];
  totalScore: Scalars['Int']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type ChatSession = {
  __typename?: 'ChatSession';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  siteId: Scalars['String']['output'];
};

export enum EditStatus {
  Accepted = 'ACCEPTED',
  Pending = 'PENDING',
  Rejected = 'REJECTED',
}

export type IndexJob = {
  __typename?: 'IndexJob';
  id: Scalars['ID']['output'];
  siteId: Scalars['String']['output'];
  status: IndexStatus;
};

export enum IndexStatus {
  Complete = 'COMPLETE',
  Error = 'ERROR',
  Indexing = 'INDEXING',
  Pending = 'PENDING',
}

export type IndexedPage = {
  __typename?: 'IndexedPage';
  id: Scalars['ID']['output'];
  indexStatus: IndexStatus;
  lastIndexedAt?: Maybe<Scalars['String']['output']>;
  metaDescription?: Maybe<Scalars['String']['output']>;
  metaTitle?: Maybe<Scalars['String']['output']>;
  siteId: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
  wordCount?: Maybe<Scalars['Int']['output']>;
};

export enum IssueSeverity {
  Critical = 'CRITICAL',
  Opportunity = 'OPPORTUNITY',
  Warning = 'WARNING',
}

export type MessageResult = {
  __typename?: 'MessageResult';
  messageId: Scalars['ID']['output'];
  streamUrl?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  applyEdit?: Maybe<ProposedEdit>;
  createSite: Site;
  generateStructuredData?: Maybe<StructuredDataResult>;
  indexSite?: Maybe<IndexJob>;
  rejectEdit?: Maybe<ProposedEdit>;
  sendMessage?: Maybe<MessageResult>;
};

export type MutationApplyEditArgs = {
  editId: Scalars['ID']['input'];
};

export type MutationCreateSiteArgs = {
  name: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type MutationGenerateStructuredDataArgs = {
  pageId: Scalars['ID']['input'];
};

export type MutationIndexSiteArgs = {
  siteId: Scalars['ID']['input'];
};

export type MutationRejectEditArgs = {
  editId: Scalars['ID']['input'];
};

export type MutationSendMessageArgs = {
  content: Scalars['String']['input'];
  sessionId: Scalars['ID']['input'];
};

export type ProposedEdit = {
  __typename?: 'ProposedEdit';
  appliedAt?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  fieldName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  indexedPage: IndexedPage;
  indexedPageId: Scalars['String']['output'];
  originalValue: Scalars['String']['output'];
  proposedValue: Scalars['String']['output'];
  status: EditStatus;
};

export type Query = {
  __typename?: 'Query';
  aisoScore?: Maybe<AisoScoreResult>;
  chatSession?: Maybe<ChatSession>;
  proposedEdits: Array<ProposedEdit>;
  seoAudit?: Maybe<SeoAuditResult>;
  site?: Maybe<Site>;
  siteBySlug?: Maybe<Site>;
  sites: Array<Site>;
};

export type QueryAisoScoreArgs = {
  pageId: Scalars['ID']['input'];
};

export type QueryChatSessionArgs = {
  siteId: Scalars['ID']['input'];
};

export type QueryProposedEditsArgs = {
  siteId: Scalars['ID']['input'];
  status?: InputMaybe<EditStatus>;
};

export type QuerySeoAuditArgs = {
  siteId: Scalars['ID']['input'];
};

export type QuerySiteArgs = {
  id: Scalars['ID']['input'];
};

export type QuerySiteBySlugArgs = {
  slug: Scalars['String']['input'];
};

export type SeoAuditResult = {
  __typename?: 'SEOAuditResult';
  aisoScore?: Maybe<Scalars['Int']['output']>;
  issues: Array<SeoIssue>;
  score?: Maybe<Scalars['Int']['output']>;
  suggestions: Array<Scalars['String']['output']>;
};

export type SeoIssue = {
  __typename?: 'SEOIssue';
  description?: Maybe<Scalars['String']['output']>;
  field?: Maybe<Scalars['String']['output']>;
  severity: IssueSeverity;
  suggestedFix?: Maybe<Scalars['String']['output']>;
};

export type Site = {
  __typename?: 'Site';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  indexedPages: Array<IndexedPage>;
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type StructuredDataResult = {
  __typename?: 'StructuredDataResult';
  jsonLd: Scalars['String']['output'];
  pageId: Scalars['ID']['output'];
  schemaType: Scalars['String']['output'];
};

export type GetDemoHomeSitesQueryVariables = Exact<{ [key: string]: never }>;

export type GetDemoHomeSitesQuery = {
  __typename?: 'Query';
  sites: Array<{
    __typename?: 'Site';
    id: string;
    name: string;
    url: string;
    slug: string;
    indexedPages: Array<{
      __typename?: 'IndexedPage';
      id: string;
      url: string;
      indexStatus: IndexStatus;
      wordCount?: number | null;
      metaTitle?: string | null;
      metaDescription?: string | null;
    }>;
  }>;
};

export type GetSiteBySlugQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;

export type GetSiteBySlugQuery = {
  __typename?: 'Query';
  siteBySlug?: {
    __typename?: 'Site';
    id: string;
    name: string;
    url: string;
    slug: string;
    createdAt: string;
    indexedPages: Array<{
      __typename?: 'IndexedPage';
      id: string;
      url: string;
      title?: string | null;
      metaTitle?: string | null;
      metaDescription?: string | null;
      indexStatus: IndexStatus;
      lastIndexedAt?: string | null;
      wordCount?: number | null;
    }>;
  } | null;
};

export type GetSitesQueryVariables = Exact<{ [key: string]: never }>;

export type GetSitesQuery = {
  __typename?: 'Query';
  sites: Array<{
    __typename?: 'Site';
    id: string;
    name: string;
    url: string;
    slug: string;
  }>;
};

export type CreateSiteMutationVariables = Exact<{
  name: Scalars['String']['input'];
  url: Scalars['String']['input'];
}>;

export type CreateSiteMutation = {
  __typename?: 'Mutation';
  createSite: {
    __typename?: 'Site';
    id: string;
    name: string;
    url: string;
    slug: string;
  };
};
