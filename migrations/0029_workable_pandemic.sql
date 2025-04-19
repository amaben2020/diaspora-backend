CREATE INDEX "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "login_idx" ON "users" USING btree ("last_login" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "displayName_idx" ON "users" USING btree ("display_name");--> statement-breakpoint
CREATE INDEX "id_idx" ON "users" USING btree ("id");--> statement-breakpoint
CREATE INDEX "active_users_idx" ON "users" USING btree ("last_login" DESC NULLS LAST,"verified");--> statement-breakpoint
CREATE INDEX "subscription_idx" ON "users" USING btree ("subscription_type","verified");--> statement-breakpoint
CREATE INDEX "demographic_idx" ON "users" USING btree ("gender","birthday");