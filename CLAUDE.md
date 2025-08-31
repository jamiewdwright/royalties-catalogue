1. First, read the problem, read the codebase for relevant files and write a plan to todo.md.
2. The plan should have a list of todo items that you can check off as you complete them.
3. Encourage simplicity — every feature or change should be as small as reasonably possible.
4. Incremental delivery — large-scale edits must be broken down into smaller, testable changes.
5. Comment generously — all sections of code should explain what they do and how they work, to help the user learn.
6. Readable over clever — prioritise clear, maintainable code over “smart” one-liners.
7. Documentation-first — README, schema diagrams, and .env.example files are required.
8. Graceful failure — when errors occur, they should fail visibly and informatively (not silently).
9. Reusable components — write modular functions/components that can be shared across the app.

The Database:
Overview

This project manages music royalties. Money flows in from distributors/promoters and flows out to royalty holders via payout runs.

Core ideas:
	•	Royalty holders: people/entities who can receive royalties.
	•	Releases: albums/singles/projects revenue can be associated with.
	•	Incoming payments: receipts logged when money arrives.
	•	Allocations: how each receipt is split across holders.
	•	Payouts: money we actually pay out, grouped into payout batches.
	•	Links: which allocation(s) funded which payout (audit trail).

releases
   ^
   |
payments (incoming) ──< payment_allocations >── royalty_holders
                                  |
                                  v
                       payout_allocation_links  >── payouts ──< payout_batches

Schemas & exposure
	•	All objects live in the app schema (not public).
	•	RLS is enabled and defaults to deny on all tables.
	•	API access to app.* via PostgREST is allowed only if Project Settings → API → db_schema includes app. (If not, use direct SQL.)

Tables (essential fields)

app.royalty_holders
	•	id (uuid pk), r_number (text unique, e.g. R001), name (text), type (performer|composer|arranger|partner|guest|other), status (active|inactive), dates, notes, timestamps.
	•	Purpose: the authoritative list of payees.

app.releases
	•	id, catalog_number (text unique, auto: SWG001…), title, release_date, notes, timestamps.

app.payments (incoming)
	•	id, release_id → releases.id (nullable), paid_date, source (e.g. Spotify),
revenue_type (concert|streaming|album_sale|sync|other),
gross_amount, fee_amount, net_amount (generated), currency, notes, timestamps.

app.payment_allocations
	•	Split of each incoming payment to each holder.
	•	id, payment_id → payments.id, holder_id → royalty_holders.id,
percentage (0–1), amount (snapshot in payment currency), created_at.
	•	unique (payment_id, holder_id).

app.payout_batches
	•	A pay run (e.g. “Q3 2025 digital”).
	•	id, batch_date, description, currency, status (draft|processing|paid|void), timestamps.

app.payouts (outgoing)
	•	One payout record per holder per batch.
	•	id, batch_id → payout_batches.id, holder_id → royalty_holders.id,
amount, currency, method, external_ref, paid_at,
status (pending|sent|failed|reversed), timestamps.
	•	unique (batch_id, holder_id).

app.payout_allocation_links
	•	Audit: which allocation(s) funded a payout.
	•	id, payout_id → payouts.id, allocation_id → payment_allocations.id, amount_applied, created_at.
	•	unique (payout_id, allocation_id).

Views
	•	app.v_payment_allocation_detail: joined view of allocations + payments + releases + holders.
	•	app.v_allocation_outstanding: for each allocation, how much remains unpaid.
	•	app.v_holder_outstanding: sum of outstanding per holder.

Helper sequences/functions
	•	app.r_number_seq + app.next_r_number() → human IDs R001, R002, …
	•	app.catalog_seq + app.next_catalog('SWG') → release catalog numbers.

Lifecycle / Workflows

1) Log an incoming payment
	•	Insert into app.payments (optionally tie to a release_id).
	•	Create one or more app.payment_allocations rows for the split across holders.
	•	percentage is informational/audit; amount is the actual £ snapshot.
	•	Outstanding = allocation.amount − sum(applied in payout_allocation_links).

2) Run a payout
	•	Create a row in app.payout_batches.
	•	For each holder, create one app.payouts row with the amount you’ll pay.
	•	Link the payout to specific allocations via app.payout_allocation_links (amount_applied).
	•	When money is sent, set payouts.status='sent', paid_at=now(), and move the batch to paid when complete.

