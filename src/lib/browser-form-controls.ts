export type WritableFormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export function getTargetForm(formId?: string, root?: HTMLElement | null) {
  if (formId) {
    const form = document.getElementById(formId);
    return form instanceof HTMLFormElement ? form : null;
  }

  return root?.closest("form") ?? null;
}

export function readFormValue(form: HTMLFormElement, name: string) {
  const controls = getNamedControls(form, name);
  const control = controls[0];

  if (!control) {
    return "";
  }

  if (control instanceof HTMLInputElement && control.type === "checkbox") {
    return (
      controls
        .filter((item): item is HTMLInputElement => item instanceof HTMLInputElement && item.type === "checkbox" && item.checked)
        .map((item) => item.value.trim())
        .filter(Boolean)[0] ?? ""
    );
  }

  return control.value.trim();
}

export function readFormList(form: HTMLFormElement, name: string) {
  const controls = getNamedControls(form, name);
  const checkboxValues = controls
    .filter((item): item is HTMLInputElement => item instanceof HTMLInputElement && item.type === "checkbox" && item.checked)
    .map((item) => item.value.trim())
    .filter(Boolean);

  if (checkboxValues.length > 0) {
    return Array.from(new Set(checkboxValues));
  }

  return Array.from(
    new Set(
      readFormValue(form, name)
        .split(/[\n,，]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export function writeFormValue(form: HTMLFormElement, name: string, value: string | string[]) {
  const controls = getNamedControls(form, name);
  if (controls.length === 0) {
    return false;
  }

  const values = normalizeFormValues(value);
  if (values.length === 0) {
    return false;
  }

  const checkboxes = controls.filter((item): item is HTMLInputElement => item instanceof HTMLInputElement && item.type === "checkbox");
  if (checkboxes.length > 0) {
    const selected = new Set(values.map((item) => item.toLowerCase()));
    checkboxes.forEach((checkbox) => {
      checkbox.checked = selected.has(checkbox.value.toLowerCase());
      dispatchInputEvents(checkbox);
    });
    return true;
  }

  const control = controls[0];
  if (control instanceof HTMLSelectElement) {
    const nextValue = findSelectOptionValue(control, values);
    if (!nextValue) {
      return false;
    }
    control.value = nextValue;
    dispatchInputEvents(control);
    return true;
  }

  control.value = Array.isArray(value) ? values.join("\n") : values[0];
  dispatchInputEvents(control);
  return true;
}

export function appendCheckboxValues(form: HTMLFormElement, name: string, value: string | string[]) {
  const values = normalizeFormValues(value);
  if (values.length === 0) {
    return false;
  }

  const selected = new Set(values.map((item) => item.toLowerCase()));
  const checkboxes = getNamedControls(form, name).filter(
    (item): item is HTMLInputElement => item instanceof HTMLInputElement && item.type === "checkbox"
  );

  if (checkboxes.length === 0) {
    return writeFormValue(form, name, values);
  }

  let changed = false;
  checkboxes.forEach((checkbox) => {
    if (selected.has(checkbox.value.toLowerCase()) && !checkbox.checked) {
      checkbox.checked = true;
      dispatchInputEvents(checkbox);
      changed = true;
    }
  });

  return changed;
}

export function getNamedControls(form: HTMLFormElement, name: string) {
  return Array.from(form.elements).filter((element): element is WritableFormControl => {
    return (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) && element.name === name;
  });
}

export function findSelectOptionValue(select: HTMLSelectElement, values: string[]) {
  const options = Array.from(select.options);

  for (const value of values) {
    const direct = options.find((option) => option.value === value);
    if (direct) {
      return direct.value;
    }

    const byLabel = options.find((option) => option.text.trim() === value);
    if (byLabel) {
      return byLabel.value;
    }
  }

  return "";
}

export function dispatchInputEvents(control: WritableFormControl) {
  control.dispatchEvent(new Event("input", { bubbles: true }));
  control.dispatchEvent(new Event("change", { bubbles: true }));
}

function normalizeFormValues(value: string | string[]) {
  return (Array.isArray(value) ? value : [value]).map((item) => item.trim()).filter(Boolean);
}
