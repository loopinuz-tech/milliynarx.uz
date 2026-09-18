import os
from dulwich.repo import Repo
from dulwich import porcelain

repo_path = r"c:\Users\hp\.gemini\Desktop\Ai Hackaton\milliynarx"
repo = Repo(repo_path)

# Collect all files
files_to_add = []
for root, dirs, files in os.walk(repo_path):
    if '.git' in dirs:
        dirs.remove('.git')
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '__pycache__' in dirs:
        dirs.remove('__pycache__')
    if 'dist' in dirs:
        dirs.remove('dist')
        
    for f in files:
        if f in ['.env', 'milliy_narx.db', 'scratch_test_status.py', 'check_files.py', 'execute_push.py']:
            continue
        full_p = os.path.join(root, f)
        rel_p = os.path.relpath(full_p, repo_path).replace('\\', '/')
        files_to_add.append(rel_p)

print(f"Staging {len(files_to_add)} files...")
porcelain.add(repo, paths=files_to_add)

author_sig = "Ilyos Khudayberganov <ilyoskhudayberganov@gmail.com>"
commit_id = porcelain.commit(
    repo,
    message="Initial commit: Milliy Narx bozor narxlari tahlil va monitoring platformasi",
    author=author_sig,
    committer=author_sig
)
print(f"Committed successfully! Commit hash: {commit_id.decode() if isinstance(commit_id, bytes) else commit_id}")

# Ensure refs/heads/main exists
repo.refs[b"refs/heads/main"] = commit_id
repo.refs.set_symbolic_ref(b"HEAD", b"refs/heads/main")
print("Branch 'main' configured and set as HEAD.")
