-- CreateTable
CREATE TABLE "ai_chat_messages" (
    "id" UUID NOT NULL,
    "session_id" UUID,
    "sender_type" VARCHAR(20),
    "message_text" TEXT NOT NULL,
    "extracted_specs" JSONB,
    "sent_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_chat_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "session_title" VARCHAR(255),
    "started_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_knowledge_base" (
    "id" UUID NOT NULL,
    "rule_title" VARCHAR(255) NOT NULL,
    "rule_content" TEXT NOT NULL,
    "embedding_vector" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_knowledge_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labor_categories" (
    "id" UUID NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "labor_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labor_pricing_models" (
    "id" UUID NOT NULL,
    "model_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "labor_pricing_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labor_rates" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "model_id" UUID,
    "rate_amount" DECIMAL(12,2) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labor_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_thickness" (
    "id" UUID NOT NULL,
    "material_id" UUID,
    "thickness_value" VARCHAR(50) NOT NULL,
    "price_multiplier" DECIMAL(5,2) NOT NULL DEFAULT 1.00,

    CONSTRAINT "material_thickness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_types" (
    "id" UUID NOT NULL,
    "type_name" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "material_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_units" (
    "id" UUID NOT NULL,
    "unit_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "material_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "type_id" UUID,
    "unit_id" UUID,
    "material_code" VARCHAR(50) NOT NULL,
    "material_name" VARCHAR(255) NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_tracking" (
    "id" UUID NOT NULL,
    "order_id" UUID,
    "stage_name" VARCHAR(100) NOT NULL,
    "stage_description" TEXT,
    "tracked_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "quotation_id" UUID,
    "order_code" VARCHAR(50) NOT NULL,
    "production_status" VARCHAR(50) DEFAULT 'confirmed',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paint_types" (
    "id" UUID NOT NULL,
    "paint_name" VARCHAR(100) NOT NULL,
    "price_per_sqm" DECIMAL(12,2) NOT NULL,
    "description" TEXT,

    CONSTRAINT "paint_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "permission_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_id" UUID,
    "image_url" TEXT NOT NULL,
    "is_primary" BOOLEAN DEFAULT false,
    "uploaded_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "product_code" VARCHAR(50) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "default_specs" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_attachments" (
    "id" UUID NOT NULL,
    "quotation_id" UUID,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_specs" (
    "id" UUID NOT NULL,
    "quotation_id" UUID,
    "material_id" UUID,
    "thickness_id" UUID,
    "paint_id" UUID,
    "dimensions" JSONB NOT NULL,
    "snapshot_price" DECIMAL(12,2) NOT NULL,
    "note" TEXT,

    CONSTRAINT "quotation_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "session_id" UUID,
    "total_quoted_price" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "quotation_id" UUID,
    "transaction_code" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" VARCHAR(50),
    "status" VARCHAR(50) DEFAULT 'pending',
    "paid_at" TIMESTAMPTZ(6),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "middle_name" VARCHAR(50),
    "last_name" VARCHAR(50) NOT NULL,
    "phone_number" VARCHAR(20),
    "address" TEXT,
    "zalo_number" VARCHAR(20),
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role_id" UUID,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_code" VARCHAR(10),
    "code_expires_at" TIMESTAMPTZ(6),
    "refresh_token" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "labor_rates_category_id_model_id_key" ON "labor_rates"("category_id", "model_id");

-- CreateIndex
CREATE UNIQUE INDEX "material_thickness_material_id_thickness_value_key" ON "material_thickness"("material_id", "thickness_value");

-- CreateIndex
CREATE UNIQUE INDEX "materials_material_code_key" ON "materials"("material_code");

-- CreateIndex
CREATE UNIQUE INDEX "orders_quotation_id_key" ON "orders"("quotation_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_code_key" ON "orders"("order_code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_name_key" ON "permissions"("permission_name");

-- CreateIndex
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_code_key" ON "transactions"("transaction_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_chat_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "labor_rates" ADD CONSTRAINT "labor_rates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "labor_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "labor_rates" ADD CONSTRAINT "labor_rates_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "labor_pricing_models"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_thickness" ADD CONSTRAINT "material_thickness_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "material_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "material_units"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_tracking" ADD CONSTRAINT "order_tracking_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation_attachments" ADD CONSTRAINT "quotation_attachments_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation_specs" ADD CONSTRAINT "quotation_specs_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation_specs" ADD CONSTRAINT "quotation_specs_paint_id_fkey" FOREIGN KEY ("paint_id") REFERENCES "paint_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation_specs" ADD CONSTRAINT "quotation_specs_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation_specs" ADD CONSTRAINT "quotation_specs_thickness_id_fkey" FOREIGN KEY ("thickness_id") REFERENCES "material_thickness"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_chat_sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
