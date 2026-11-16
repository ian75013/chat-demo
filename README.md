# chat-demo

English | [简体中文](README.zh-CN.md)

A static chat demo powered by the DeepSeek API. No application backend is required: the browser connects directly to the configured API service.

You can [try the app online](https://deepseek-ai.github.io/chat-demo/) or download the archive from [Releases](https://github.com/deepseek-ai/deepseek-chat-demo/releases), extract it, and double-click `index.html` to use it locally without installation or a build. Enter your API key in Settings before your first chat.

## Getting started

Install Node.js 22.12+ and pnpm, then run:

```sh
git clone https://github.com/deepseek-ai/chat-demo.git
cd chat-demo
pnpm install
pnpm dev
```

Open http://localhost:8090.

To build the static site:

```sh
pnpm build
```

The output is written to `dist/`. Deploy it to a static web server or open `dist/index.html` directly. Opening the file directly requires browser support for storage on `file://` pages and an API service that permits their cross-origin requests.

## Features

- Multiple conversations with automatic titles, renaming, and deletion; edit prompts, regenerate replies, and switch between message branches.
- Streaming replies, deep thinking, smart search, link reading, and source citations; stop generation or continue eligible replies.
- Upload, paste, or drag and drop attachments; use voice input and read replies aloud. A live audio spectrum appears in the first row of the input area while recording on mobile.
- Markdown, syntax highlighting, KaTeX math, and Mermaid diagrams.
- Simplified Chinese and English, light and dark themes, mobile layouts, location settings, and chat history import and export.

## Data and storage

Your API key and settings are stored in the browser's localStorage. Conversations and original attachments are stored in IndexedDB. Local data is isolated by browser profile and site origin. Sending messages, uploading attachments, and using speech features sends the relevant content to the configured API service.

History import and export in Settings use ZIP archives. After confirmation and successful validation, importing replaces all local conversations and attachments. Exports include conversations and locally available original images, but exclude API keys, settings, and original non-image attachments. See the [history import/export documentation (Chinese)](src/services/chat/history/README.md) for the archive format and preservation details.

Settings → Data → Delete all chats clears all local conversations, original attachments, and unsent drafts after confirmation. It stops ongoing replies and returns to a new chat. Your API key and settings are preserved; files already uploaded to the API service are not deleted.

## Development

| Command       | Description                  |
| ------------- | ---------------------------- |
| `pnpm dev`    | Start the development server |
| `pnpm build`  | Build into `dist/`           |
| `pnpm type`   | Run TypeScript type checks   |
| `pnpm lint`   | Lint with oxlint             |
| `pnpm format` | Format with oxfmt            |

[rspack.config.ts](rspack.config.ts) uses `https://api.deepseek.com` by default. Use `createConfig({ apiProvider, apiBaseUrl, apiModel, devServer })` to customize the chat server and development server proxy (`apiOrigin` is still accepted).

### Local models (Ollama and other compatible servers)

The app can also talk to any server implementing the plain Anthropic Messages API, such as Ollama (0.14 or later serves `/v1/messages`):

```sh
CHAT_API_PROVIDER=compatible CHAT_API_BASE_URL=http://127.0.0.1:11434/v1 CHAT_API_MODEL=qwen3:14b pnpm dev
```

The server can also be switched at runtime in **Settings → Data → Chat server**. With a compatible server:

- the API key is optional and sent as `Authorization: Bearer` (Ollama's CORS rules reject `x-api-key`);
- DeepSeek-only features are hidden and never called: attachments (Files API), web search, link reading, generated titles (the first question names the chat), speech, location;
- the request is reduced to the standard API: neutral system prompt, `max_tokens`, `thinking` with a budget, the date and reply language in the system prompt instead of `latest_reminder`.

### Security

- A Content Security Policy only lets the page connect to the configured server, the DeepSeek API and servers on this machine; remote images, scripts, frames and forms are blocked, so a rendered answer cannot send data elsewhere. A remote compatible server must be set at build time (`CHAT_API_BASE_URL`) to be allowed.
- Plain `http` is accepted only for servers on this machine; switching servers clears the stored API key.
- Links from search results, read pages and imported history open only if they are `http(s)`.
- History import caps entry sizes (64 MiB per file, 2 GiB in total).
- The API key stays in `localStorage`, readable by any script on the page's origin: serve the app from its own origin.

Chat uses `deepseek-flash` by default through Anthropic-compatible Messages / Files APIs. Speech features use ASR / TTS endpoints. Requests include extensions for search, link reading, titles, and `latest_reminder`, so the configured service must support the corresponding capabilities. Supported attachment formats are determined by server-side validation.

```text
src/
  app/                 Application layout, themes, and global styles
  components/          Chat, settings, Markdown, and other UI components
  i18n/                English and Chinese translations
  services/
    api/               API requests, SSE, and protocol types
    chat/              Conversations, message branches, storage, and history import/export
    markdown/          Markdown parsing, syntax highlighting, and diagrams
    speech/            Audio recording and read-aloud playback
  utils/               Shared utilities
```

## License

[MIT](LICENSE). The build copies the license to `dist/LICENSE`; include it when distributing the app. Third-party dependencies are subject to their own licenses.
