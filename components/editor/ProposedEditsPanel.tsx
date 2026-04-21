// @/components/editor/ProposedEditsPanel.tsx

/*
Queries and renders the list of pending edits for a given site.
*/
'use client';

import { useMemo } from 'react';

import type {
  ProposedEdit,
  EditStatus,
} from '@/lib/graphql/generated/graphql-types';
import { getPageName } from '@/lib/utils';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { ProposedEditCard } from '@/components/editor/ProposedEditCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const GET_PROPOSED_EDITS = gql`
  query GetProposedEdits($siteId: ID!, $status: EditStatus) {
    proposedEdits(siteId: $siteId, status: $status) {
      id
      indexedPageId
      fieldName
      originalValue
      proposedValue
      status
      createdAt
      indexedPage {
        id
        url
        siteId
        title
      }
    }
  }
`;

type GetProposedEditsData = {
  proposedEdits: ProposedEdit[];
};

type GetProposedEditsVars = {
  siteId: string;
  status?: EditStatus;
};

export function ProposedEditsPanel({ siteId }: { siteId: string }) {
  const { error, data, loading } = useQuery<
    GetProposedEditsData,
    GetProposedEditsVars
  >(GET_PROPOSED_EDITS, {
    variables: { siteId, status: 'PENDING' as EditStatus },
    pollInterval: process.env.NODE_ENV === 'development' ? 0 : 5000,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
  });

  const edits = useMemo(() => data?.proposedEdits ?? [], [data?.proposedEdits]);

  // Initial load — show skeletons that match ProposedEditCard Height
  if (loading && !data) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (edits.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        Ask the AI assistant to suggest improvements.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {edits.map((edit: ProposedEdit) => (
        <ProposedEditCard
          key={edit.id}
          edit={edit}
          pageName={getPageName(edit.indexedPage.url)}
        />
      ))}
    </div>
  );
}
