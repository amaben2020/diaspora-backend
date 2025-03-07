CREATE TABLE "dislikes" (
	"disliker_id" text NOT NULL,
	"disliked_id" text NOT NULL,
	"disliked_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "dislikes_disliker_id_disliked_id_pk" PRIMARY KEY("disliker_id","disliked_id")
);
--> statement-breakpoint
ALTER TABLE "dislikes" ADD CONSTRAINT "dislikes_disliker_id_users_id_fk" FOREIGN KEY ("disliker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dislikes" ADD CONSTRAINT "dislikes_disliked_id_users_id_fk" FOREIGN KEY ("disliked_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;