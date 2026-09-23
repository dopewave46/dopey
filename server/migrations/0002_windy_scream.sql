CREATE TABLE "portal_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "portal_credentials_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "portal_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"ip" text
);
--> statement-breakpoint
CREATE TABLE "project_updates" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"note" text,
	"percent_at_update" integer,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "portal_credentials" ADD CONSTRAINT "portal_credentials_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "portal_credentials_client_id_idx" ON "portal_credentials" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "project_updates_project_id_idx" ON "project_updates" USING btree ("project_id");