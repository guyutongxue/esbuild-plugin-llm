// @ts-check

/**
 * The esbuild plugin that connects to the Gemini API.
 * @type {() => import('esbuild').Plugin}
 */
export const llm = () => ({
  name: "llm",
  setup(build) {
    // 1. Intercept imports to 'virtual:llm'
    build.onResolve({ filter: /^virtual:llm$/ }, (args) => {
      // Check if the import has the required 'with { prompt: "..." }' attribute
      if (!args.with || !args.with.prompt) {
        return {
          errors: [
            {
              text: "Import from 'virtual:llm' must include a 'with { prompt: \"...\" }' attribute.",
            },
          ],
        };
      }

      // Pass the prompt to the onLoad hook via 'pluginData'
      return {
        path: "llm-generated-code", // This path is virtual
        namespace: "llm-ns",
        pluginData: { prompt: args.with.prompt },
      };
    });

    // 2. Load modules in our virtual namespace
    build.onLoad({ filter: /.*/, namespace: "llm-ns" }, async (args) => {
      const userPrompt = args.pluginData.prompt;
      const apiKey = process.env.API_KEY; // Get API key from environment

      if (!apiKey) {
        return {
          errors: [
            {
              text: "API_KEY environment variable is not set.",
              detail:
                "This plugin requires a Google AI Studio API key (API_KEY) to be set in your environment.",
            },
          ],
        };
      }

      // This "meta-prompt" instructs the LLM to *only* return code.
      const systemPrompt = `You are a code generation assistant. Based on the user's prompt, return *only* the raw JavaScript code they asked for. Do not include markdown fences (like \`\`\`javascript), explanations, or any other text. Just the code.`;

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          // Force plain text output
          responseMimeType: "text/plain",
        },
      };

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          return {
            errors: [
              {
                text: `Gemini API request failed with status ${response.status}`,
                detail: errorBody,
              },
            ],
          };
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (!candidate || !candidate.content?.parts?.[0]?.text) {
          return {
            errors: [
              { text: "No valid code content received from Gemini API." },
            ],
          };
        }

        // This is the raw JavaScript code from the LLM
        const generatedCode = candidate.content.parts[0].text;

        // Return the generated code to esbuild
        return {
          contents: generatedCode,
          loader: "js",
          resolveDir: "./", // Set a base directory for any relative imports
        };
      } catch (error) {
        return {
          errors: [
            {
              text: "Failed to fetch from Gemini API",
              detail: /** @type{Error} */ (error).message,
            },
          ],
        };
      }
    });
  },
});

export default llm;
