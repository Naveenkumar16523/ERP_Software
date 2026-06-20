import urllib.parse
import getpass

# Run this locally - never share the output
password = getpass.getpass("Enter your MongoDB password (input hidden): ")
encoded = urllib.parse.quote_plus(password)
print(f"Encoded password: {encoded}")
