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

- Auth gate: protected pages live under `src/routes/_authenticated/` (client-only gate redirecting to /signin); v1 uses only built-in auth users, no app tables — why: brief defers profiles/subscriptions to later milestones.
- Watched routes live in `public.route_subscriptions` (RLS: every policy scopes to `auth.uid()`; `user_id` is a plain uuid; DB CHECKs enforce target price > 0, origin ≠ destination, and one watch per route per currency) — this supersedes the earlier "no app tables" note above; the same three rules are also checked in `src/lib/subscriptions.ts` before anything is sent, so the app and the database agree — why: a rejected write should read the same way in the UI as in the schema.
