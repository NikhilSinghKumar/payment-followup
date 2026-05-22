CREATE TABLE "client_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" text NOT NULL,
	"designation" text,
	"department" text,
	"email" text,
	"mobile" text,
	"alternate_mobile" text,
	"landline" text,
	"whatsapp_number" text,
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_contact_client_idx" ON "client_contacts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_contact_email_idx" ON "client_contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "client_contact_mobile_idx" ON "client_contacts" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "client_contact_primary_idx" ON "client_contacts" USING btree ("client_id","is_primary");