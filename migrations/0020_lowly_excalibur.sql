CREATE TABLE "roulette_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"session1_id" text,
	"session2_id" text,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp,
	"room_id" text
);
--> statement-breakpoint
CREATE TABLE "roulette_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"status" varchar(20),
	"interests" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "roulette_matches" ADD CONSTRAINT "roulette_matches_session1_id_roulette_sessions_id_fk" FOREIGN KEY ("session1_id") REFERENCES "public"."roulette_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roulette_matches" ADD CONSTRAINT "roulette_matches_session2_id_roulette_sessions_id_fk" FOREIGN KEY ("session2_id") REFERENCES "public"."roulette_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roulette_sessions" ADD CONSTRAINT "roulette_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
