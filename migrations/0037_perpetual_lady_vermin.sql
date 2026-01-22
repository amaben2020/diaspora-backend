ALTER TABLE "preferences" ADD COLUMN "job_title" varchar(100) DEFAULT '';--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "company" varchar(100) DEFAULT '';--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "school" varchar(100) DEFAULT '';--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "sexuality" varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "body_type" varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "dietary_preference" varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "sleeping_habits" varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "workout_frequency" varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "love_language" varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "travel_plans" varchar(100) DEFAULT '';--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "personality" varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "relationship_status" varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "willing_to_relocate" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "openness_to_long_distance" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "premium_features" ADD COLUMN "superlikes_remaining" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "premium_features" ADD COLUMN "boosts_remaining" integer DEFAULT 0;