import { useI18n } from "../../i18n/context";
import { useCallback, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { businessApi } from "../../api/businessApi";
import useLoad from "../../utils/useLoad";
import { Field, LoadState, Notice, PageHeader } from "../../components/UI";
const fields = [
  {
    name: "businessName",
    label: "Business name",
    required: true,
    maxLength: 150,
  },
  {
    name: "taxNumber",
    label: "Tax number",
    maxLength: 100,
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    maxLength: 30,
  },
  {
    name: "email",
    label: "Business email",
    type: "email",
  },
  {
    name: "currency",
    label: "Currency code",
    options: ["USD", "ILS"],
    required: true,
    minLength: 3,
    maxLength: 3,
    pattern: "[A-Za-z]{3}",
    placeholder: "USD",
  },
  {
    name: "logoUrl",
    label: "Logo URL",
    type: "url",
    placeholder: "https://example.com/logo.png",
  },
  {
    name: "address",
    label: "Address",
    multiline: true,
    maxLength: 500,
  },
];
function ProfileForm({ profile }) {
  const { t } = useI18n();
  const { refreshProfile } = useOutletContext();
  const [form, setForm] = useState(
    Object.fromEntries(
      fields.map(({ name }) => [
        name,
        profile?.[name] || (name === "currency" ? "USD" : ""),
      ]),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({});
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setFeedback({});
    try {
      if (!form.businessName.trim())
        throw new Error("Please enter a business name.");
      await businessApi.saveProfile({
        ...Object.fromEntries(
          Object.entries(form).map(([key, value]) => [key, value.trim()]),
        ),
        currency: form.currency.toUpperCase(),
      });
      refreshProfile();
      setFeedback({
        success: "Business profile saved successfully.",
      });
    } catch (err) {
      setFeedback({
        error: err,
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="panel">
      <h2>{t("Business details")}</h2>
      <p className="muted">
        {profile
          ? t("Keep your business information current.")
          : t("Set up your business profile to get started.")}
      </p>
      <Notice {...feedback} />
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <div className="form-grid">
            {fields.map(({ name, ...field }) => (
              <Field
                key={name}
                {...field}
                value={form[name]}
                onChange={(value) =>
                  setForm({
                    ...form,
                    [name]: value,
                  })
                }
              />
            ))}
          </div>
          <p className="field-help">
            {t(
              "Use the header to choose your display currency. Each transaction keeps its original currency.",
            )}
          </p>
          <div className="form-actions">
            <button className="button">
              {busy ? t("Saving\u2026") : t("Save business profile")}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
export default function ProfilePage() {
  const { t } = useI18n();
  const loader = useCallback(async (signal) => {
    try {
      return await businessApi.profile(signal);
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  }, []);
  const state = useLoad(loader, { refreshOnRates: false });
  return (
    <>
      <PageHeader
        title={t("Business profile")}
        description={t("The details that make your business yours.")}
      />
      <LoadState state={state}>
        {!state.loading && !state.error && <ProfileForm profile={state.data} />}
      </LoadState>
    </>
  );
}
