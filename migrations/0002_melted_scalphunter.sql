CREATE TYPE interests_preference AS ENUM ('Travelling', 'Photography', 'Art', 'Painting', 'Yoga', 'Dancing', 'Movie', 'Tennis', 'Soccer', 'Basketball', 'Ambition', 'Writing', 'Grab a drink', 'Astrology', 'Confidence');


ALTER TABLE "preferences" ALTER COLUMN "interests" SET DATA TYPE interests;--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "looking_to_date" "dating_preference";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(11);