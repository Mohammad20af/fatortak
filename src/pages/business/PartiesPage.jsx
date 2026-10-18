import { useI18n } from "../../i18n/context";
import ResourcePage from "../../components/ResourcePage";
import { businessApi } from "../../api/businessApi";
const fields = [
  {
    name: "name",
    label: "Name",
    required: true,
    maxLength: 150,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    maxLength: 30,
  },
  {
    name: "taxNumber",
    label: "Tax number",
    maxLength: 100,
  },
  {
    name: "address",
    label: "Address",
    multiline: true,
    maxLength: 500,
  },
  {
    name: "notes",
    label: "Notes",
    multiline: true,
    maxLength: 1000,
  },
];
const columns = [
  {
    key: "name",
    label: "Name",
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "phone",
    label: "Phone",
  },
  {
    key: "taxNumber",
    label: "Tax number",
  },
];
export default function PartiesPage({ suppliers = false }) {
  const { t } = useI18n();
  return (
    <ResourcePage
      title={suppliers ? "Suppliers" : "Customers"}
      singular={suppliers ? "Supplier" : "Customer"}
      description={
        suppliers
          ? t("Keep your supplier relationships organized.")
          : t("A clear view of the people you do business with.")
      }
      api={suppliers ? businessApi.suppliers : businessApi.customers}
      fields={fields}
      defaults={{
        name: "",
        email: "",
        phone: "",
        taxNumber: "",
        address: "",
        notes: "",
      }}
      columns={columns}
    />
  );
}
