import { useState } from "react";

const FIELDS = [
  { name: "fullName", label: "Full Name", type: "text", autoComplete: "name" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { name: "addressLine1", label: "Address", type: "text", autoComplete: "address-line1" },
  { name: "city", label: "City", type: "text", autoComplete: "address-level2" },
  { name: "state", label: "State", type: "text", autoComplete: "address-level1" },
  { name: "pincode", label: "Pincode", type: "text", autoComplete: "postal-code", inputMode: "numeric" },
];

export const validateShipping = (v) => {
  const errors = {};
  const t = (k) => (v[k] || "").trim();

  if (!t("fullName")) errors.fullName = "Full name is required.";
  if (!t("phone")) errors.phone = "Phone number is required.";
  else if (!/^[6-9]\d{9}$/.test(t("phone").replace(/[\s-]/g, "").replace(/^\+91/, "")))
    errors.phone = "Enter a valid 10-digit mobile number.";
  if (!t("addressLine1")) errors.addressLine1 = "Address is required.";
  if (!t("city")) errors.city = "City is required.";
  if (!t("state")) errors.state = "State is required.";
  if (!t("pincode")) errors.pincode = "Pincode is required.";
  else if (!/^\d{6}$/.test(t("pincode"))) errors.pincode = "Pincode must contain 6 digits.";
  return errors;
};

// Controlled form. Form state lives HERE (it is local UI state, nobody else needs it);
// the parent only receives the cleaned values on a valid submit.
export default function CheckoutForm({ initialValues, onSubmit, submitting, children }) {
  const [values, setValues] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
    ...initialValues,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validateShipping(values);
    setErrors(found);
    if (Object.keys(found).length) return; // invalid -> no backend call
    const clean = {};
    for (const k of Object.keys(values)) clean[k] = values[k].trim();
    onSubmit(clean);
  };

  return (
    <form className="checkout-form" onSubmit={handleSubmit} noValidate>
      <h2>Shipping Details</h2>
      {FIELDS.map((f) => (
        <div className="form-field" key={f.name}>
          <label htmlFor={f.name}>{f.label}</label>
          <input
            id={f.name}
            name={f.name}
            type={f.type}
            autoComplete={f.autoComplete}
            inputMode={f.inputMode}
            value={values[f.name]}
            onChange={handleChange}
            disabled={submitting}
            aria-invalid={!!errors[f.name]}
            className={errors[f.name] ? "invalid" : ""}
          />
          {errors[f.name] && <p className="wishlist-error">{errors[f.name]}</p>}
        </div>
      ))}
      {children}
    </form>
  );
}
