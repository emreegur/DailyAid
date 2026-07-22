import os
from huggingface_hub import hf_hub_download

print("Downloading Phi-3 GGUF...")
file_path = hf_hub_download(
    repo_id="bartowski/Phi-3-mini-4k-instruct-v0.3-GGUF",
    filename="Phi-3-mini-4k-instruct-v0.3-Q4_K_M.gguf",
    local_dir="models"
)
print(f"Downloaded to {file_path}")
