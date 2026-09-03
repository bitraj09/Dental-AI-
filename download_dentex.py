from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="ibrahimhamamci/DENTEX",
    repo_type="dataset",
    local_dir="dentex_data"
)