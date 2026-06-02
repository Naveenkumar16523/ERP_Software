import re

with open("index.css", "r") as f:
    css = f.read()

replacements = [
    (
        ".btn-secondary {\n  background-color: rgba(255, 255, 255, 0.03);\n  color: hsl(var(--text-primary));\n  border: 1px solid var(--glass-border);\n}\n\n.btn-secondary:hover {\n  background-color: rgba(255, 255, 255, 0.08);\n  box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);\n}",
        ".btn-secondary {\n  background-color: hsl(var(--bg-tertiary));\n  color: hsl(var(--text-primary));\n  border: 1px solid hsl(var(--border-light));\n}\n\n.btn-secondary:hover {\n  background-color: hsl(var(--border-medium));\n  box-shadow: var(--shadow-sm);\n}"
    ),
    (
        ".form-control {\n  font-family: var(--font-sans);\n  font-size: 20px;\n  padding: 10px 14px;\n  border-radius: var(--radius-default);\n  background-color: rgba(0, 0, 0, 0.2);\n  border: 1px solid var(--glass-border);\n  color: hsl(var(--text-primary));\n  outline: none;\n  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);\n}\n\n.form-control:focus {\n  border-color: #4cd7f6;\n  box-shadow: 0 0 0 2px rgba(4, 209, 211, 0.2);\n}",
        ".form-control {\n  font-family: var(--font-sans);\n  font-size: 20px;\n  padding: 10px 14px;\n  border-radius: var(--radius-default);\n  background-color: hsl(var(--bg-secondary));\n  border: 1px solid hsl(var(--border-light));\n  color: hsl(var(--text-primary));\n  outline: none;\n  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);\n}\n\n.form-control:focus {\n  border-color: hsl(var(--primary));\n  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);\n}"
    ),
    (
        "/* Global Form Input Overrides */\ninput[type=\"text\"], input[type=\"number\"], input[type=\"password\"], input[type=\"email\"], input[type=\"date\"], select, textarea {\n  background-color: rgba(0, 0, 0, 0.3) !important;\n  border: 1px solid rgba(255, 255, 255, 0.08) !important;\n  color: #dae2fd !important;\n  border-radius: var(--radius-default) !important;\n  transition: all var(--transition-fast) !important;\n}\n\ninput[type=\"text\"]::placeholder, input[type=\"number\"]::placeholder, input[type=\"password\"]::placeholder, input[type=\"email\"]::placeholder, textarea::placeholder {\n  color: rgba(199, 196, 216, 0.5) !important;\n}\n\ninput[type=\"text\"]:focus, input[type=\"number\"]:focus, input[type=\"password\"]:focus, input[type=\"email\"]:focus, input[type=\"date\"]:focus, select:focus, textarea:focus {\n  border-color: #4cd7f6 !important;\n  box-shadow: 0 0 0 2px rgba(76, 215, 246, 0.2) !important;\n  outline: none !important;\n}",
        "/* Global Form Input Overrides */\ninput[type=\"text\"], input[type=\"number\"], input[type=\"password\"], input[type=\"email\"], input[type=\"date\"], select, textarea {\n  background-color: hsl(var(--bg-secondary)) !important;\n  border: 1px solid hsl(var(--border-medium)) !important;\n  color: hsl(var(--text-primary)) !important;\n  border-radius: var(--radius-default) !important;\n  transition: all var(--transition-fast) !important;\n}\n\ninput[type=\"text\"]::placeholder, input[type=\"number\"]::placeholder, input[type=\"password\"]::placeholder, input[type=\"email\"]::placeholder, textarea::placeholder {\n  color: hsl(var(--text-tertiary)) !important;\n}\n\ninput[type=\"text\"]:focus, input[type=\"number\"]:focus, input[type=\"password\"]:focus, input[type=\"email\"]:focus, input[type=\"date\"]:focus, select:focus, textarea:focus {\n  border-color: hsl(var(--primary)) !important;\n  box-shadow: 0 0 0 2px hsl(var(--primary-light)) !important;\n  outline: none !important;\n}"
    ),
    (
        "/* Sidebar Nav active styles & indicator */\n.sidebar-active-tab {\n  position: relative;\n  background-color: rgba(255, 255, 255, 0.05) !important;\n  color: #c3c0ff !important;\n  border-left: 4px solid #4f46e5 !important;\n  border-radius: 0 var(--radius-default) var(--radius-default) 0 !important;\n}",
        "/* Sidebar Nav active styles & indicator */\n.sidebar-active-tab {\n  position: relative;\n  background-color: hsl(var(--primary) / 0.1) !important;\n  color: hsl(var(--primary)) !important;\n  border-left: 4px solid hsl(var(--primary)) !important;\n  border-radius: 0 var(--radius-default) var(--radius-default) 0 !important;\n}\n\nhtml[data-theme='dark'] .sidebar-active-tab {\n  background-color: rgba(255, 255, 255, 0.05) !important;\n  color: hsl(var(--primary-light)) !important;\n}"
    ),
    (
        "  background: rgba(11, 19, 38, 0.95);\n  backdrop-filter: blur(20px);\n  -webkit-backdrop-filter: blur(20px);\n  border-right: 1px solid rgba(255,255,255,0.06);",
        "  background: hsl(var(--bg-primary) / 0.95);\n  backdrop-filter: blur(20px);\n  -webkit-backdrop-filter: blur(20px);\n  border-right: 1px solid hsl(var(--border-light));"
    ),
    (
        "  border-bottom: 1px solid rgba(255,255,255,0.06);\n  display: flex;\n  align-items: center;",
        "  border-bottom: 1px solid hsl(var(--border-light));\n  display: flex;\n  align-items: center;"
    ),
    (
        ".sidebar-item:hover {\n  background: rgba(255,255,255,0.05);\n}",
        ".sidebar-item:hover {\n  background: hsl(var(--bg-secondary));\n}"
    ),
    (
        ".sidebar-item.active {\n  background: rgba(79, 70, 229, 0.15);\n}",
        ".sidebar-item.active {\n  background: hsl(var(--primary) / 0.15);\n}"
    ),
    (
        "  color: rgba(255,255,255,0.7);\n  white-space: nowrap;",
        "  color: hsl(var(--text-secondary));\n  white-space: nowrap;"
    ),
    (
        ".sidebar-item.active .sidebar-label {\n  color: white;\n}",
        ".sidebar-item.active .sidebar-label {\n  color: hsl(var(--primary));\n}"
    ),
    (
        "  border-top: 1px solid rgba(255,255,255,0.06);\n  flex-shrink: 0;",
        "  border-top: 1px solid hsl(var(--border-light));\n  flex-shrink: 0;"
    ),
    (
        "  background: rgba(11, 19, 38, 0.8);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border-bottom: 1px solid rgba(255,255,255,0.06);",
        "  background: hsl(var(--bg-primary) / 0.8);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border-bottom: 1px solid hsl(var(--border-light));"
    ),
    (
        "  background: rgba(0,0,0,0.3);\n  border: 1px solid rgba(255,255,255,0.08);\n  border-radius: 8px;\n  color: #dae2fd;\n  font-size: 13px;",
        "  background: hsl(var(--bg-secondary));\n  border: 1px solid hsl(var(--border-light));\n  border-radius: 8px;\n  color: hsl(var(--text-primary));\n  font-size: 13px;"
    ),
    (
        ".form-input:focus {\n  border-color: #4cd7f6 !important;\n  box-shadow: 0 0 0 2px rgba(76, 215, 246, 0.2) !important;\n}",
        ".form-input:focus {\n  border-color: hsl(var(--primary)) !important;\n  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2) !important;\n}"
    ),
    (
        "  color: rgba(199, 196, 216, 0.7);\n  margin-bottom: 4px;",
        "  color: hsl(var(--text-secondary));\n  margin-bottom: 4px;"
    )
]

for old, new_text in replacements:
    if old in css:
        css = css.replace(old, new_text)
    else:
        print(f"Warning: Could not find block:\n{old[:50]}...")

with open("index.css", "w") as f:
    f.write(css)

print("Done")
