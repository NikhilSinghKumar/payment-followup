CREATE TABLE "invoice_awbs" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"awb_number" text NOT NULL,
	"shipment_date" date,
	"origin" text,
	"destination" text,
	"weight" numeric(10, 2),
	"amount" numeric(12, 2),
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_id" integer NOT NULL,
	"invoice_id" integer NOT NULL,
	"allocated_amount" numeric(12, 2) NOT NULL,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DROP INDEX "unique_invoice";--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "invoice_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "invoice_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "followups" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "financial_year" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "client_id" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "receipt_number" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "void_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "voided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "voided_by" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoice_awbs" ADD CONSTRAINT "invoice_awbs_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_awb_per_invoice" ON "invoice_awbs" USING btree ("invoice_id","awb_number");--> statement-breakpoint
CREATE INDEX "invoice_awb_invoice_idx" ON "invoice_awbs" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_awb_number_idx" ON "invoice_awbs" USING btree ("awb_number");--> statement-breakpoint
CREATE INDEX "invoice_awb_shipment_date_idx" ON "invoice_awbs" USING btree ("shipment_date");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_payment_invoice" ON "payment_allocations" USING btree ("payment_id","invoice_id");--> statement-breakpoint
CREATE INDEX "payment_allocation_payment_idx" ON "payment_allocations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_allocation_invoice_idx" ON "payment_allocations" USING btree ("invoice_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_voided_by_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "followup_invoice_idx" ON "followups" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "followup_date_idx" ON "followups" USING btree ("followup_date");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_invoice_number" ON "invoices" USING btree ("client_id","financial_year","invoice_number");--> statement-breakpoint
CREATE INDEX "invoice_client_idx" ON "invoices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_due_date_idx" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "invoice_number_idx" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoice_financial_year_idx" ON "invoices" USING btree ("financial_year");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_receipt_number" ON "payments" USING btree ("receipt_number");--> statement-breakpoint
CREATE INDEX "payment_client_idx" ON "payments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "payment_invoice_legacy_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payment_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "payment_reference_idx" ON "payments" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "payment_receipt_idx" ON "payments" USING btree ("receipt_number");--> statement-breakpoint
CREATE INDEX "payment_voided_idx" ON "payments" USING btree ("is_voided");--> statement-breakpoint
CREATE INDEX "payment_created_by_idx" ON "payments" USING btree ("created_by");