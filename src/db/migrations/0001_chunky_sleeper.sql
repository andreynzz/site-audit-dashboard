CREATE INDEX "audits_created_at_idx" ON "audits" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audits_hostname_created_at_idx" ON "audits" USING btree ("hostname","created_at");