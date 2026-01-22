CREATE TABLE "get_help" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"screenshot" text,
	"created_at" timestamp DEFAULT now()
);
