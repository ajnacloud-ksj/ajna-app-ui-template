import yup from "@/lib/yup"

export const loginSchema = yup.object({
  username: yup.string().required("Username is required!"),
  password: yup.string().required("Password is required!"),
})

export type TLoginFormData = yup.InferType<typeof loginSchema>
