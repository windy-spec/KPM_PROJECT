const { PrismaClient } = require('@prisma/client');
const CATEGORY_BLUEPRINTS = require('./config/categoryBlueprints').CATEGORY_BLUEPRINTS;

const prisma = new PrismaClient();

async function analyzeAndFix() {
  try {
    const products = await prisma.products.findMany({
      include: {
        product_categories: {
          include: { parent_category: true }
        }
      }
    });

    console.log(`Total products: ${products.length}`);
    const missingBlueprints = {};
    const updates = [];

    for (const prod of products) {
      // 1. Identify missing blueprints
      let catCode = prod.product_categories?.category_code;
      if (!catCode && prod.product_categories) {
          // fallback code logic if missing
          const rootCode = prod.product_categories.parent_category?.category_code || "Unknown";
          const childCode = prod.product_categories.category_name.toLowerCase().replace(/ /g, '-');
          catCode = `${rootCode}-${childCode}`;
      }
      
      const bpKey = Object.keys(CATEGORY_BLUEPRINTS).find(k => 
        k.toLowerCase().includes(catCode?.toLowerCase()) || 
        (prod.product_categories && k.toLowerCase().includes(prod.product_categories.category_code?.toLowerCase()))
      );

      let blueprint = [];
      if (bpKey) {
        blueprint = CATEGORY_BLUEPRINTS[bpKey];
      } else {
        if (!missingBlueprints[catCode]) {
          missingBlueprints[catCode] = { productName: prod.product_name, components: [] };
        }
      }

      // Check specific components
      const prodComps = prod.components || [];
      for (const comp of prodComps) {
        const compName = comp.name || comp.component_name;
        const existsInBp = blueprint.find(b => b.name === compName);
        if (!existsInBp) {
           if (!missingBlueprints[catCode]) {
             missingBlueprints[catCode] = { productName: prod.product_name, components: new Set() };
           }
           if (missingBlueprints[catCode].components instanceof Set) {
             missingBlueprints[catCode].components.add(compName);
           }
        }
      }

      // 2. Set reasonable base_price if 0 or null
      let newPrice = prod.base_price;
      if (!newPrice || newPrice <= 0) {
        // Guess price based on category
        const lowerName = prod.product_name.toLowerCase();
        if (lowerName.includes('nhà xưởng') || lowerName.includes('nhà kho') || lowerName.includes('kho bãi')) {
           newPrice = 150000000; // 150M
        } else if (lowerName.includes('quán cafe') || lowerName.includes('nhà hàng') || lowerName.includes('homestay')) {
           newPrice = 85000000; // 85M
        } else if (lowerName.includes('hạng mục sân') || lowerName.includes('mái che') || lowerName.includes('mái tôn')) {
           newPrice = 15000000; // 15M
        } else if (lowerName.includes('cổng') || lowerName.includes('cửa cuốn') || lowerName.includes('cửa sắt')) {
           newPrice = 8500000; // 8.5M
        } else if (lowerName.includes('cửa sổ')) {
           newPrice = 3500000; // 3.5M
        } else if (lowerName.includes('hàng rào')) {
           newPrice = 2500000; // 2.5M
        } else if (lowerName.includes('bàn') || lowerName.includes('ghế') || lowerName.includes('kệ')) {
           newPrice = 1200000; // 1.2M
        } else if (lowerName.includes('cầu thang') || lowerName.includes('lan can')) {
           newPrice = 4500000; // 4.5M
        } else {
           newPrice = 2000000; // 2M
        }

        updates.push({ id: prod.id, base_price: newPrice });
      }
    }

    // Process Sets to Arrays for printing
    for (const k in missingBlueprints) {
      if (missingBlueprints[k].components instanceof Set) {
         missingBlueprints[k].components = Array.from(missingBlueprints[k].components);
      }
    }

    console.log("\n=== MISSING BLUEPRINTS & COMPONENTS ===");
    console.log(JSON.stringify(missingBlueprints, null, 2));

    console.log(`\n=== UPDATING BASE_PRICE FOR ${updates.length} PRODUCTS ===`);
    for (const u of updates) {
      await prisma.products.update({
        where: { id: u.id },
        data: { base_price: u.base_price }
      });
    }
    console.log("Done updating prices.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeAndFix();
