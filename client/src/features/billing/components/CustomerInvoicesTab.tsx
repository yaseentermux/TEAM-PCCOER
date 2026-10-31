// [M4] Invoices of one customer, for M1's customer detail page: <CustomerInvoicesTab customerId={id} />
import { useState } from "react";
import { useInvoices } from "../api";
import { InvoicesTable } from "./InvoicesTable";
import { Pager } from "./Pager";

export function CustomerInvoicesTab({ customerId }: { customerId: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useInvoices({ customerId, page, limit: 10 });
  return (
    <div>
      <InvoicesTable rows={data?.data} loading={isLoading} showCustomer={false} linkTo={(id) => `/app/invoices/${id}`} />
      {data && <Pager {...data.meta} onPage={setPage} />}
    </div>
  );
}
