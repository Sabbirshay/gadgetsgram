import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1783353166367 implements MigrationInterface {
    name = 'InitialSchema1783353166367'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === 'postgres';

        if (isPostgres) {
            // PostgreSQL direct table creation with final constraints (avoiding SQLite temporary tables logic)
            await queryRunner.query(`CREATE TABLE IF NOT EXISTS "users" ("id" SERIAL PRIMARY KEY, "email" varchar NOT NULL, "password" varchar NOT NULL, "name" varchar NOT NULL, "role" varchar NOT NULL DEFAULT 'admin', "is_active" boolean NOT NULL DEFAULT true, "hashed_refresh_token" varchar, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
            await queryRunner.query(`CREATE TABLE IF NOT EXISTS "products" ("id" SERIAL PRIMARY KEY, "title" varchar NOT NULL, "slug" varchar NOT NULL, "description" text, "price" decimal(10,2) NOT NULL, "sale_price" decimal(10,2), "nameEn" varchar, "nameBn" varchar, "originalPrice" decimal(10,2), "specs" text, "category" varchar, "inStock" boolean NOT NULL DEFAULT true, "stock" integer NOT NULL DEFAULT 0, "images" text, "status" varchar NOT NULL DEFAULT 'active', "brand" varchar, "averageRating" decimal(3,2) NOT NULL DEFAULT 0, "reviewCount" integer NOT NULL DEFAULT 0, "isFeatured" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "UQ_464f927ae360106b783ed0b4106" UNIQUE ("slug"))`);
            await queryRunner.query(`CREATE TABLE IF NOT EXISTS "customers" ("id" SERIAL PRIMARY KEY, "name" varchar NOT NULL, "phone" varchar NOT NULL, "email" varchar, "address" text, "uid" varchar, "orders_count" integer NOT NULL DEFAULT 0, "lifetime_value" decimal(12,2) NOT NULL DEFAULT 0, "last_order_date" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174" UNIQUE ("phone"), CONSTRAINT "UQ_aee431c16bdcb3dcf5898adc9a8" UNIQUE ("uid"))`);
            await queryRunner.query(`CREATE TABLE IF NOT EXISTS "orders" ("id" SERIAL PRIMARY KEY, "orderId" varchar, "customer_name" varchar NOT NULL, "customer_id" integer REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, "phone" varchar NOT NULL, "alternative_phone" varchar, "address" varchar NOT NULL, "district" varchar NOT NULL, "product_id" integer REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, "quantity" integer NOT NULL DEFAULT 1, "price" decimal(10,2) NOT NULL, "delivery_charge" decimal(10,2) NOT NULL DEFAULT 0, "subtotal" decimal(10,2) NOT NULL, "status" varchar NOT NULL DEFAULT 'pending', "courier_tracking_id" varchar, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "UQ_41ba27842ac1a2c24817ca59eaa" UNIQUE ("orderId"))`);
            await queryRunner.query(`CREATE TABLE IF NOT EXISTS "order_status_history" ("id" SERIAL PRIMARY KEY, "order_id" integer NOT NULL REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, "from_status" varchar, "to_status" varchar NOT NULL, "changed_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
            await queryRunner.query(`CREATE TABLE IF NOT EXISTS "notifications" ("id" SERIAL PRIMARY KEY, "order_id" integer, "channel" varchar NOT NULL, "type" varchar NOT NULL, "status" varchar NOT NULL DEFAULT 'pending', "payload" text, "sent_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
            await queryRunner.query(`CREATE TABLE IF NOT EXISTS "courier_shipments" ("id" SERIAL PRIMARY KEY, "order_id" integer NOT NULL, "courier_name" varchar NOT NULL, "tracking_id" varchar, "status" varchar NOT NULL DEFAULT 'pending', "booked_at" TIMESTAMP, "delivered_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
            await queryRunner.query(`CREATE TABLE IF NOT EXISTS "audit_logs" ("id" SERIAL PRIMARY KEY, "user_id" integer, "action" varchar NOT NULL, "entity" varchar NOT NULL, "entity_id" integer, "changes" text, "ip_address" varchar, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
            await queryRunner.query(`CREATE TABLE IF NOT EXISTS "settings" ("id" SERIAL PRIMARY KEY, "key" varchar NOT NULL, "value" text, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "UQ_c8639b7626fa94ba8265628f214" UNIQUE ("key"))`);
            await queryRunner.query(`CREATE TABLE IF NOT EXISTS "inventory_transactions" ("id" SERIAL PRIMARY KEY, "product_id" integer NOT NULL REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, "type" varchar NOT NULL CHECK( "type" IN ('IN','OUT','RESERVED','RETURNED','ADJUSTMENT') ), "quantity" integer NOT NULL, "reference_id" varchar, "notes" varchar, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
            await queryRunner.query(`CREATE TABLE IF NOT EXISTS "customer_wishlist" ("customer_id" integer NOT NULL REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE, "product_id" integer NOT NULL REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("customer_id", "product_id"))`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_f62031695fd6235f851a96ac93" ON "customer_wishlist" ("customer_id")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_e919c0b8fda06743978544a3ea" ON "customer_wishlist" ("product_id")`);
        } else {
            // original SQLite schema creation steps
            await queryRunner.query(`CREATE TABLE "users" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL, "name" varchar NOT NULL, "role" varchar NOT NULL DEFAULT ('admin'), "is_active" boolean NOT NULL DEFAULT (1), "hashed_refresh_token" varchar, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
            await queryRunner.query(`CREATE TABLE "products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "slug" varchar NOT NULL, "description" text, "price" decimal(10,2) NOT NULL, "sale_price" decimal(10,2), "nameEn" varchar, "nameBn" varchar, "originalPrice" decimal(10,2), "specs" text, "category" varchar, "inStock" boolean NOT NULL DEFAULT (1), "stock" integer NOT NULL DEFAULT (0), "images" text, "status" varchar NOT NULL DEFAULT ('active'), "brand" varchar, "averageRating" decimal(3,2) NOT NULL DEFAULT (0), "reviewCount" integer NOT NULL DEFAULT (0), "isFeatured" boolean NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_464f927ae360106b783ed0b4106" UNIQUE ("slug"))`);
            await queryRunner.query(`CREATE TABLE "customers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "phone" varchar NOT NULL, "email" varchar, "address" text, "uid" varchar, "orders_count" integer NOT NULL DEFAULT (0), "lifetime_value" decimal(12,2) NOT NULL DEFAULT (0), "last_order_date" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174" UNIQUE ("phone"), CONSTRAINT "UQ_aee431c16bdcb3dcf5898adc9a8" UNIQUE ("uid"))`);
            await queryRunner.query(`CREATE TABLE "order_status_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order_id" integer NOT NULL, "from_status" varchar, "to_status" varchar NOT NULL, "changed_at" datetime NOT NULL DEFAULT (datetime('now')))`);
            await queryRunner.query(`CREATE TABLE "orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "orderId" varchar, "customer_name" varchar NOT NULL, "customer_id" integer, "phone" varchar NOT NULL, "alternative_phone" varchar, "address" varchar NOT NULL, "district" varchar NOT NULL, "product_id" integer, "quantity" integer NOT NULL DEFAULT (1), "price" decimal(10,2) NOT NULL, "delivery_charge" decimal(10,2) NOT NULL DEFAULT (0), "subtotal" decimal(10,2) NOT NULL, "status" varchar NOT NULL DEFAULT ('pending'), "courier_tracking_id" varchar, "notes" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_41ba27842ac1a2c24817ca59eaa" UNIQUE ("orderId"))`);
            await queryRunner.query(`CREATE TABLE "notifications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order_id" integer, "channel" varchar NOT NULL, "type" varchar NOT NULL, "status" varchar NOT NULL DEFAULT ('pending'), "payload" text, "sent_at" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
            await queryRunner.query(`CREATE TABLE "courier_shipments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order_id" integer NOT NULL, "courier_name" varchar NOT NULL, "tracking_id" varchar, "status" varchar NOT NULL DEFAULT ('pending'), "booked_at" datetime, "delivered_at" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
            await queryRunner.query(`CREATE TABLE "audit_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "user_id" integer, "action" varchar NOT NULL, "entity" varchar NOT NULL, "entity_id" integer, "changes" text, "ip_address" varchar, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
            await queryRunner.query(`CREATE TABLE "settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "key" varchar NOT NULL, "value" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_c8639b7626fa94ba8265628f214" UNIQUE ("key"))`);
            await queryRunner.query(`CREATE TABLE "inventory_transactions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "product_id" integer NOT NULL, "type" varchar CHECK( "type" IN ('IN','OUT','RESERVED','RETURNED','ADJUSTMENT') ) NOT NULL, "quantity" integer NOT NULL, "reference_id" varchar, "notes" varchar, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
            await queryRunner.query(`CREATE TABLE "customer_wishlist" ("customer_id" integer NOT NULL, "product_id" integer NOT NULL, PRIMARY KEY ("customer_id", "product_id"))`);
            await queryRunner.query(`CREATE INDEX "IDX_f62031695fd6235f851a96ac93" ON "customer_wishlist" ("customer_id") `);
            await queryRunner.query(`CREATE INDEX "IDX_e919c0b8fda06743978544a3ea" ON "customer_wishlist" ("product_id") `);
            await queryRunner.query(`CREATE TABLE "temporary_order_status_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order_id" integer NOT NULL, "from_status" varchar, "to_status" varchar NOT NULL, "changed_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_1ca7d5228cf9dc589b60243933c" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
            await queryRunner.query(`INSERT INTO "temporary_order_status_history"("id", "order_id", "from_status", "to_status", "changed_at") SELECT "id", "order_id", "from_status", "to_status", "changed_at" FROM "order_status_history"`);
            await queryRunner.query(`DROP TABLE "order_status_history"`);
            await queryRunner.query(`ALTER TABLE "temporary_order_status_history" RENAME TO "order_status_history"`);
            await queryRunner.query(`CREATE TABLE "temporary_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "orderId" varchar, "customer_name" varchar NOT NULL, "customer_id" integer, "phone" varchar NOT NULL, "alternative_phone" varchar, "address" varchar NOT NULL, "district" varchar NOT NULL, "product_id" integer, "quantity" integer NOT NULL DEFAULT (1), "price" decimal(10,2) NOT NULL, "delivery_charge" decimal(10,2) NOT NULL DEFAULT (0), "subtotal" decimal(10,2) NOT NULL, "status" varchar NOT NULL DEFAULT ('pending'), "courier_tracking_id" varchar, "notes" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_41ba27842ac1a2c24817ca59eaa" UNIQUE ("orderId"), CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_ac832121b6c331b084ecc4121fd" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
            await queryRunner.query(`INSERT INTO "temporary_orders"("id", "orderId", "customer_name", "customer_id", "phone", "alternative_phone", "address", "district", "product_id", "quantity", "price", "delivery_charge", "subtotal", "status", "courier_tracking_id", "notes", "created_at", "updated_at") SELECT "id", "orderId", "customer_name", "customer_id", "phone", "alternative_phone", "address", "district", "product_id", "quantity", "price", "delivery_charge", "subtotal", "status", "courier_tracking_id", "notes", "created_at", "updated_at" FROM "orders"`);
            await queryRunner.query(`DROP TABLE "orders"`);
            await queryRunner.query(`ALTER TABLE "temporary_orders" RENAME TO "orders"`);
            await queryRunner.query(`CREATE TABLE "temporary_inventory_transactions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "product_id" integer NOT NULL, "type" varchar CHECK( "type" IN ('IN','OUT','RESERVED','RETURNED','ADJUSTMENT') ) NOT NULL, "quantity" integer NOT NULL, "reference_id" varchar, "notes" varchar, "created_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_2520d97de0c9a0fbfc9b00f4c1b" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
            await queryRunner.query(`INSERT INTO "temporary_inventory_transactions"("id", "product_id", "type", "quantity", "reference_id", "notes", "created_at") SELECT "id", "product_id", "type", "quantity", "reference_id", "notes", "created_at" FROM "inventory_transactions"`);
            await queryRunner.query(`DROP TABLE "inventory_transactions"`);
            await queryRunner.query(`ALTER TABLE "temporary_inventory_transactions" RENAME TO "inventory_transactions"`);
            await queryRunner.query(`DROP INDEX "IDX_f62031695fd6235f851a96ac93"`);
            await queryRunner.query(`DROP INDEX "IDX_e919c0b8fda06743978544a3ea"`);
            await queryRunner.query(`CREATE TABLE "temporary_customer_wishlist" ("customer_id" integer NOT NULL, "product_id" integer NOT NULL, CONSTRAINT "FK_f62031695fd6235f851a96ac93b" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_e919c0b8fda06743978544a3eab" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("customer_id", "product_id"))`);
            await queryRunner.query(`INSERT INTO "temporary_customer_wishlist"("customer_id", "product_id") SELECT "customer_id", "product_id" FROM "customer_wishlist"`);
            await queryRunner.query(`DROP TABLE "customer_wishlist"`);
            await queryRunner.query(`ALTER TABLE "temporary_customer_wishlist" RENAME TO "customer_wishlist"`);
            await queryRunner.query(`CREATE INDEX "IDX_f62031695fd6235f851a96ac93" ON "customer_wishlist" ("customer_id") `);
            await queryRunner.query(`CREATE INDEX "IDX_e919c0b8fda06743978544a3ea" ON "customer_wishlist" ("product_id") `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === 'postgres';

        if (isPostgres) {
            // PostgreSQL drops
            await queryRunner.query(`DROP INDEX IF EXISTS "IDX_e919c0b8fda06743978544a3ea"`);
            await queryRunner.query(`DROP INDEX IF EXISTS "IDX_f62031695fd6235f851a96ac93"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "customer_wishlist"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "inventory_transactions"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "settings"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "courier_shipments"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "order_status_history"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "customers"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
        } else {
            // SQLite drops
            await queryRunner.query(`DROP INDEX "IDX_e919c0b8fda06743978544a3ea"`);
            await queryRunner.query(`DROP INDEX "IDX_f62031695fd6235f851a96ac93"`);
            await queryRunner.query(`ALTER TABLE "customer_wishlist" RENAME TO "temporary_customer_wishlist"`);
            await queryRunner.query(`CREATE TABLE "customer_wishlist" ("customer_id" integer NOT NULL, "product_id" integer NOT NULL, PRIMARY KEY ("customer_id", "product_id"))`);
            await queryRunner.query(`INSERT INTO "customer_wishlist"("customer_id", "product_id") SELECT "customer_id", "product_id" FROM "temporary_customer_wishlist"`);
            await queryRunner.query(`DROP TABLE "temporary_customer_wishlist"`);
            await queryRunner.query(`CREATE INDEX "IDX_e919c0b8fda06743978544a3ea" ON "customer_wishlist" ("product_id") `);
            await queryRunner.query(`CREATE INDEX "IDX_f62031695fd6235f851a96ac93" ON "customer_wishlist" ("customer_id") `);
            await queryRunner.query(`ALTER TABLE "inventory_transactions" RENAME TO "temporary_inventory_transactions"`);
            await queryRunner.query(`CREATE TABLE "inventory_transactions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "product_id" integer NOT NULL, "type" varchar CHECK( "type" IN ('IN','OUT','RESERVED','RETURNED','ADJUSTMENT') ) NOT NULL, "quantity" integer NOT NULL, "reference_id" varchar, "notes" varchar, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
            await queryRunner.query(`INSERT INTO "inventory_transactions"("id", "product_id", "type", "quantity", "reference_id", "notes", "created_at") SELECT "id", "product_id", "type", "quantity", "reference_id", "notes", "created_at" FROM "temporary_inventory_transactions"`);
            await queryRunner.query(`DROP TABLE "temporary_inventory_transactions"`);
            await queryRunner.query(`ALTER TABLE "orders" RENAME TO "temporary_orders"`);
            await queryRunner.query(`CREATE TABLE "orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "orderId" varchar, "customer_name" varchar NOT NULL, "customer_id" integer, "phone" varchar NOT NULL, "alternative_phone" varchar, "address" varchar NOT NULL, "district" varchar NOT NULL, "product_id" integer, "quantity" integer NOT NULL DEFAULT (1), "price" decimal(10,2) NOT NULL, "delivery_charge" decimal(10,2) NOT NULL DEFAULT (0), "subtotal" decimal(10,2) NOT NULL, "status" varchar NOT NULL DEFAULT ('pending'), "courier_tracking_id" varchar, "notes" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_41ba27842ac1a2c24817ca59eaa" UNIQUE ("orderId"))`);
            await queryRunner.query(`INSERT INTO "orders"("id", "orderId", "customer_name", "customer_id", "phone", "alternative_phone", "address", "district", "product_id", "quantity", "price", "delivery_charge", "subtotal", "status", "courier_tracking_id", "notes", "created_at", "updated_at") SELECT "id", "orderId", "customer_name", "customer_id", "phone", "alternative_phone", "address", "district", "product_id", "quantity", "price", "delivery_charge", "subtotal", "status", "courier_tracking_id", "notes", "created_at", "updated_at" FROM "temporary_orders"`);
            await queryRunner.query(`DROP TABLE "temporary_orders"`);
            await queryRunner.query(`ALTER TABLE "order_status_history" RENAME TO "temporary_order_status_history"`);
            await queryRunner.query(`CREATE TABLE "order_status_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order_id" integer NOT NULL, "from_status" varchar, "to_status" varchar NOT NULL, "changed_at" datetime NOT NULL DEFAULT (datetime('now')))`);
            await queryRunner.query(`INSERT INTO "order_status_history"("id", "order_id", "from_status", "to_status", "changed_at") SELECT "id", "order_id", "from_status", "to_status", "changed_at" FROM "temporary_order_status_history"`);
            await queryRunner.query(`DROP TABLE "temporary_order_status_history"`);
            await queryRunner.query(`DROP INDEX "IDX_e919c0b8fda06743978544a3ea"`);
            await queryRunner.query(`DROP INDEX "IDX_f62031695fd6235f851a96ac93"`);
            await queryRunner.query(`DROP TABLE "customer_wishlist"`);
            await queryRunner.query(`DROP TABLE "inventory_transactions"`);
            await queryRunner.query(`DROP TABLE "settings"`);
            await queryRunner.query(`DROP TABLE "audit_logs"`);
            await queryRunner.query(`DROP TABLE "courier_shipments"`);
            await queryRunner.query(`DROP TABLE "notifications"`);
            await queryRunner.query(`DROP TABLE "orders"`);
            await queryRunner.query(`DROP TABLE "order_status_history"`);
            await queryRunner.query(`DROP TABLE "customers"`);
            await queryRunner.query(`DROP TABLE "products"`);
            await queryRunner.query(`DROP TABLE "users"`);
        }
    }
}
