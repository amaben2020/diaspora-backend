ALTER TABLE "matches" DROP CONSTRAINT "matches_user1_id_user2_id_pk";--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "user1_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "unique_match" UNIQUE("user1_id","user2_id");