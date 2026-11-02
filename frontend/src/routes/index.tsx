import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchLeague } from "@/lib/league/api";
import { computeStandings, matchOutcome, sortMatchesNewestFirst } from "@/lib/league/standings";
import type { League, Match } from "@/lib/league/types";

const leagueQuery = queryOptions({ queryKey: ["league", "default"], queryFn: () => fetchLeague() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atrevido Tablo — League Standings & Results" },
      { name: "description", content: "Live league table and latest match results at a glance." },
      { property: "og:title", content: "Atrevido Tablo — League Standings & Results" },
      { property: "og:description", content: "Live league table and latest match results at a glance." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(leagueQuery),
  component: Index,
});

function Index() {
  const { data: league } = useSuspenseQuery(leagueQuery);
  const standings = useMemo(() => computeStandings(league), [league]);
  const matches = useMemo(() => sortMatchesNewestFirst(league.matches), [league.matches]);
  const leader = standings[0];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="mb-8 border-b-4 border-primary pb-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {league.sport} · Win {league.scoring.win} · Draw {league.scoring.draw} · Loss {league.scoring.loss}
        </p>
        <h1 className="mt-1 text-3xl text-primary sm:text-5xl">{league.name}</h1>
        {leader && leader.played > 0 && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 font-semibold text-accent-foreground">
            Leader: <span className="break-words">{leader.team.name}</span> · {leader.points} pts
          </p>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="standings">
          <h2 id="standings" className="mb-3 text-xl">Standings</h2>
          {standings.length === 0 ? (
            <Empty title="No teams yet" text="Teams will appear here once they're added to the league." />
          ) : (
            <Standings rows={standings} />
          )}
        </section>

        <section aria-labelledby="results">
          <h2 id="results" className="mb-3 text-xl">Recent results</h2>
          {matches.length === 0 ? (
            <Empty title="No matches played" text="Results will show up here after the first match is completed." />
          ) : (
            <ul className="space-y-3">
              {matches.map((m) => <MatchCard key={m.id} match={m} league={league} />)}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Standings({ rows }: { rows: ReturnType<typeof computeStandings> }) {
  const num = "px-2 py-2.5 text-right tabular-nums";
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[36rem] text-sm">
        <thead className="bg-primary text-primary-foreground">
          <tr className="text-xs uppercase tracking-wider">
            <th className="px-3 py-2.5 text-left" scope="col"><abbr title="Position">#</abbr></th>
            <th className="px-2 py-2.5 text-left" scope="col">Team</th>
            {[["MP","Matches played"],["W","Wins"],["D","Draws"],["L","Losses"],["GF","Goals for"],["GA","Goals against"],["GD","Goal difference"],["PTS","Points"]].map(([k,t]) => (
              <th key={k} className={num} scope="col"><abbr title={t} className="no-underline">{k}</abbr></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team.id} className="border-t border-border even:bg-muted/50">
              <td className="px-3 py-2.5 font-display tabular-nums">{r.position}</td>
              <th scope="row" className="max-w-[14rem] px-2 py-2.5 text-left font-semibold break-words">{r.team.name}</th>
              <td className={num}>{r.played}</td>
              <td className={num}>{r.won}</td>
              <td className={num}>{r.drawn}</td>
              <td className={num}>{r.lost}</td>
              <td className={num}>{r.goalsFor}</td>
              <td className={num}>{r.goalsAgainst}</td>
              <td className={num}>{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</td>
              <td className={`${num} font-display text-base`}>{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchCard({ match, league }: { match: Match; league: League }) {
  const name = (id: string) => league.teams.find((t) => t.id === id)?.name ?? "Unknown team";
  const outcome = matchOutcome(match);
  const date = new Date(match.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const Side = ({ id, score, side }: { id: string; score: number; side: "home" | "away" }) => {
    const label = outcome === "draw" ? "D" : outcome === side ? "W" : "L";
    const cls = label === "W" ? "bg-win text-win-foreground" : label === "L" ? "bg-loss text-loss-foreground" : "bg-draw text-draw-foreground";
    const full = label === "W" ? "Win" : label === "L" ? "Loss" : "Draw";
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${cls}`} aria-label={full} title={full}>{label}</span>
        <span className="min-w-0 flex-1 break-words font-medium">{name(id)}</span>
        <span className="font-display text-lg tabular-nums">{score}</span>
      </div>
    );
  };
  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex justify-between text-xs text-muted-foreground">
        <time dateTime={match.date}>{date}</time>
        <span>{outcome === "draw" ? "Draw" : `${name(outcome === "home" ? match.homeTeamId : match.awayTeamId)} won`}</span>
      </div>
      <div className="space-y-1.5">
        <Side id={match.homeTeamId} score={match.homeScore} side="home" />
        <Side id={match.awayTeamId} score={match.awayScore} side="away" />
      </div>
    </li>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <p className="font-display">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
