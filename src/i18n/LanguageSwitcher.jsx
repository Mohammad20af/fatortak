import { useI18n } from "./context";
import { useEffect, useId, useRef, useState } from "react";
import NavIcon from "../components/NavIcon";

const languages = [
  { code: "ar", label: "العربية", direction: "rtl" },
  { code: "en", label: "English", direction: "ltr" },
];

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const items = useRef([]);
  const nextFocus = useRef(0);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    items.current[nextFocus.current]?.focus();
    const outside = (event) => {
      if (!container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);

  function closeAndFocus() {
    setOpen(false);
    trigger.current?.focus();
  }
  function openAt(index) {
    nextFocus.current = index;
    setOpen(true);
  }
  function menuKeyDown(event) {
    const index = items.current.indexOf(document.activeElement);
    const actions = {
      ArrowDown: (index + 1) % languages.length,
      ArrowUp: (index - 1 + languages.length) % languages.length,
      Home: 0,
      End: languages.length - 1,
    };
    if (event.key in actions) {
      event.preventDefault();
      items.current[actions[event.key]]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeAndFocus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }
  return (
    <div
      className="language-switcher"
      ref={container}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          closeAndFocus();
        }
      }}
    >
      <button
        ref={trigger}
        id={`${id}-trigger`}
        type="button"
        className="language-trigger"
        aria-label={t("Language")}
        title={t("Language")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        onClick={() => {
          if (open) setOpen(false);
          else openAt(languages.findIndex(({ code }) => code === language));
        }}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            openAt(event.key === "ArrowDown" ? 0 : languages.length - 1);
          }
        }}
      >
        <NavIcon name="globe" />
      </button>
      <div
        id={`${id}-menu`}
        role="menu"
        aria-labelledby={`${id}-trigger`}
        aria-hidden={!open}
        inert={!open}
        className="language-menu"
        data-open={open}
        onKeyDown={menuKeyDown}
      >
        {languages.map(({ code, label, direction }, index) => (
          <button
            ref={(node) => {
              items.current[index] = node;
            }}
            key={code}
            type="button"
            role="menuitemradio"
            aria-checked={language === code}
            tabIndex={-1}
            className="language-option"
            onClick={() => {
              setLanguage(code);
              closeAndFocus();
            }}
          >
            <span lang={code} dir={direction}>
              {label}
            </span>
            <span className="language-check" aria-hidden="true">
              {language === code && <NavIcon name="check" />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
