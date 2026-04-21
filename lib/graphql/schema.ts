export const typeDefs = `#graphql
  # scalars
  scalar JSON

  # ── Enums ──────────────────────────────────────────
  enum IssueSeverity {
    CRITICAL
    WARNING
    OPPORTUNITY
  }

  enum EditStatus {
    PENDING
    ACCEPTED
    REJECTED
  }

  enum IndexStatus {
    PENDING
    INDEXING
    COMPLETE
    ERROR
  }

  # ── Core Types ──────────────────────────────────────
  type Site {
    id: ID!
    name: String!
    url: String!
    slug: String!
    createdAt: String!
    indexedPages: [IndexedPage!]!
  }

  type IndexedPage {
    id: ID!
    siteId: String!
    url: String!
    title: String
    metaTitle: String
    metaDescription: String
    indexStatus: IndexStatus!
    lastIndexedAt: String
    wordCount: Int
  }

  type SEOIssue {
    severity: IssueSeverity!
    field: String
    description: String
    suggestedFix: String
  }

  type SEOAuditResult {
    score: Int
    issues: [SEOIssue!]!
    aisoScore: Int
    suggestions: [String!]!
  }

  type AisoScoreResult {
    id: ID!
    pageId: ID!
    totalScore: Int!
    scores: JSON!
    actionItems: JSON!
    createdAt: String!
    updatedAt: String
  }

  type ChatSession {
    id: ID!
    siteId: String!
    createdAt: String!
  }

  type ProposedEdit {
    id: ID!
    indexedPageId: String!
    indexedPage: IndexedPage!
    fieldName: String!
    originalValue: String!
    proposedValue: String!
    status: EditStatus!
    appliedAt: String
    createdAt: String!
  }

  type IndexJob {
    id: ID!
    siteId: String!
    status: IndexStatus!
  }

  type MessageResult {
    messageId: ID!
    streamUrl: String
  }

  type StructuredDataResult {
    jsonLd: String! # JSON.stringify of the generated structured data
    schemaType: String! # 'LocalBusiness' | 'FAQPage' | 'HowTo'
    pageId: ID!
  }


  # ── Queries ─────────────────────────────────────────
  type Query {
    sites: [Site!]!
    site(id: ID!): Site
    siteBySlug(slug: String!): Site
    seoAudit(siteId: ID!): SEOAuditResult
    aisoScore(pageId: ID!): AisoScoreResult
    chatSession(siteId: ID!): ChatSession
    proposedEdits(siteId: ID!, status: EditStatus): [ProposedEdit!]!
  }

  # ── Mutations ────────────────────────────────────────
  type Mutation {
    createSite(name: String!, url: String!): Site!
    indexSite(siteId: ID!): IndexJob
    sendMessage(sessionId: ID!, content: String!): MessageResult
    applyEdit(editId: ID!): ProposedEdit
    rejectEdit(editId: ID!): ProposedEdit
    generateStructuredData(pageId: ID!): StructuredDataResult
  }
`;
