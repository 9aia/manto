// eslint.config.mjs
import antfu from "@antfu/eslint-config"

export default antfu({
  stylistic: {
    indent: 2,
    quotes: "double",
  },

  typescript: true,
  vue: false,

  rules: {
    "no-console": "off",
    "ts/prefer-literal-enum-member": "off",
    "no-case-declarations": "off",
  },
})
