CREATE TABLE "audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requested_url" text NOT NULL,
	"final_url" text,
	"hostname" varchar(255) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"duration_ms" integer,
	"error_code" varchar(64),
	"error_message" text,
	"summary" jsonb,
	"scores" jsonb,
	"results" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
