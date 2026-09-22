CREATE TABLE "outreach_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"calls_made" integer DEFAULT 0 NOT NULL,
	"calls_target" integer DEFAULT 30 NOT NULL,
	"instagram_posted" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "outreach_logs_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE INDEX "outreach_logs_date_idx" ON "outreach_logs" USING btree ("date");