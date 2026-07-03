const prisma = require("../models/prisma");

class ComponentTemplateService {
  async getAll() {
    return await prisma.component_templates.findMany({
      include: {
        allowed_materials: {
          include: {
            materials: true
          }
        }
      },
      orderBy: { created_at: "desc" },
    });
  }

  async getById(id) {
    const template = await prisma.component_templates.findUnique({
      where: { id },
      include: {
        allowed_materials: {
          include: {
            materials: true
          }
        }
      },
    });
    if (!template) throw new Error("Không tìm thấy linh kiện mẫu!");
    return template;
  }

  async create(data) {
    const { component_name, category_code, default_length, default_width, default_height, default_unit, allow_paint, allowed_material_ids, html_code, drawing_image_url, blueprint_html_code, blueprint_image_url } = data;
    
    // Create the template
    return await prisma.component_templates.create({
      data: {
        component_name,
        category_code,
        default_length: default_length ? parseFloat(default_length) : null,
        default_width: default_width ? parseFloat(default_width) : null,
        default_height: default_height ? parseFloat(default_height) : null,
        default_unit: default_unit || "mm",
        allow_paint: allow_paint ?? true,
        html_code,
        drawing_image_url,
        blueprint_html_code,
        blueprint_image_url,
        allowed_materials: allowed_material_ids && allowed_material_ids.length > 0 ? {
          create: allowed_material_ids.map(item => {
            if (typeof item === 'string') return { material_id: item };
            return { material_id: item.material_id, default_waste: item.default_waste ? parseFloat(item.default_waste) : 0 };
          })
        } : undefined
      },
      include: {
        allowed_materials: true
      }
    });
  }

  async update(id, data) {
    const { component_name, category_code, default_length, default_width, default_height, default_unit, allow_paint, allowed_material_ids, html_code, drawing_image_url, blueprint_html_code, blueprint_image_url } = data;
    
    await this.getById(id);

    return await prisma.$transaction(async (tx) => {
      // If allowed_material_ids is provided, replace the old ones
      if (allowed_material_ids) {
        await tx.component_allowed_materials.deleteMany({
          where: { component_id: id }
        });
      }

      return await tx.component_templates.update({
        where: { id },
        data: {
          ...(component_name && { component_name }),
          ...(category_code !== undefined && { category_code }),
          ...(default_length !== undefined && { default_length: default_length ? parseFloat(default_length) : null }),
          ...(default_width !== undefined && { default_width: default_width ? parseFloat(default_width) : null }),
          ...(default_height !== undefined && { default_height: default_height ? parseFloat(default_height) : null }),
          ...(default_unit && { default_unit }),
          ...(allow_paint !== undefined && { allow_paint }),
          ...(html_code !== undefined && { html_code }),
          ...(drawing_image_url !== undefined && { drawing_image_url }),
          ...(blueprint_html_code !== undefined && { blueprint_html_code }),
          ...(blueprint_image_url !== undefined && { blueprint_image_url }),
          ...(allowed_material_ids && {
            allowed_materials: {
              create: allowed_material_ids.map(item => {
                if (typeof item === 'string') return { material_id: item };
                return { material_id: item.material_id, default_waste: item.default_waste ? parseFloat(item.default_waste) : 0 };
              })
            }
          })
        },
        include: {
          allowed_materials: {
            include: { materials: true }
          }
        }
      });
    });
  }

  async delete(id) {
    await this.getById(id);
    return await prisma.component_templates.delete({
      where: { id }
    });
  }
}

module.exports = new ComponentTemplateService();
