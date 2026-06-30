import re
with open('src/components/EcommerceModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import \{ useEcommerceProducts, useEcommerceOrders, useCreateEcommerceOrder \} from \'../hooks/useEcommerce\';\nimport \{ useState \} from \'react\';\n', '', content)

new_destructure = '''  const { addToast } = useERPStore();
  const { data: ecommerceProducts = [] } = useEcommerceProducts();
  const { data: ecommerceOrders = [] } = useEcommerceOrders();
  const createEcommerceOrder = useCreateEcommerceOrder();
'''

content = re.sub(r'  const \{\s*ecommerceOrders.*?addToast\s*\} = useERPStore\(\);', new_destructure, content, flags=re.DOTALL)
content = content.replace("import { useERPStore } from '../store/useERPStore';", "import { useERPStore } from '../store/useERPStore';\nimport { useEcommerceProducts, useEcommerceOrders, useCreateEcommerceOrder } from '../hooks/useEcommerce';")

# Fix mutations:
content = re.sub(r'addEcommerceOrder\(', 'createEcommerceOrder.mutate(', content)

with open('src/components/EcommerceModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
