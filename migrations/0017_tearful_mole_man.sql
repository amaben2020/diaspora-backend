ALTER TABLE "profile_views" DROP CONSTRAINT "profile_views_profile_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_views" DROP CONSTRAINT "profile_views_viewer_id_profile_id_pk";--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewer_id_viewed_id_pk" PRIMARY KEY("viewer_id","viewed_id");--> statement-breakpoint
ALTER TABLE "profile_views" ADD COLUMN "viewed_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_views" ADD COLUMN "is_new" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewed_id_users_id_fk" FOREIGN KEY ("viewed_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" DROP COLUMN "profile_id";