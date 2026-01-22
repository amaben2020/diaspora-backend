ALTER TABLE "roulette_sessions" DROP CONSTRAINT "roulette_sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "session1_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "session1_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "session2_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "session2_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "started_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "room_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "roulette_sessions" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_matches" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_sessions" DROP COLUMN "interests";