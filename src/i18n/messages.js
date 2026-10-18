import { translations } from "./translations";

const fieldLabels = {
  name: "Name",
  email: "Email",
  password: "Password",
  accountType: "Account type",
  title: "Title",
  amount: "Amount",
  category: "Category",
  month: "Month",
  year: "Year",
  businessName: "Business name",
  invoiceNumber: "Invoice number",
  customer: "Customer",
  supplier: "Supplier",
  date: "Date",
  dueDate: "Due date",
  paidAt: "Payment date",
  notes: "Notes",
  note: "Note",
  currency: "Currency code",
};

export function errorMessage(error, language, t) {
  const message = typeof error === "string" ? error : error.message;
  if (language === "en") return message;
  const fallback = {
    400: "Please check the entered information.",
    401: "Please sign in again.",
    403: "Your account cannot access this feature.",
    404: "This record could not be found.",
    409: "This record already exists.",
  };
  const parts = error.uiMessages || [message];
  return parts
    .map((part) => {
      if (translations.ar[part]) return t(part);
      // Translate only validation descriptions. Submitted values inside Mongoose messages are never translated.
      if (part.startsWith("Required: "))
        return t("Required: {fields}", {
          fields: part
            .slice(10)
            .split(", ")
            .map((field) => t(fieldLabels[field] || "This field is required."))
            .join("، "),
        });
      const field = part.match(/(?:Path `|Invalid )([\w.]+)/)?.[1];
      if (field)
        return `${t(fieldLabels[field] || "Title")}: ${t("Enter a valid value for this field.")}`;
      return t(fallback[error.status] || "The request failed.");
    })
    .filter((part, index, all) => all.indexOf(part) === index)
    .join(" ");
}

export function validationMessage(input, t) {
  input.setCustomValidity("");
  const validity = input.validity;
  if (validity.valueMissing) return t("This field is required.");
  if (validity.typeMismatch)
    return t(
      input.type === "email"
        ? "Enter a valid email address."
        : "Enter a valid URL.",
    );
  if (validity.badInput) return t("Enter a valid number.");
  if (validity.tooShort)
    return t("Use at least {min} characters.", { min: input.minLength });
  if (validity.tooLong)
    return t("Use no more than {max} characters.", { max: input.maxLength });
  if (validity.rangeUnderflow)
    return t("Enter a value of at least {min}.", { min: input.min });
  if (validity.rangeOverflow)
    return t("Enter a value no greater than {max}.", { max: input.max });
  if (validity.patternMismatch)
    return t("Enter a value in the required format.");
  if (validity.stepMismatch) return t("Enter a valid number.");
  return "";
}
