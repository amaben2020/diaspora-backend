CREATE TABLE "location" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "locations" CASCADE;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_location" ON "location" USING btree ("user_id");