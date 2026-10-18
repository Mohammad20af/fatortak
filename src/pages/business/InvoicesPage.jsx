import useFormat from "../../i18n/useFormat";
import { useI18n } from "../../i18n/context";
import { useCallback, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { businessApi } from "../../api/businessApi";
import useLoad from "../../utils/useLoad";
import {
  Badge,
  Empty,
  Field,
  LoadState,
  Modal,
  Notice,
  PageHeader,
  PeriodFields,
} from "../../components/UI";
import InvoiceForm from "../../components/InvoiceForm";
const emptyFilters = {
  search: "",
  status: "",
  month: "",
  year: "",
  customer: "",
  supplier: "",
};
export default function InvoicesPage({ type }) {
  const { dateLabel, money } = useFormat();
  const { t } = useI18n();
  const { currency } = useOutletContext();
  const [filters, setFilters] = useState({});
  const [draft, setDraft] = useState(emptyFilters);
  const [editor, setEditor] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [busy, setBusy] = useState(false);
  const title = type === "sales" ? "Sales invoices" : "Purchase invoices";
  const loader = useCallback(
    async (signal) => {
      // The common endpoint accepts an explicit type query and works with Express 5.
      const [invoices, customers, suppliers] = await Promise.all([
        businessApi.invoices.list(
          {
            ...filters,
            type,
          },
          signal,
        ),
        businessApi.customers.list({}, signal),
        businessApi.suppliers.list({}, signal),
      ]);
      return {
        invoices,
        customers,
        suppliers,
      };
    },
    [filters, type],
  );
  const state = useLoad(loader);
  async function open(invoice, edit) {
    setBusy(true);
    setFeedback({});
    try {
      const fresh = await businessApi.invoices.get(invoice._id);
      if (edit)
        setEditor({
          invoice: fresh,
        });
      else setDetail(fresh);
    } catch (err) {
      setFeedback({
        error: err,
      });
    } finally {
      setBusy(false);
    }
  }
  async function save(body) {
    if (editor.invoice)
      await businessApi.invoices.update(editor.invoice._id, body);
    else await businessApi.invoices.create(body);
    setEditor(null);
    setFeedback({
      success: "Invoice saved successfully.",
    });
    state.reload();
  }
  async function remove() {
    setBusy(true);
    try {
      await businessApi.invoices.remove(deleting._id);
      setFeedback({
        success: "Invoice deleted successfully.",
      });
      state.reload();
    } catch (err) {
      setFeedback({
        error: err,
      });
    } finally {
      setDeleting(null);
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title={title}
        description={
          type === "sales"
            ? t("From work delivered to payments received.")
            : t("Stay on top of your purchases and payments.")
        }
      >
        <button
          className="button"
          disabled={busy || state.loading || Boolean(state.error)}
          onClick={() => {
            setFeedback({});
            setEditor({
              invoice: null,
            });
          }}
        >
          {t("+ Add invoice")}
        </button>
      </PageHeader>
      <Notice {...feedback} />
      <div className="panel">
        <form
          className="filters"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters({
              ...draft,
            });
          }}
        >
          <Field
            label={t("Search")}
            type="search"
            placeholder={t("Title, number or notes\u2026")}
            value={draft.search}
            onChange={(search) =>
              setDraft({
                ...draft,
                search,
              })
            }
          />
          <PeriodFields value={draft} onChange={setDraft} optional />
          <Field
            label={t("Status")}
            options={[
              {
                value: "",
                label: "All statuses",
              },
              "paid",
              "unpaid",
              "overdue",
            ]}
            value={draft.status}
            onChange={(status) =>
              setDraft({
                ...draft,
                status,
              })
            }
          />
          <Field
            label={t("Customer")}
            options={[
              {
                value: "",
                label: "All customers",
              },
              ...(state.data?.customers || []).map((party) => ({
                value: party._id,
                label: party.name,
              })),
            ]}
            value={draft.customer}
            onChange={(customer) =>
              setDraft({
                ...draft,
                customer,
              })
            }
          />
          <Field
            label={t("Supplier")}
            options={[
              {
                value: "",
                label: "All suppliers",
              },
              ...(state.data?.suppliers || []).map((party) => ({
                value: party._id,
                label: party.name,
              })),
            ]}
            value={draft.supplier}
            onChange={(supplier) =>
              setDraft({
                ...draft,
                supplier,
              })
            }
          />
          <button className="button secondary">{t("Apply filters")}</button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setDraft(emptyFilters);
              setFilters({});
            }}
          >
            {t("Reset")}
          </button>
        </form>
        <LoadState state={state}>
          {state.data && (
            <>
              <div className="section-heading">
                <h2>{t(`All ${title.toLowerCase()}`)}</h2>
                <span className="count">
                  {t('{count} invoices', { count: state.data.invoices.length })}
                </span>
              </div>
              {state.data.invoices.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("Invoice")}</th>
                        <th>
                          {type === "sales" ? t("Customer") : t("Supplier")}
                        </th>
                        <th>{t("Date / Due date")}</th>
                        <th>{t("Status")}</th>
                        <th>{t("Amount")}</th>
                        <th className="align-right">{t("Actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.data.invoices.map((invoice) => (
                        <tr key={invoice._id}>
                          <td className="primary-cell">
                            {invoice.title}
                            <small>
                              {invoice.invoiceNumber || t("No invoice number")}
                            </small>
                          </td>
                          <td>
                            {invoice[type === "sales" ? "customer" : "supplier"]
                              ?.name || "\u2014"}
                          </td>
                          <td>
                            {dateLabel(invoice.date)}
                            <small>
                              {t("Due")}{' '}
                              {dateLabel(invoice.dueDate)}
                            </small>
                          </td>
                          <td>
                            <Badge status={invoice.status} />
                          </td>
                          <td>{money(invoice.amount, currency)}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                disabled={busy}
                                onClick={() => open(invoice, false)}
                              >
                                {t("View")}
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => open(invoice, true)}
                              >
                                {t("Edit")}
                              </button>
                              <button
                                disabled={busy}
                                className="danger-text"
                                onClick={() => {
                                  setFeedback({});
                                  setDeleting(invoice);
                                }}
                              >
                                {t("Delete")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title={t(`No ${title.toLowerCase()} found`)}>
                  {t("Create an invoice, or adjust your filters.")}
                </Empty>
              )}
            </>
          )}
        </LoadState>
      </div>
      {editor && (
        <Modal
          title={t(`${editor.invoice ? "Edit" : "Add"} ${type} invoice`)}
          busy={busy}
          onClose={() => setEditor(null)}
        >
          <InvoiceForm
            {...state.data}
            invoice={editor.invoice}
            type={type}
            currency={currency}
            onSave={save}
            onCancel={() => setEditor(null)}
            onBusy={setBusy}
          />
        </Modal>
      )}
      {deleting && (
        <Modal
          title={t("Delete invoice?")}
          busy={busy}
          onClose={() => setDeleting(null)}
        >
          <p>
            {t('“{name}” will be permanently deleted.', { name: deleting.title })}
          </p>
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              {t("Cancel")}
            </button>
            <button className="button danger" disabled={busy} onClick={remove}>
              {busy ? t("Deleting\u2026") : t("Confirm delete")}
            </button>
          </div>
        </Modal>
      )}
      {detail && (
        <Modal
          title={detail.invoiceNumber || t("Invoice details")}
          onClose={() => setDetail(null)}
        >
          <div className="invoice-detail-heading">
            <div>
              <span className="eyebrow">
                {t(`${detail.type || 'sales'} INVOICE`)}
              </span>
              <h2>{detail.title}</h2>
            </div>
            <Badge status={detail.status} />
          </div>
          <dl className="details">
            <div>
              <dt>{t("Customer")}</dt>
              <dd>{detail.customer?.name || "\u2014"}</dd>
            </div>
            <div>
              <dt>{t("Supplier")}</dt>
              <dd>{detail.supplier?.name || "\u2014"}</dd>
            </div>
            <div>
              <dt>{t("Invoice date")}</dt>
              <dd>{dateLabel(detail.date)}</dd>
            </div>
            <div>
              <dt>{t("Due date")}</dt>
              <dd>{dateLabel(detail.dueDate)}</dd>
            </div>
            <div>
              <dt>{t("Payment date")}</dt>
              <dd>{dateLabel(detail.paidAt)}</dd>
            </div>
            <div>
              <dt>{t("Category")}</dt>
              <dd>{detail.category}</dd>
            </div>
          </dl>
          {Boolean(detail.items?.length) && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Description")}</th>
                    <th>{t("Quantity")}</th>
                    <th>{t("Unit price")}</th>
                    <th>{t("Total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.unitPrice, currency)}</td>
                      <td>{money(item.quantity * item.unitPrice, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="invoice-total">
            {t("Total")}
            <strong>{money(detail.amount, currency)}</strong>
          </div>
          <p className="preserve-lines">
            {detail.notes || t("No additional notes.")}
          </p>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setDetail(null)}
            >
              {t("Close")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
