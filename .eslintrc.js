module.exports = {
  root: true,
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
  },
  plugins: [
    "@typescript-eslint"
  ],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/vue3-recommended"
  ],
  rules: {
    "vue/no-deprecated-slot-attribute": "off",
    "vue/multi-word-component-names": "off"
  }
}