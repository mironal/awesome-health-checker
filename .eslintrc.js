module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: { sourceType: "module", project: "./tsconfig.json" },
  rules: {
    "no-unused-vars": "off"
  },
  env: {
    "webextensions": true,
    "es6": true,
    "browser": true
  }
}
