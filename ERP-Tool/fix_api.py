import re

file_path = r"c:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\frontend\src\utils\api.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix getHealth
health_orig = """  async getHealth() {
    try {
      const res = await fetch(`${API_URL}/api/v1/health`);
      if (res.ok) {
        const data = await res.json();
        useERPStore.getState().setDbLive(data.status === 'UP');
        return data;
      }
    } catch {
      useERPStore.getState().setDbLive(false);
    }
    return { status: 'DOWN' };
  },"""

health_new = """  async getHealth() {
    try {
      const res = await fetch(`${API_URL}/api/v1/health`);
      useERPStore.getState().setDbLive(true); // Network is reachable
      if (res.ok) {
        const data = await res.json();
        useERPStore.getState().setDbLive(data.status === 'UP');
        return data;
      }
    } catch {
      useERPStore.getState().setDbLive(false); // Genuine network failure
    }
    return { status: 'DOWN' };
  },"""

content = content.replace(health_orig, health_new)

# General pattern for single line simple fallbacks
# Pattern: try { return await request('...'); }
#          catch { return useERPStore.getState()....; }
p1 = re.compile(r"try\s*\{\s*return await request\((.*?)\);\s*\}\s*catch\s*\{\s*return useERPStore.*?;\s*\}", re.DOTALL)
content = p1.sub(r"return request(\1);", content)

# Pattern for add/create fallbacks
# try { return await request('/...', { method: 'POST', body: JSON.stringify(item) }); }
# catch { useERPStore.getState().addItem(item); return item; }
p2 = re.compile(r"try\s*\{\s*return await request\((.*?)\);\s*\}\s*catch(?:\s*\(e\))?\s*\{\s*(?:if\s*\(.*?\)\s*throw e;\s*)?(?:const \w+\s*=\s*\{.*?\};\s*)?(?:const \w+\s*=\s*useERPStore.*?;\s*)?useERPStore\.getState\(\)\..*?;\s*return .*?;\s*\}", re.DOTALL)
content = p2.sub(r"return request(\1);", content)

# Pattern for update fallbacks
# try { return await request('/...', { method: 'PATCH', body: JSON.stringify({ status }) }); }
# catch { useERPStore.getState().updateItemStatus(id, status); }
p3 = re.compile(r"try\s*\{\s*return await request\((.*?)\);\s*\}\s*catch\s*\{\s*useERPStore\.getState\(\)\..*?;\s*\}", re.DOTALL)
content = p3.sub(r"return request(\1);", content)

# Specific custom try/catches like createJournalEntry
custom_try_catch = re.compile(r"try\s*\{\s*const res = await request\((.*?)\);\s*return res\.entry \|\| res;\s*\}\s*catch\s*\{\s*useERPStore.*?return .*?;\s*\}", re.DOTALL)
content = custom_try_catch.sub(r"""const res = await request(\1);
        return res.entry || res;""", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("api.js patched.")
