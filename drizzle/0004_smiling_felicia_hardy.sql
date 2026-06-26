CREATE TABLE "client_sub_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"company_name" text NOT NULL,
	"company_code" text,
	"gst_number" text,
	"address" text,
	"city" text,
	"state" text,
	"pincode" text,
	"country" text DEFAULT 'India',
	"tds_applicable" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "client_contacts" ADD COLUMN "status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "client_contacts" ADD COLUMN "receives_invoice" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD COLUMN "receives_followup" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD COLUMN "receives_escalation" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "tds_applicable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "sub_client_id" integer;--> statement-breakpoint
ALTER TABLE "client_sub_clients" ADD CONSTRAINT "client_sub_clients_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sub_client_client_idx" ON "client_sub_clients" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "sub_client_gst_idx" ON "client_sub_clients" USING btree ("gst_number");--> statement-breakpoint
CREATE INDEX "sub_client_company_idx" ON "client_sub_clients" USING btree ("company_name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_sub_client_company" ON "client_sub_clients" USING btree ("client_id","company_name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_sub_client_code" ON "client_sub_clients" USING btree ("client_id","company_code");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sub_client_id_client_sub_clients_id_fk" FOREIGN KEY ("sub_client_id") REFERENCES "public"."client_sub_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_contact_status_idx" ON "client_contacts" USING btree ("status");--> statement-breakpoint
ALTER TABLE "client_contacts" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "client_locations" DROP COLUMN "name";