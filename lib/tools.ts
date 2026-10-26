import {
  si1password,
  siBlender,
  siClaude,
  siCursor,
  siDeepseek,
  siDocker,
  siElevenlabs,
  siFigma,
  siGimp,
  siGit,
  siGithub,
  siGithubcopilot,
  siGooglegemini,
  siGrafana,
  siHuggingface,
  siJira,
  siJupyter,
  siKeras,
  siKubernetes,
  siLangchain,
  siLibreoffice,
  siLinear,
  siMeta,
  siMistralai,
  siNextdotjs,
  siNodedotjs,
  siNotion,
  siObsstudio,
  siOllama,
  siPerplexity,
  siPostgresql,
  siPython,
  siPytorch,
  siQwen,
  siScikitlearn,
  siTensorflow,
  siVllm,
  siVscodium,
  siZoom,
  type SimpleIcon,
} from "simple-icons";

export type ToolKind = "open" | "paid";
export type ToolGroup = "ai" | "other";

export type Tool = {
  name: string;
  kind: ToolKind;
  group: ToolGroup;
  category: string;
  description: string;
  /** Open source: the licence. Closed and paid: how it is priced. */
  licence: string;
  url: string;
  /** Brand logo from Simple Icons. Tools without one get a lettered tile. */
  icon?: SimpleIcon;
};

export const TOOL_KINDS: { id: ToolKind; label: string; lead: string }[] = [
  { id: "open", label: "Open source", lead: "Free to use, with the source code public. Check the licence before shipping it inside client work." },
  { id: "paid", label: "Closed & paid", lead: "Commercial products. Ask IT for a seat before signing up, so licences stay on the company account." },
];

export const TOOL_GROUPS: { id: ToolGroup; label: string }[] = [
  { id: "ai", label: "AI tools" },
  { id: "other", label: "Other tools" },
];

