import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs", globals: globals.jest}},
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  {
    rules:{
      "no-unused-vars": "off"
    }
  }
];