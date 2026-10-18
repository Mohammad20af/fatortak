import { useI18n } from "../../i18n/context";
import ResourcePage from "../../components/ResourcePage";
import { personalApi } from "../../api/personalApi";
import { categories, today } from "../../utils/format";
const fields = [
  {
    name: "title",
    label: "Title",
    required: true,
    maxLength: 150,
  },
  {
    name: "amount",
    label: "Amount",
    type: "number",
    required: true,
    min: 0,
    step: "0.01",
  },
  {
    name: "category",
    label: "Category",
    options: categories,
    required: true,
  },
  {
    name: "date",
    label: "Date",
    type: "date",
    required: true,
  },
  {
    name: "note",
    label: "Note",
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
export default function ExpensesPage() {
  const { t } = useI18n();
  return (
    <ResourcePage
      title={"Expenses"}
      singular="Expense"
      description={t("The everyday details, all in one place.")}
      api={personalApi.expenses}
      fields={fields}
      defaults={{
        title: "",
        amount: "",
        category: "Food",
        date: today(),
        note: "",
      }}
      columns={columns}
      dateFilters
      categoryOptions={categories}
    />
  );
}
