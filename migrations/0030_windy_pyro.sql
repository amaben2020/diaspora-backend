ALTER TABLE "profiles" ALTER COLUMN "bio" SET DEFAULT '...';--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "interests" SET DEFAULT '["..."]'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "fcm_token" text;