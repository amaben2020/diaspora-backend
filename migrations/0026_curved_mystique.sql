ALTER TABLE "roulette_matches" ADD COLUMN "scheduled_end_time" timestamp;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "roulette_sessions" ADD COLUMN "previous_partners" text[];