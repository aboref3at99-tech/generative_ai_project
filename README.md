# Generative AI Project Template

A structured template for building robust generative AI applications, with modular organization and best practices built-in.

![genai_project](https://github.com/honestsoul/generative_ai_project/blob/96dae125f58ede47f1bc3034790498f103903772/examples/genai_project.jpg)



## 🌟 Features

- Modular project structure for scalability
- Pre-configured support for multiple LLM providers (Claude, GPT)
- Built-in prompt engineering utilities
- Rate limiting and token management
- Robust error handling
- Caching mechanism for API responses
- Example implementations and notebooks

## 📁 Project Structure

```
generative_ai_project/
├── config/                  # Configuration directory
│   ├── __init__.py
│   ├── model_config.yaml    # Model-specific configurations
│   ├── prompt_templates.yaml # Prompt templates
│   └── logging_config.yaml  # Logging settings
│
├── src/                     # Source code
│   ├── llm/                # LLM clients
│   │   ├── __init__.py
│   │   ├── base.py         # Base LLM client
│   │   ├── claude_client.py # Anthropic Claude client
│   │   ├── openai_client.py # OpenAI GPT client
│   │   └── utils.py        # LLM factory and utilities
│   │
│   ├── prompt_engineering/ # Prompt engineering tools
│   │   ├── __init__.py
│   │   ├── templates.py    # Template management
│   │   ├── few_shot.py     # Few-shot prompt utilities
│   │   └── chain.py        # Prompt chaining logic
│   │
│   ├── utils/              # Utility functions
│   │   ├── __init__.py
│   │   ├── rate_limiter.py # API rate limiting and retries
│   │   ├── token_counter.py # Token counting and usage tracking
│   │   ├── cache.py        # Response caching with TTL
│   │   └── logger.py       # Logging utilities
│   │
│   ├── handlers/           # Error handling
│   │   ├── __init__.py
│   │   └── error_handler.py # Custom exceptions and handlers
│   │
│   └── database/           # Database integration
│       ├── __init__.py
│       └── supabase_client.py # Supabase database client
│
├── data/                   # Data directory
│   ├── cache/             # Cache storage
│   ├── prompts/           # Prompt storage
│   ├── outputs/           # Output storage
│   └── embeddings/        # Embedding storage
│
├── examples/              # Example implementations
│   ├── basic_completion.py # Simple LLM completion
│   ├── chat_session.py     # Multi-turn conversation
│   └── chain_prompts.py    # Prompt chaining example
│
├── notebooks/            # Jupyter notebooks
│   ├── prompt_testing.ipynb
│   ├── response_analysis.ipynb
│   └── model_experimentation.ipynb
│
├── .env                   # Environment variables
└── package.json          # Node.js dependencies (for any web integration)
```

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/generative_ai_project.git
cd generative_ai_project
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure your environment:
   - Edit `.env` file with your API keys:
     ```
     CLAUDE_API_KEY=your_claude_api_key_here
     OPENAI_API_KEY=your_openai_api_key_here
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_SUPABASE_ANON_KEY=your_supabase_key
     ```
   - Edit `config/model_config.yaml` with model parameters
   - Edit `config/prompt_templates.yaml` with your prompt templates

4. Run example scripts:
```bash
python3 examples/basic_completion.py
python3 examples/chat_session.py
python3 examples/chain_prompts.py
```

5. Explore notebooks in `notebooks/` for experimentation

## 🎯 Usage Examples

### Basic LLM Completion

```python
from src.llm.utils import LLMFactory
import os

client = LLMFactory.create_client(
    provider="claude",
    api_key=os.getenv("CLAUDE_API_KEY"),
    model_name="claude-3-5-sonnet-20241022"
)

response = client.complete(
    prompt="Explain quantum computing",
    system_prompt="You are a physics expert"
)
print(response.content)
```

### Using Prompt Templates

```python
from src.prompt_engineering import template_manager

prompts = template_manager.format_prompt("code_review", code_snippet="...")
print(prompts)
```

### Prompt Chaining

```python
from src.prompt_engineering import PromptChain

chain = PromptChain(client)
chain.add_step("brainstorm", "Generate ideas for: {input}")
chain.add_step("evaluate", "Pick the best idea: {input}")
result = chain.execute("Create a productivity app")
```

### Caching Responses

```python
from src.utils import ResponseCache

cache = ResponseCache()
cached = cache.get("my_prompt")
if not cached:
    response = client.complete(prompt="my_prompt")
    cache.set("my_prompt", response.content)
```

### Rate Limiting

```python
from src.utils import RateLimiter

limiter = RateLimiter(requests_per_minute=60)
for _ in range(100):
    limiter.wait_if_needed()
    # Make API call
```

## 📘 Documentation

### Configuration

- `model_config.yaml`: Configure API keys and model parameters
- `prompt_templates.yaml`: Define reusable prompt templates
- `logging_config.yaml`: Configure logging behavior
- `.env`: Environment variables for sensitive data (API keys, database URLs)

### Key Components

1. **LLM Clients** (`src/llm/`)
   - `BaseLLMClient`: Abstract base class for all LLM providers
   - `ClaudeClient`: Anthropic Claude implementation
   - `OpenAIClient`: OpenAI GPT implementation
   - `LLMFactory`: Factory pattern for client creation

2. **Prompt Engineering** (`src/prompt_engineering/`)
   - `PromptTemplate`: Reusable prompt templates with variable substitution
   - `PromptTemplateManager`: Loads and manages templates from config
   - `FewShotExample`: Single example for few-shot learning
   - `FewShotPrompt`: Builder for few-shot prompts with multiple examples
   - `PromptChain`: Chains multiple prompts together for complex workflows

3. **Utilities** (`src/utils/`)
   - `RateLimiter`: Prevents API rate limit violations
   - `RetryHandler`: Exponential backoff retry logic
   - `TokenCounter`: Estimates tokens from text
   - `TokenUsageTracker`: Tracks API usage and costs
   - `ResponseCache`: Caches LLM responses with TTL
   - `Logger`: Configured logging setup

4. **Database Integration** (`src/database/`)
   - `SupabaseConnection`: Singleton database connection
   - `ConversationHistory`: Stores and retrieves chat histories
   - `APIUsageTracker`: Logs API calls and usage metrics

5. **Error Handling** (`src/handlers/`)
   - Custom exception classes
   - Error handling decorators
   - Input validation utilities

## 🛠️ Development

### Best Practices

1. Keep configuration in YAML files
2. Implement proper error handling
3. Use rate limiting for APIs
4. Maintain separation between model clients
5. Cache results when appropriate
6. Document your code
7. Use notebooks for experimentation

### Tips

- Follow modular design principles
- Write tests for new components
- Use proper version control
- Keep documentation updated
- Monitor API usage and limits

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

- **Brij Kishore Pandey**

## 📧 Contact

For any queries, reach out to:
- GitHub: [@honestsoul](https://github.com/honestsoul)
- Email: brij.pydata@gmail.com

---
⭐ If you find this template useful, please consider giving it a star!
