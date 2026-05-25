CREATE TABLE "client_contact_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"email" text NOT NULL,
	"label" text,
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "client_contact_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_contact_numbers" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"number" text NOT NULL,
	"type" text,
	"country_code" text DEFAULT '+91',
	"is_primary" boolean DEFAULT false,
	"is_whatsapp" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "client_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"type" text,
	"address" text,
	"city" text,
	"state" text,
	"pincode" text,
	"country" text DEFAULT 'India',
	"gst_number" text,
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "client_contacts" DROP CONSTRAINT "client_contacts_client_id_clients_id_fk";
--> statement-breakpoint
DROP INDEX "client_contact_email_idx";--> statement-breakpoint
DROP INDEX "client_contact_mobile_idx";--> statement-breakpoint
ALTER TABLE "client_contact_emails" ADD CONSTRAINT "client_contact_emails_contact_id_client_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."client_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contact_locations" ADD CONSTRAINT "client_contact_locations_contact_id_client_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."client_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contact_locations" ADD CONSTRAINT "client_contact_locations_location_id_client_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."client_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contact_numbers" ADD CONSTRAINT "client_contact_numbers_contact_id_client_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."client_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_locations" ADD CONSTRAINT "client_locations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_contact_email_contact_idx" ON "client_contact_emails" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "client_contact_email_idx" ON "client_contact_emails" USING btree ("email");--> statement-breakpoint
CREATE INDEX "client_contact_email_primary_idx" ON "client_contact_emails" USING btree ("contact_id","is_primary");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_email_per_contact" ON "client_contact_emails" USING btree ("contact_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_contact_location" ON "client_contact_locations" USING btree ("contact_id","location_id");--> statement-breakpoint
CREATE INDEX "client_contact_location_contact_idx" ON "client_contact_locations" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "client_contact_location_location_idx" ON "client_contact_locations" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "client_contact_location_primary_idx" ON "client_contact_locations" USING btree ("contact_id","is_primary");--> statement-breakpoint
CREATE INDEX "client_contact_number_contact_idx" ON "client_contact_numbers" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "client_contact_number_idx" ON "client_contact_numbers" USING btree ("number");--> statement-breakpoint
CREATE INDEX "client_contact_number_primary_idx" ON "client_contact_numbers" USING btree ("contact_id","is_primary");--> statement-breakpoint
CREATE INDEX "client_location_client_idx" ON "client_locations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_location_city_idx" ON "client_locations" USING btree ("city");--> statement-breakpoint
CREATE INDEX "client_location_state_idx" ON "client_locations" USING btree ("state");--> statement-breakpoint
CREATE INDEX "client_location_gst_idx" ON "client_locations" USING btree ("gst_number");--> statement-breakpoint
CREATE INDEX "client_location_primary_idx" ON "client_locations" USING btree ("client_id","is_primary");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_client_location_code" ON "client_locations" USING btree ("client_id","code");--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_contact_name_idx" ON "client_contacts" USING btree ("name");--> statement-breakpoint
ALTER TABLE "client_contacts" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "client_contacts" DROP COLUMN "mobile";--> statement-breakpoint
ALTER TABLE "client_contacts" DROP COLUMN "alternate_mobile";--> statement-breakpoint
ALTER TABLE "client_contacts" DROP COLUMN "landline";--> statement-breakpoint
ALTER TABLE "client_contacts" DROP COLUMN "whatsapp_number";