<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- League data comes from `src/lib/league/api.ts` (currently mocked); the `League` type in `src/lib/league/types.ts` is the backend contract. Why: lets the real backend be swapped in without UI changes.
- Standings are computed client-side in `src/lib/league/standings.ts` from matches and config-defined tie-breakers. Why: single tested source of ranking rules.
