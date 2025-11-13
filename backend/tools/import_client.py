"""
Small client script to upload an Excel file to the /api/admin/questions/import endpoint.

Usage:
  python tools/import_client.py --file path/to/questions.xlsx --token <JWT_TOKEN>
"""
import argparse
import os
import requests


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True, help="Path to .xlsx file")
    parser.add_argument("--token", required=True, help="Admin JWT token for authentication")
    parser.add_argument("--url", default="http://localhost:8000/api/admin/questions/import", help="API endpoint URL")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        raise SystemExit("File not found: %s" % args.file)

    headers = {"Authorization": f"Bearer {args.token}"}
    with open(args.file, "rb") as f:
        files = {"file": (os.path.basename(args.file), f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        resp = requests.post(args.url, headers=headers, files=files)
        print("Status:", resp.status_code)
        try:
            print(resp.json())
        except Exception:
            print(resp.text)


if __name__ == "__main__":
    main()
