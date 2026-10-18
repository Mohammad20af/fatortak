import useFormat from "../i18n/useFormat";
import { useI18n } from "../i18n/context";
import { useCallback, useState } from "react";
import { useOutletContext } from "react-router-dom";
import useLoad from "../utils/useLoad";
import {
  Empty,
  Field,
  LoadState,
  Modal,
  Notice,
  PageHeader,
  PeriodFields,
} from "./UI";
import RecordForm from "./RecordForm";
export default function ResourcePage({
  title,
  singular,
  description,
  api,
  fields,
  defaults,
  columns,
  dateFilters = false,
  categoryOptions,
  loadOptions,
}) {
  const { money, dateLabel } = useFormat();
  const { t } = useI18n();
  const { currency } = useOutletContext();
  const [draftFilters, setDraftFilters] = useState({
    search: "",
    month: "",
    year: "",
    category: "",
  });
  const [filters, setFilters] = useState({});
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({});
  const loader = useCallback(
    async (signal) => {
      const [records, options] = await Promise.all([
        api.list(filters, signal),
        loadOptions ? loadOptions(signal) : Promise.resolve({}),
      ]);
      return {
        records,
        options,
      };
    },
    [api, filters, loadOptions],
  );
  const state = useLoad(loader);
  const formFields = fields.map((field) =>
    field.optionKey
      ? {
          ...field,
          options: [
            {
              value: "",
              label: "None",
            },
            ...(state.data?.options[field.optionKey] || []).map((record) => ({
              value: record._id,
              label: record.name,
            })),
          ],
        }
      : field,
  );
  async function openRecord(record, mode) {
    setFeedback({});
    setBusy(true);
    try {
      const fresh = await api.get(record._id);
      if (mode === "view") setDetail(fresh);
      else
        setEditor({
          id: fresh._id,
          values: Object.fromEntries(
            fields.map((field) => [
              field.name,
              field.type === "date"
                ? fresh[field.name]?.slice(0, 10) || ""
                : field.optionKey
                  ? fresh[field.name]?._id || fresh[field.name] || ""
                  : (fresh[field.name] ?? ""),
            ]),
          ),
        });
    } catch (err) {
      setFeedback({
        error: err,
      });
    } finally {
      setBusy(false);
    }
  }
  async function save(body) {
    if (editor.id) await api.update(editor.id, body);
    else await api.create(body);
    setEditor(null);
    setFeedback({
      success: `${singular} ${editor.id ? "updated" : "created"} successfully.`,
    });
    state.reload();
  }
  async function remove() {
    setBusy(true);
    setFeedback({});
    try {
      await api.remove(deleting._id);
      setDeleting(null);
      setFeedback({
        success: `${singular} deleted successfully.`,
      });
      state.reload();
    } catch (err) {
      setFeedback({
        error: err,
      });
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }
  function display(record, column) {
    const value = record[column.key];
    if (column.money) return money(value, currency);
    if (column.date) return dateLabel(value);
    if (column.party) return value?.name || "—";
    if (column.key === 'category' && categoryOptions) return t(value);
    return value || "—";
  }
  return (
    <>
      <PageHeader title={title} description={description}>
        <button
          className="button"
          disabled={busy || state.loading || Boolean(state.error)}
          onClick={() => {
            setFeedback({});
            setEditor({
              values: {
                ...defaults,
              },
            });
          }}
        >
          {t(`+ Add ${singular.toLowerCase()}`)}
        </button>
      </PageHeader>
      <Notice {...feedback} />
      <div className="panel">
        <form
          className="filters"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters({
              ...draftFilters,
            });
          }}
        >
          <Field
            label={t("Search")}
            type="search"
            placeholder={t(`Search ${title.toLowerCase()}…`)}
            value={draftFilters.search}
            onChange={(search) =>
              setDraftFilters({
                ...draftFilters,
                search,
              })
            }
          />
          {dateFilters && (
            <>
              <PeriodFields
                value={draftFilters}
                onChange={setDraftFilters}
                optional
              />
              <Field
                label={t("Category")}
                value={draftFilters.category}
                options={
                  categoryOptions
                    ? [
                        {
                          value: "",
                          label: "All categories",
                        },
                        ...categoryOptions,
                      ]
                    : undefined
                }
                placeholder={t("All categories")}
                onChange={(category) =>
                  setDraftFilters({
                    ...draftFilters,
                    category,
                  })
                }
              />
            </>
          )}
          <button className="button secondary">{t("Apply filters")}</button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setDraftFilters({
                search: "",
                month: "",
                year: "",
                category: "",
              });
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
                  {t('{count} records', { count: state.data.records.length })}
                </span>
              </div>
              {state.data.records.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {columns.map((column) => (
                          <th key={column.key}>{t(column.label)}</th>
                        ))}
                        <th className="align-right">{t("Actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.data.records.map((record) => (
                        <tr key={record._id}>
                          {columns.map((column, index) => (
                            <td
                              key={column.key}
                              className={index === 0 ? "primary-cell" : ""}
                            >
                              {display(record, column)}
                            </td>
                          ))}
                          <td>
                            <div className="row-actions">
                              <button
                                disabled={busy}
                                onClick={() => openRecord(record, "view")}
                              >
                                {t("View")}
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => openRecord(record, "edit")}
                              >
                                {t("Edit")}
                              </button>
                              <button
                                disabled={busy}
                                className="danger-text"
                                onClick={() => {
                                  setFeedback({});
                                  setDeleting(record);
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
                  {t("Add a record, or try changing your filters.")}
                </Empty>
              )}
            </>
          )}
        </LoadState>
      </div>
      {editor && (
        <Modal
          title={t(`${editor.id ? "Edit" : "Add"} ${singular.toLowerCase()}`)}
          onClose={() => setEditor(null)}
          busy={busy}
        >
          <RecordForm
            fields={formFields}
            initial={editor.values}
            onSave={save}
            onCancel={() => setEditor(null)}
            onBusy={setBusy}
          />
        </Modal>
      )}
      {deleting && (
        <Modal
          title={t(`Delete ${singular.toLowerCase()}?`)}
          onClose={() => setDeleting(null)}
          busy={busy}
        >
          <p>
            {t('“{name}” will be permanently deleted.', { name: deleting.name || deleting.title })}
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
        <Modal title={t(`${singular} details`)} onClose={() => setDetail(null)}>
          <dl className="details">
            {fields.map((field) => (
              <div key={field.name}>
                <dt>{t(field.label)}</dt>
                <dd>
                  {field.type === "number"
                    ? money(detail[field.name], currency)
                    : field.type === "date"
                      ? dateLabel(detail[field.name])
                      : field.optionKey
                        ? detail[field.name]?.name || t("None")
                        : field.name === 'category' && categoryOptions ? t(detail[field.name]) : detail[field.name] || "\u2014"}
                </dd>
              </div>
            ))}
          </dl>
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
