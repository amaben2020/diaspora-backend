ALTER TABLE "preferences" ALTER COLUMN "smoking" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "preferences" ALTER COLUMN "drinking" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "pets" varchar(50);--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "age" varchar(50);--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "distance" varchar(50);--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "language" varchar(50);--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "familyPlans" varchar(50);--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "height" varchar(50);--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "hasBio" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "min_photos" varchar;