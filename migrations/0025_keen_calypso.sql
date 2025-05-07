ALTER TABLE "roulette_matches" ALTER COLUMN "session1_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "session1_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "session2_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "session2_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "room_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_matches" ALTER COLUMN "started_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ALTER COLUMN "status" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "roulette_sessions" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ADD COLUMN "interests" text[];--> statement-breakpoint
ALTER TABLE "roulette_sessions" ADD CONSTRAINT "roulette_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roulette_matches" DROP COLUMN "duration";--> statement-breakpoint
ALTER TABLE "roulette_sessions" DROP COLUMN "updated_at";