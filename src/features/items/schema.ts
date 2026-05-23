import yup from "@/lib/yup"

export const itemFormSchema = yup.object({
  code: yup.string().required("Code is required!"),
  name: yup.string().required("Name is required!"),
  description: yup.string().nullable().transformEmptyStringToNull(),
  category: yup.string().nullable().transformEmptyStringToNull(),
  quantity: yup.string().nullable().transformEmptyStringToNull(),
  price: yup.string().nullable().transformEmptyStringToNull(),
  is_active: yup.string().nullable().transformEmptyStringToNull(),
  /** Dynamic custom fields mapped as a dynamic object of strings */
  custom_fields: yup.object().optional(),
})

export type TItemFormSchema = yup.InferType<typeof itemFormSchema>
