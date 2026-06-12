import requests
import json
import re
from datetime import datetime, date

class SupabaseHTTPError(Exception):
    pass

class DummyInfo:
    def __init__(self):
        self.server_version = 150000

class SupabaseHTTPCursor:
    def __init__(self, connection):
        self.connection = connection
        self.description = None
        self.rowcount = -1
        self._results = []
        self._index = 0

    def execute(self, operation, parameters=None):
        # Build the final SQL query after client-side parameter interpolation
        query = operation
        if parameters:
            query = self._bind_parameters(operation, parameters)
        
        # Unescape %% to % (standard psycopg2 escape rule)
        query = query.replace("%%", "%")

        # Detect if the query is a SELECT/query that returns rows
        is_select = self._is_select_query(query)

        # Execute query on Supabase via PostgREST RPC
        url = f"{self.connection.supabase_url}/rest/v1/rpc/exec_sql"
        headers = {
            "apikey": self.connection.service_key,
            "Authorization": f"Bearer {self.connection.service_key}",
            "Content-Type": "application/json",
            "Prefer": "params=single-object"
        }
        payload = {
            "query_text": query,
            "is_select": is_select
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=20)
            if response.status_code != 200:
                raise SupabaseHTTPError(f"HTTP {response.status_code}: {response.text}")

            res_data = response.json()

            # Handle explicit error returned from PL/pgSQL function
            if isinstance(res_data, dict) and "error" in res_data:
                raise SupabaseHTTPError(f"Postgres Error: {res_data['error']}\nSQL: {query}")

            # Process select vs non-select results
            if isinstance(res_data, list):
                # SELECT/query that returned rows
                self._results = []
                if len(res_data) > 0:
                    # Determine columns from keys of the first row
                    first_row = res_data[0]
                    cols = list(first_row.keys())
                    self.description = [(col, None, None, None, None, None, None) for col in cols]
                    for row in res_data:
                        self._results.append(tuple(row[col] for col in cols))
                else:
                    self.description = []
                self.rowcount = len(self._results)
            elif isinstance(res_data, dict) and "affected_rows" in res_data:
                # DML query (INSERT, UPDATE, DELETE)
                self._results = []
                self.description = None
                self.rowcount = res_data["affected_rows"]
            else:
                self._results = []
                self.description = None
                self.rowcount = 0

            self._index = 0

        except Exception as e:
            if not isinstance(e, SupabaseHTTPError):
                raise SupabaseHTTPError(str(e)) from e
            raise e

    def executemany(self, operation, seq_of_parameters):
        for params in seq_of_parameters:
            self.execute(operation, params)

    def fetchone(self):
        if self._index >= len(self._results):
            return None
        row = self._results[self._index]
        self._index += 1
        return row

    def fetchall(self):
        rows = self._results[self._index:]
        self._index = len(self._results)
        return rows

    def fetchmany(self, size=None):
        if size is None:
            size = 1
        end = min(self._index + size, len(self._results))
        rows = self._results[self._index:end]
        self._index = end
        return rows

    def close(self):
        pass

    def __iter__(self):
        return self

    def __next__(self):
        row = self.fetchone()
        if row is None:
            raise StopIteration
        return row

    def _is_select_query(self, query):
        """Uses regex to check if the query starts with a query keyword, ignoring leading whitespace and comments."""
        clean_query = query.strip()
        pattern = r'^(?:--.*?\n|\/\*.*?\*\/|\s)*(?:SELECT|WITH|SHOW|EXPLAIN)'
        return bool(re.match(pattern, clean_query, re.IGNORECASE | re.DOTALL))

    def _bind_parameters(self, sql, parameters):
        if isinstance(parameters, dict):
            # Replace %(name)s with escaped value
            for name, val in parameters.items():
                escaped_val = self._escape_value(val)
                # Ensure we escape '%' signs in search/replace pattern
                sql = sql.replace(f"%({name})s", escaped_val)
            return sql
        elif isinstance(parameters, (list, tuple)):
            # Replace %s in order
            parts = sql.split("%s")
            result = []
            for i, part in enumerate(parts):
                result.append(part)
                if i < len(parameters):
                    result.append(self._escape_value(parameters[i]))
            return "".join(result)
        return sql

    def _escape_value(self, val):
        if val is None:
            return "NULL"
        elif isinstance(val, bool):
            return "TRUE" if val else "FALSE"
        elif isinstance(val, (int, float)):
            return str(val)
        elif isinstance(val, (datetime, date)):
            return f"'{val.isoformat()}'"
        elif isinstance(val, (dict, list)):
            # JSON serialization for dict/list parameter types
            serialized = json.dumps(val).replace("'", "''")
            return f"'{serialized}'::jsonb"
        elif isinstance(val, str):
            escaped = val.replace("'", "''")
            return f"'{escaped}'"
        else:
            escaped = str(val).replace("'", "''")
            return f"'{escaped}'"

class SupabaseHTTPConnection:
    def __init__(self, supabase_url, service_key):
        self.supabase_url = supabase_url
        self.service_key = service_key
        self.autocommit = False
        self.closed = 0
        self.info = DummyInfo()
        self.server_version = 150000

    def cursor(self):
        return SupabaseHTTPCursor(self)

    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        pass

    def set_isolation_level(self, level):
        pass

    def set_client_encoding(self, encoding):
        pass

def get_supabase_http_connection(supabase_url, service_key):
    return SupabaseHTTPConnection(supabase_url, service_key)
