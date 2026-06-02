import subprocess
import os

cwd = r"c:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool"

def run_cmd(cmd):
    print(f"Running: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    return {
        "stdout": res.stdout,
        "stderr": res.stderr,
        "returncode": res.returncode
    }

# Run git status
status = run_cmd("git status")

# Write output to git_output.txt
output_path = os.path.join(cwd, "git_output.txt")
with open(output_path, "w", encoding="utf-8") as f:
    f.write("=== GIT STATUS ===\n")
    f.write(f"Return Code: {status['returncode']}\n")
    f.write("--- STDOUT ---\n")
    f.write(status["stdout"])
    f.write("\n--- STDERR ---\n")
    f.write(status["stderr"])
    f.write("\n")

print("Done writing git status output.")
