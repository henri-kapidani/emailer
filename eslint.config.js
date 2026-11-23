import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
	{
		languageOptions: {
			globals: {
				...globals.nodeBuiltin,
				// myCustomGlobal: "readonly"
			},
		},
	},

	js.configs.recommended,

	{
		rules: {
			"no-unused-vars": "warn",
			"no-undef": "warn",
		},
	},

	eslintConfigPrettier,
];
