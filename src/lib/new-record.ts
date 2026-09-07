/**
 * The URL segment that means "this record does not exist yet".
 *
 * Three screens put the create form on the edit screen's own `[id]` route
 * rather than beside it — coupons (77), costs (71d) and templates (79a) — each
 * for the reason screen 77 writes out: a separate "new" screen drifts from the
 * edit screen inside a month. The consequence is that what those screens
 * compare `params.id` against is not an identifier at all. It is a URL.
 *
 * And a URL spelled as a bare string in three files is a URL that can be
 * renamed in two of them. That is what happened: `refactor(routes): jede URL
 * ist jetzt englisch` moved every `href` from `/neu` to `/new` and left all
 * three guards reading `id === 'neu'`, because a string literal inside a
 * comparison has no separator after it and the rename matched on segments. So
 * «Gutschein erstellen», «Kosten erfassen» and «Vorlage erstellen» all began
 * landing on «existiert nicht mehr» — the create flow of three screens, gone,
 * with nothing to show for it in `tsc`, in the lint or in the build, because
 * every one of those checks is happy with a string that no longer matches
 * anything.
 *
 * One export, so the next rename is one edit rather than a search. It lives in
 * `lib` rather than beside any one screen because the whole failure was three
 * screens each owning their own copy of the same fact.
 */
export const NEW_ID = 'new';
