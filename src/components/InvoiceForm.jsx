import useFormat from "../i18n/useFormat";
import { useI18n } from "../i18n/context";
import { useState } from "react";
import { dateInput, today } from "../utils/format";
import { Field, Notice } from "./UI";
export default function InvoiceForm({
  invoice,
  type,
  customers,
  suppliers,
  currency,
  onSave,
  onCancel,
  onBusy,
}) {
  const { money } = useFormat();
  const { t } = useI18n();
  const [form, setForm] = useState({
    invoiceNumber: invoice?.invoiceNumber || "",
    title: invoice?.title || "",
    amount: invoice?.amount ?? "",
    category: invoice?.category || "Other",
    customer: invoice?.customer?._id || "",
    supplier: invoice?.supplier?._id || "",
    status: invoice?.status || "unpaid",
    date: dateInput(invoice?.date) || today(),
    dueDate: dateInput(invoice?.dueDate),
    paidAt: dateInput(invoice?.paidAt),
    notes: invoice?.notes || "",
  });
  const [items, setItems] = useState(
    invoice?.items?.map((item) => ({
      ...item,
    })) || [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (key) => (value) =>
    setForm({
      ...form,
      [key]: value,
    });
  const itemTotal = items.reduce(
    (total, item) => total + Number(item.quantity) * Number(item.unitPrice),
    0,
  );
  function updateItem(index, key, value) {
    setItems(
      items.map((item, position) =>
        position === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    onBusy(true);
    try {
      if (!form.title.trim() || items.some((item) => !item.description.trim()))
        throw new Error(
          "Please enter a title and a description for every line item.",
        );
      // Recalculate after every line-item edit so a stored amount cannot become stale.
      const body = {
        ...form,
        title: form.title.trim(),
        type,
        amount: items.length
          ? Number(itemTotal.toFixed(2))
          : Number(form.amount),
        customer: form.customer || null,
        supplier: form.supplier || null,
        dueDate: form.dueDate || null,
        paidAt: form.status === "paid" ? form.paidAt || null : null,
        items: items.map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };
      if (!body.invoiceNumber.trim()) {
        if (invoice?.invoiceNumber)
          throw new Error(
            "Use a replacement invoice number when editing an existing number.",
          );
        delete body.invoiceNumber;
      } else body.invoiceNumber = body.invoiceNumber.trim();
      await onSave(body);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <Notice error={error} />
      <fieldset disabled={busy}>
        <div className="form-grid">
          <Field
            label={t("Title")}
            required
            maxLength={150}
            value={form.title}
            onChange={update("title")}
          />
          <Field
            label={t("Invoice number")}
            placeholder={t("Optional, unique in your account")}
            value={form.invoiceNumber}
            onChange={update("invoiceNumber")}
          />
          <Field
            label={t("Customer")}
            options={[
              {
                value: "",
                label: "None",
              },
              ...customers.map((party) => ({
                value: party._id,
                label: party.name,
              })),
            ]}
            value={form.customer}
            onChange={update("customer")}
          />
          <Field
            label={t("Supplier")}
            options={[
              {
                value: "",
                label: "None",
              },
              ...suppliers.map((party) => ({
                value: party._id,
                label: party.name,
              })),
            ]}
            value={form.supplier}
            onChange={update("supplier")}
          />
          <Field
            label={t("Category")}
            value={form.category}
            onChange={update("category")}
          />
          <Field
            label={t("Status")}
            options={["unpaid", "paid", "overdue"]}
            value={form.status}
            onChange={update("status")}
          />
          <Field
            label={t("Invoice date")}
            type="date"
            required
            value={form.date}
            onChange={update("date")}
          />
          <Field
            label={t("Due date")}
            type="date"
            value={form.dueDate}
            onChange={update("dueDate")}
          />
          {form.status === "paid" && (
            <Field
              label={t("Payment date")}
              type="date"
              value={form.paidAt}
              onChange={update("paidAt")}
            />
          )}
        </div>
        <div className="section-heading">
          <h3>{t("Line items")}</h3>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setItems([
                ...items,
                {
                  description: "",
                  quantity: 1,
                  unitPrice: "",
                },
              ])
            }
          >
            {t("+ Add line item")}
          </button>
        </div>
        <p className="field-help">
          {t(
            "Use line items to calculate the total, or enter a single amount below.",
          )}
        </p>
        {items.map((item, index) => (
          <div className="invoice-item" key={index}>
            <Field
              label={t("Description {number}", {
                number: index + 1,
              })}
              required
              value={item.description}
              onChange={(value) => updateItem(index, "description", value)}
            />
            <Field
              label={t("Quantity {number}", {
                number: index + 1,
              })}
              type="number"
              required
              min="0"
              step="any"
              value={item.quantity}
              onChange={(value) => updateItem(index, "quantity", value)}
            />
            <Field
              label={t("Unit price {number}", {
                number: index + 1,
              })}
              type="number"
              required
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={(value) => updateItem(index, "unitPrice", value)}
            />
            <button
              type="button"
              className="icon-button danger-text"
              aria-label={t("Remove line item {number}", {
                number: index + 1,
              })}
              onClick={() =>
                setItems(items.filter((_, position) => position !== index))
              }
            >
              ×
            </button>
          </div>
        ))}
        {items.length ? (
          <div className="invoice-total">
            {t("Total")}
            <strong>{money(itemTotal, currency)}</strong>
          </div>
        ) : (
          <Field
            label={t("Amount ({currency})", {
              currency: currency,
            })}
            type="number"
            min="0"
            step="0.01"
            required
            value={form.amount}
            onChange={update("amount")}
          />
        )}
        <Field
          label={t("Notes")}
          multiline
          maxLength={1000}
          value={form.notes}
          onChange={update("notes")}
        />
        <p className="field-help">
          {t(
            "Unpaid invoices with a past due date are marked overdue automatically.",
          )}
        </p>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onCancel}>
            {t("Cancel")}
          </button>
          <button className="button">
            {busy ? t("Saving\u2026") : t("Save invoice")}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
