import * as yup from "yup"

yup.setLocale({
  mixed: {
    required: "This field is required!",
    notType: "Value must be of type ${type}!",
    defined: "A value must be provided!",
  },
  string: {
    email: "Please enter a valid email address!",
    length: "Length must be ${length} characters!",
    min: "Must be at least ${min} characters long!",
    max: "Must be at most ${max} characters long!",
    trim: "Cannot start or end with whitespace!",
    lowercase: "Must be lowercase!",
    uppercase: "Must be uppercase!",
  },
  number: {
    integer: "Must be an integer value!",
    min: "Must be at least ${min}!",
    max: "Must be at most ${max}!",
    positive: "Must be a positive number!",
    negative: "Must be a negative number!",
    moreThan: "Must be more than ${more}",
    lessThan: "Must be more than ${less}",
  },
  array: {
    length: "Must have exactly ${length} items!",
    min: "Must have at least ${min} items!",
    max: "Must have at most ${max} items!",
  },
  date: {
    min: "Date must be after ${min}!",
    max: "Date must be before ${max}!",
  },
  object: {
    noUnknown: "No unspecified keys are allowed!",
  },
})

declare module "yup" {
  interface Schema {
    transformEmptyStringToNull(): Schema
  }
  interface StringSchema {
    alphaNumeric(message?: string): StringSchema
  }
}

yup.addMethod<yup.Schema>(yup.mixed, "transformEmptyStringToNull", function () {
  return this.transform((value, originalValue) =>
    originalValue?.trim() === "" ? null : value
  )
})

// This will automatically apply to all schema types since `yup.Schema` is the base interface
yup.addMethod<yup.StringSchema>(
  yup.string,
  "transformEmptyStringToNull",
  function () {
    return this.transform((value, originalValue) =>
      originalValue?.trim() === "" ? null : value
    )
  }
)

yup.addMethod<yup.NumberSchema>(
  yup.number,
  "transformEmptyStringToNull",
  function () {
    return this.transform((value, originalValue) => {
      if (typeof originalValue === "string") {
        return originalValue?.trim() === "" ? null : value
      }
      if (Number.isNaN(originalValue)) {
        return null
      }
      return value
    })
  }
)

yup.addMethod<yup.BooleanSchema>(
  yup.boolean,
  "transformEmptyStringToNull",
  function () {
    return this.transform((value, originalValue) =>
      originalValue?.trim() === "" ? null : value
    )
  }
)

yup.addMethod<yup.DateSchema>(
  yup.date,
  "transformEmptyStringToNull",
  function () {
    return this.transform((value, originalValue) =>
      originalValue?.trim() === "" ? null : value
    )
  }
)

//new email validation

yup.addMethod<yup.StringSchema>(yup.string, "email", function () {
  return this.transform((value, originalValue) =>
    originalValue?.trim() === "" ? null : value
  )
})

yup.StringSchema.prototype.email = function (
  message = "Please enter a valid email address!"
) {
  return this.matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    name: "email",
    message,
    excludeEmptyString: true,
  })
}

yup.addMethod<yup.StringSchema>(
  yup.string,
  "alphaNumeric",
  function (message = "Must be alpha-numeric!") {
    return this.matches(/^[a-zA-Z0-9]+$/, {
      name: "alphanumeric",
      message,
      excludeEmptyString: true,
    })
  }
)

export default yup
