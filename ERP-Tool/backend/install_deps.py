import subprocess
import sys

def install(package):
    with open("install_out.txt", "w") as f:
        f.write(f"Installing {package}...\n")
        try:
            result = subprocess.run(
                [sys.executable, "-m", "pip", "install", package, "--no-input", "--disable-pip-version-check"],
                stdout=f,
                stderr=subprocess.STDOUT,
                text=True,
                timeout=120
            )
            f.write(f"\nReturn code: {result.returncode}\n")
        except Exception as e:
            f.write(f"\nException: {e}\n")

if __name__ == "__main__":
    install("psycopg2-binary")