export const TOOLS: Tool[] = [
  // Open source — AI
  { name: "Ollama", kind: "open", group: "ai", category: "Local LLM runner", description: "Download and run open models such as Llama, Qwen and Mistral on your own machine.", licence: "MIT", url: "https://ollama.com", icon: siOllama },
  { name: "Hugging Face Transformers", kind: "open", group: "ai", category: "Model library", description: "Thousands of pretrained models for text, vision and audio, with one Python API.", licence: "Apache-2.0", url: "https://github.com/huggingface/transformers", icon: siHuggingface },
  { name: "PyTorch", kind: "open", group: "ai", category: "Deep learning", description: "The framework most research and production models are trained with.", licence: "BSD-3-Clause", url: "https://pytorch.org", icon: siPytorch },
  { name: "TensorFlow", kind: "open", group: "ai", category: "Deep learning", description: "End-to-end platform for training and serving machine learning models.", licence: "Apache-2.0", url: "https://www.tensorflow.org", icon: siTensorflow },
  { name: "Keras", kind: "open", group: "ai", category: "Deep learning", description: "High-level API for building neural networks quickly.", licence: "Apache-2.0", url: "https://keras.io", icon: siKeras },
  { name: "LangChain", kind: "open", group: "ai", category: "LLM apps & agents", description: "Building blocks for chains, agents and retrieval over your own data.", licence: "MIT", url: "https://www.langchain.com", icon: siLangchain },
  { name: "vLLM", kind: "open", group: "ai", category: "Model serving", description: "Fast, memory-efficient serving for large language models.", licence: "Apache-2.0", url: "https://github.com/vllm-project/vllm", icon: siVllm },
  { name: "llama.cpp", kind: "open", group: "ai", category: "Local inference", description: "Runs quantised LLMs on CPUs and laptops in plain C/C++.", licence: "MIT", url: "https://github.com/ggml-org/llama.cpp" },
  { name: "Llama", kind: "open", group: "ai", category: "Open-weight models", description: "Meta's family of open-weight language models.", licence: "Llama Community Licence", url: "https://www.llama.com", icon: siMeta },
  { name: "Mistral", kind: "open", group: "ai", category: "Open-weight models", description: "Efficient open models from Mistral AI, several under Apache-2.0.", licence: "Apache-2.0 (open models)", url: "https://mistral.ai", icon: siMistralai },
  { name: "DeepSeek", kind: "open", group: "ai", category: "Open-weight models", description: "Strong reasoning and coding models with openly published weights.", licence: "MIT", url: "https://github.com/deepseek-ai", icon: siDeepseek },
  { name: "Qwen", kind: "open", group: "ai", category: "Open-weight models", description: "Alibaba's multilingual model family, good with Arabic and English.", licence: "Apache-2.0 (most models)", url: "https://github.com/QwenLM", icon: siQwen },
  { name: "Whisper", kind: "open", group: "ai", category: "Speech to text", description: "Accurate transcription and translation for meetings and audio.", licence: "MIT", url: "https://github.com/openai/whisper" },
  { name: "ComfyUI", kind: "open", group: "ai", category: "Image generation", description: "Node-based workflows for diffusion image and video models.", licence: "GPL-3.0", url: "https://github.com/comfyanonymous/ComfyUI" },
  { name: "Jupyter", kind: "open", group: "ai", category: "Notebooks", description: "Interactive notebooks for data exploration and experiments.", licence: "BSD-3-Clause", url: "https://jupyter.org", icon: siJupyter },
  { name: "scikit-learn", kind: "open", group: "ai", category: "Machine learning", description: "Classic machine learning: classification, regression and clustering.", licence: "BSD-3-Clause", url: "https://scikit-learn.org", icon: siScikitlearn },

  // Open source — other
  { name: "Git", kind: "open", group: "other", category: "Version control", description: "Source control for every repository we own.", licence: "GPL-2.0", url: "https://git-scm.com", icon: siGit },
  { name: "VSCodium", kind: "open", group: "other", category: "Code editor", description: "The open source build of VS Code, without Microsoft telemetry.", licence: "MIT", url: "https://vscodium.com", icon: siVscodium },
  { name: "Node.js", kind: "open", group: "other", category: "Runtime", description: "JavaScript runtime for our web apps, services and build tooling.", licence: "MIT", url: "https://nodejs.org", icon: siNodedotjs },
  { name: "Next.js", kind: "open", group: "other", category: "Web framework", description: "React framework behind the website and this portal.", licence: "MIT", url: "https://nextjs.org", icon: siNextdotjs },
  { name: "Python", kind: "open", group: "other", category: "Language", description: "Data work, automation scripts and back-end services.", licence: "PSF", url: "https://www.python.org", icon: siPython },
  { name: "PostgreSQL", kind: "open", group: "other", category: "Database", description: "Relational database for product and client workloads.", licence: "PostgreSQL", url: "https://www.postgresql.org", icon: siPostgresql },
  { name: "Docker Engine", kind: "open", group: "other", category: "Containers", description: "Builds and runs the containers we ship to every environment.", licence: "Apache-2.0", url: "https://docs.docker.com/engine/", icon: siDocker },
  { name: "Kubernetes", kind: "open", group: "other", category: "Orchestration", description: "Runs and scales our services in production.", licence: "Apache-2.0", url: "https://kubernetes.io", icon: siKubernetes },
  { name: "Grafana", kind: "open", group: "other", category: "Observability", description: "Dashboards and alerts for system health.", licence: "AGPL-3.0", url: "https://grafana.com/oss/grafana/", icon: siGrafana },
  { name: "LibreOffice", kind: "open", group: "other", category: "Office suite", description: "Documents, spreadsheets and slides without a licence fee.", licence: "MPL-2.0", url: "https://www.libreoffice.org", icon: siLibreoffice },
  { name: "GIMP", kind: "open", group: "other", category: "Image editing", description: "Photo retouching and image editing.", licence: "GPL-3.0", url: "https://www.gimp.org", icon: siGimp },
  { name: "Blender", kind: "open", group: "other", category: "3D & video", description: "3D modelling, animation and video editing.", licence: "GPL-2.0+", url: "https://www.blender.org", icon: siBlender },
  { name: "OBS Studio", kind: "open", group: "other", category: "Recording", description: "Screen recording and live streaming for demos and training.", licence: "GPL-2.0", url: "https://obsproject.com", icon: siObsstudio },

  // Closed & paid — AI
  { name: "ChatGPT", kind: "paid", group: "ai", category: "AI assistant", description: "OpenAI's assistant for writing, analysis and coding help.", licence: "Free tier + paid plans", url: "https://chatgpt.com" },
  { name: "Claude", kind: "paid", group: "ai", category: "AI assistant", description: "Anthropic's assistant for long documents, analysis and code.", licence: "Free tier + paid plans", url: "https://claude.ai", icon: siClaude },
  { name: "Gemini", kind: "paid", group: "ai", category: "AI assistant", description: "Google's assistant, built into Gmail, Docs and Drive.", licence: "Free tier + paid plans", url: "https://gemini.google.com", icon: siGooglegemini },
  { name: "GitHub Copilot", kind: "paid", group: "ai", category: "Coding assistant", description: "AI pair programmer inside the editor and on pull requests.", licence: "Paid seats", url: "https://github.com/features/copilot", icon: siGithubcopilot },
  { name: "Cursor", kind: "paid", group: "ai", category: "AI code editor", description: "Code editor built around AI chat, edits and agents.", licence: "Free tier + paid plans", url: "https://cursor.com", icon: siCursor },
  { name: "Perplexity", kind: "paid", group: "ai", category: "AI search", description: "Answers with sources, for research and quick fact checks.", licence: "Free tier + paid plans", url: "https://www.perplexity.ai", icon: siPerplexity },
  { name: "Midjourney", kind: "paid", group: "ai", category: "Image generation", description: "High-quality images for concepts, mood boards and marketing.", licence: "Subscription", url: "https://www.midjourney.com" },
  { name: "ElevenLabs", kind: "paid", group: "ai", category: "Voice & audio", description: "Natural text-to-speech and voice-overs in many languages.", licence: "Free tier + paid plans", url: "https://elevenlabs.io", icon: siElevenlabs },

  // Closed & paid — other
  { name: "GitHub", kind: "paid", group: "other", category: "Code hosting", description: "Repositories, pull requests, reviews and CI.", licence: "Team plan", url: "https://github.com", icon: siGithub },
  { name: "Figma", kind: "paid", group: "other", category: "Design", description: "Product design, prototypes and the design system.", licence: "Paid seats", url: "https://www.figma.com", icon: siFigma },
  { name: "Microsoft 365", kind: "paid", group: "other", category: "Email & office", description: "Email, calendar, Teams, documents and file sharing.", licence: "Business plan", url: "https://www.microsoft.com/microsoft-365" },
  { name: "Slack", kind: "paid", group: "other", category: "Messaging", description: "Day-to-day team chat and channel updates.", licence: "Paid plan", url: "https://slack.com" },
  { name: "Jira", kind: "paid", group: "other", category: "Project tracking", description: "Backlogs, sprints and delivery tracking.", licence: "Cloud plan", url: "https://www.atlassian.com/software/jira", icon: siJira },
  { name: "Linear", kind: "paid", group: "other", category: "Issue tracking", description: "Fast issue tracking and product roadmaps.", licence: "Paid plan", url: "https://linear.app", icon: siLinear },
  { name: "Notion", kind: "paid", group: "other", category: "Docs & wiki", description: "Team wiki, meeting notes and project docs.", licence: "Paid plan", url: "https://www.notion.com", icon: siNotion },
  { name: "Zoom", kind: "paid", group: "other", category: "Meetings", description: "Client calls and webinars.", licence: "Paid plan", url: "https://zoom.us", icon: siZoom },
  { name: "1Password", kind: "paid", group: "other", category: "Password manager", description: "Shared vaults for passwords and secrets.", licence: "Business plan", url: "https://1password.com", icon: si1password },
  { name: "Adobe Creative Cloud", kind: "paid", group: "other", category: "Creative suite", description: "Photoshop, Illustrator, Premiere and the rest of Adobe's apps.", licence: "Named seats", url: "https://www.adobe.com/creativecloud.html" },
];
