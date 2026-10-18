import { useI18n } from "../../i18n/context";
import ResourcePage from "../../components/ResourcePage";
import { businessApi } from "../../api/businessApi";
import { today } from "../../utils/format";
const fields = [
  {
    name: "currency",
    label: "Original currency",
    options: ["USD", "ILS"],
    required: true,
  },
  {
    name: "title",
    label: "Title",
    required: true,
    maxLength: 150,
  },
  {
    name: "amount",
    label: "Amount",
    required: true,
    type: "number",
    min: 0,
    step: "0.01",
  },
  {
    name: "category",
    label: "Category",
    required: true,
    maxLength: 100,
  },
  {
    name: "date",
    label: "Date",
    required: true,
    type: "date",
  },
  {
    name: "supplier",
    label: "Supplier",
    optionKey: "suppliers",
    nullable: true,
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
    key: "title",
    label: "Expense",
  },
  {
    key: "category",
    label: "Category",
  },
  {
    key: "supplier",
    label: "Supplier",
    party: true,
  },
  {
    key: "date",
    label: "Date",
    date: true,
  },
  {
    key: "amount",
    label: "Amount",
    money: true,
  },
];
const loadOptions = async (signal) => ({
  suppliers: await businessApi.suppliers.list({}, signal),
});
export default function BusinessExpensesPage() {
  const { t } = useI18n();
  return (
    <ResourcePage
      title={"Business expenses"}
      singular="Expense"
      description={t("Track the running costs behind your business.")}
      api={businessApi.expenses}
      fields={fields}
      defaults={{
        title: "",
        amount: "",
        category: "",
        date: today(),
        supplier: "",
        notes: "",
      }}
      columns={columns}
      dateFilters
      loadOptions={loadOptions}
    />
  );
}
