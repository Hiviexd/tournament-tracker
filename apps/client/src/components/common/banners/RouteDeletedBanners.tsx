import { useParams } from "react-router-dom";
import { useRestoreArticle, useArticle } from "../../../hooks/useArticle";
import { useRestoreTournament, useTournament } from "../../../hooks/useTournaments";
import { useRestoreVoting, useVoting } from "../../../hooks/useVotings";
import DeletedItemBanner from "./DeletedItemBanner";

// Route banners render outside the page, so each one reads its item from the page's own (deduped) query.

export function TournamentDeletedBanner() {
    const { tournamentId } = useParams();
    const { data } = useTournament(tournamentId!);
    const restoreMutation = useRestoreTournament(tournamentId!);
    const tournament = data?.tournament;

    if (!tournament?.deletedAt) return null;

    return (
        <DeletedItemBanner
            itemLabel={tournament.type}
            deletedAt={tournament.deletedAt}
            onRestore={() => restoreMutation.mutate()}
            isRestoring={restoreMutation.isPending}
        />
    );
}

export function VotingDeletedBanner() {
    const { votingId } = useParams();
    const { data: voting } = useVoting(votingId!);
    const restoreMutation = useRestoreVoting(votingId!);

    if (!voting?.deletedAt) return null;

    return (
        <DeletedItemBanner
            itemLabel="vote"
            deletedAt={voting.deletedAt}
            onRestore={() => restoreMutation.mutate()}
            isRestoring={restoreMutation.isPending}
        />
    );
}

export function ArticleDeletedBanner() {
    const { slug } = useParams();
    const { data: article } = useArticle(slug!);
    const restoreMutation = useRestoreArticle(slug!);

    if (!article?.deletedAt) return null;

    return (
        <DeletedItemBanner
            itemLabel="article"
            deletedAt={article.deletedAt}
            onRestore={() => restoreMutation.mutate()}
            isRestoring={restoreMutation.isPending}
        />
    );
}
