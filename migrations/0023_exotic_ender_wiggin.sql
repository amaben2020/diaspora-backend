ALTER TABLE "roulette_matches" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ALTER COLUMN "id" DROP DEFAULT;