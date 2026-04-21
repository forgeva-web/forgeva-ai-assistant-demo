// @/components/editor/ProposedEditCard.tsx

/*
Renders a single proposed edit card with Accept and Reject buttons.
*/
'use client';

import { useState } from 'react';

import type { ProposedEdit } from '@/lib/graphql/generated/graphql-types';
import { titleCase } from '@/lib/utils';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useUser } from '@clerk/nextjs';
import {
  CircleIcon,
  MinusIcon,
  PlusIcon,
  MinusSquareIcon,
  PlusSquareIcon,
} from '@phosphor-icons/react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// this matches exactly what your applyEdit resolver returns:
type ApplyEditMutationResult = {
  applyEdit: {
    id: string;
    status: string;
    appliedAt: string | null;
  } | null;
};

const APPLY_EDIT = gql`
  mutation ApplyEdit($editId: ID!) {
    applyEdit(editId: $editId) {
      id
      status
      appliedAt
    }
  }
`;
const REJECT_EDIT = gql`
  mutation RejectEdit($editId: ID!) {
    rejectEdit(editId: $editId) {
      id
      status
    }
  }
`;

function statusBadgeClass(status: 'PENDING' | 'ACCEPTED' | 'REJECTED') {
  switch (status) {
    case 'ACCEPTED':
      return 'border-success/20 bg-success/10 text-success';
    case 'REJECTED':
      return 'border-destructive/20 bg-destructive/10 text-destructive';
    default:
      return 'border-warning/20 bg-warning/10 text-warning';
  }
}

// function statusDotClass(status: 'PENDING' | 'ACCEPTED' | 'REJECTED') {

// }

export function ProposedEditCard({
  edit,
  pageName,
}: {
  edit: ProposedEdit;
  pageName: string | null;
}) {
  const { isSignedIn, isLoaded } = useUser();
  const canAct = isLoaded && isSignedIn;

  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackKind, setFeedbackKind] = useState<'success' | 'error' | null>(
    null
  );
  const [localStatus, setLocalStatus] = useState<
    'PENDING' | 'ACCEPTED' | 'REJECTED'
  >(edit.status as 'PENDING' | 'ACCEPTED' | 'REJECTED');
  const [reindexStatus, setReindexStatus] = useState<
    'IDLE' | 'REINDEXING' | 'COMPLETE'
  >('IDLE');

  const [applyEdit, { loading: applying }] =
    useMutation<ApplyEditMutationResult>(APPLY_EDIT, {
      onCompleted: (data) => {
        setLocalStatus('ACCEPTED');
        setFeedbackKind('success');
        if (data.applyEdit?.status === 'ACCEPTED') {
          void fetch('/api/index-site', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              siteId: edit.indexedPage.siteId,
              startUrl: edit.indexedPage.url,
              generateEdits: false,
            }),
          });
          setReindexStatus('REINDEXING');
          setTimeout(() => {
            setReindexStatus('COMPLETE');
          }, 15000);
        }
        setFeedback('Edit accepted');
      },
      onError(err) {
        setFeedbackKind('error');
        setFeedback(err.message);
      },
    });
  const [rejectEdit, { loading: rejecting }] = useMutation(REJECT_EDIT, {
    update(cache) {
      cache.evict({ id: cache.identify(edit) });
      cache.gc();
    },
    onCompleted() {
      setLocalStatus('REJECTED');
      setFeedbackKind('success');
      setFeedback('Edit rejected');
    },
    onError(err) {
      setFeedbackKind('error');
      setFeedback(err.message);
    },
  });

  const isBusy = applying || rejecting;
  const isPending = localStatus === 'PENDING';
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            {/* Field name — human readable */}
            <p className="text-sm font-semibold text-foreground truncate tracking-wide">
              {titleCase(edit.fieldName.replace(/_/g, ' '))}
            </p>

            {/* Page name — page name from URL */}
            {pageName && (
              <p className="text-xs text-muted-foreground truncate">
                {pageName}
              </p>
            )}
          </div>
          {/* Status badge — updates optimistically on action */}
          <Badge
            variant="outline"
            className={`text-[11px] tracking-wide py-2 px-1.5 leading-1.5 ${statusBadgeClass(localStatus)}`}
          >
            <span className="inline-flex items-center gap-1 space-y-2">
              {localStatus === 'PENDING' && (
                <CircleIcon className="animate-pulse" weight="fill" size={12} />
              )}
              {localStatus.toLowerCase()}
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Current vs proposed side-by-side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 bg-destructive/18 px-1.5 py-2.5 rounded-md border border-destructive/20">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
                Current
              </p>
              <MinusIcon className="text-destructive" size={14} weight="bold" />
            </div>
            <p className="rounded-md text-xs pt-1.5 pl-2 text-foreground/60">
              {edit.originalValue || '(empty)'}
            </p>
          </div>
          <div className="space-y-1 bg-success/18 px-1.5 py-2.5 rounded-md border border-success/20">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
                Proposed
              </p>
              <PlusIcon className="text-success/60" size={14} weight="bold" />
            </div>
            <p className="rounded-md pt-1.5 pl-2 text-xs text-foreground/60">
              {edit.proposedValue}
            </p>
          </div>
        </div>

        {/* Feedback — success or error from mutation */}
        {feedback && (
          <Alert
            variant={feedbackKind === 'error' ? 'destructive' : 'default'}
            className={
              feedbackKind === 'success'
                ? 'border-success/20 bg-success/10 text-success py-2'
                : 'py-2'
            }
          >
            <AlertDescription className="text-xs">{feedback}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="gap-2 pt-3">
        {/* Accept button — primary action */}
        <Button
          size="sm"
          disabled={isBusy || !isPending || !canAct}
          aria-busy={applying}
          onClick={() => applyEdit({ variables: { editId: edit.id } })}
        >
          {applying ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground/50 border-t-primary-foreground" />
              Accepting...
            </span>
          ) : (
            'Accept'
          )}
        </Button>

        {/* Reject button — secondary/outline */}
        <Button
          variant="secondary"
          size="sm"
          disabled={isBusy || !isPending || !canAct}
          aria-busy={rejecting}
          onClick={() => rejectEdit({ variables: { editId: edit.id } })}
        >
          {rejecting ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground/50 border-t-primary-foreground" />
              Rejecting...
            </span>
          ) : (
            'Reject'
          )}
        </Button>

        {/* Reindex status — shows after accept firest the bg crawl */}
        {reindexStatus === 'REINDEXING' && (
          <Badge
            variant="outline"
            className="ml-auto border-warning/30 bg-warning/10 text-warning gap-1.5"
          >
            <span className="h-2 w-2 animate-spin rounded-full border border-warning border-t-transparent" />
            Updating Index...
          </Badge>
        )}
        {reindexStatus === 'COMPLETE' && (
          <Badge
            variant="outline"
            className="ml-auto border-success/20 bg-success/10 text-success"
          >
            Index Updated
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
