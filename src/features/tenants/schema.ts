import * as yup from "yup"

export const tenantSchema = yup.object().shape({
  company_name: yup
    .string()
    .required("Company name is required")
    .min(2, "Company name must be at least 2 characters"),
  tenant_id: yup
    .string()
    .required("Tenant ID is required")
    .matches(
      /^[a-z0-9_]+$/,
      "Only lowercase letters, numbers, and underscores are allowed"
    )
    .min(3, "Tenant ID must be at least 3 characters"),
  contact_email: yup
    .string()
    .email("Must be a valid email address")
    .required("Contact email is required"),
  contact_phone: yup.string().required("Contact phone is required"),
  plan: yup.string().required("Plan selection is required"),
  status: yup.string().oneOf(["active", "suspended", "inactive"]).optional(),
})
