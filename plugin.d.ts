import { Plugin } from "esbuild";

declare const llm: () => Plugin;

export { llm, llm as default };
