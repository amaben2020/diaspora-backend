CREATE INDEX "blocker_idx" ON "blocks" USING btree ("blocker_id");--> statement-breakpoint
CREATE INDEX "blocked_idx" ON "blocks" USING btree ("blocked_id");--> statement-breakpoint
CREATE INDEX "block_relationship_idx" ON "blocks" USING btree ("blocker_id","blocked_id");--> statement-breakpoint
CREATE INDEX "reverse_block_relationship_idx" ON "blocks" USING btree ("blocked_id","blocker_id");