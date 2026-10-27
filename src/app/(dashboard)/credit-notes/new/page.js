import { getCreditNoteFormData } from "@/app/actions/creditNote";
import CreditNoteForm from "@/app/components/credit-note/CreditNoteForm";

export const dynamic = "force-dynamic";

export default async function NewCreditNotePage() {
  const data = await getCreditNoteFormData();
  return <CreditNoteForm clients={data.clients} invoices={data.invoices} />;
}
