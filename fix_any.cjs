const fs = require('fs');
const files = [
  'src/components/pages/manual-deduction/DeductionForm.tsx',
  'src/components/pages/manual-deduction/ManualDeductionPage.tsx',
  'src/components/pages/menu/audit/MenuAuditLogTab.tsx',
  'src/components/pages/menu/categories/MenuCategoriesTab.tsx',
  'src/components/pages/menu/option-groups/MenuOptionGroupsTab.tsx',
  'src/components/pages/menu/options/MenuOptionsTab.tsx',
  'src/components/pages/menu/products/MenuProductsTab.tsx',
  'src/hooks/useOperationsBoard.ts',
  'src/routes/_protected/menu/categories/$categoryId/update.tsx',
  'src/routes/_protected/menu/categories/create.tsx',
  'src/routes/_protected/menu/options/$optionId/update.tsx',
  'src/routes/_protected/menu/options/create.tsx',
  'src/routes/_protected/menu/products/$productId/update.tsx',
  'src/routes/_protected/menu/products/create.tsx',
  'src/constants/NavLinksData.tsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/: any/g, ': unknown');
    // Also remove unused Store from NavLinksData.tsx
    if (f.includes('NavLinksData')) {
        content = content.replace(/Store,\s*/, '');
    }
    fs.writeFileSync(f, content);
  }
});
