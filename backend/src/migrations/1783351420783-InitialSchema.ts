import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1783351420783 implements MigrationInterface {
    name = 'InitialSchema1783351420783'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customer_wishlist" ("customer_id" integer NOT NULL, "product_id" integer NOT NULL, PRIMARY KEY ("customer_id", "product_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f62031695fd6235f851a96ac93" ON "customer_wishlist" ("customer_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e919c0b8fda06743978544a3ea" ON "customer_wishlist" ("product_id") `);
        await queryRunner.query(`CREATE TABLE "temporary_products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "slug" varchar NOT NULL, "description" text, "price" decimal(10,2) NOT NULL, "sale_price" decimal(10,2), "stock" integer NOT NULL DEFAULT (0), "images" text, "status" varchar NOT NULL DEFAULT ('active'), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "nameEn" varchar, "nameBn" varchar, "originalPrice" decimal(10,2), "specs" text, "category" varchar, "inStock" boolean NOT NULL DEFAULT (1), "brand" varchar, "averageRating" decimal(3,2) NOT NULL DEFAULT (0), "reviewCount" integer NOT NULL DEFAULT (0), "isFeatured" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_464f927ae360106b783ed0b4106" UNIQUE ("slug"))`);
        await queryRunner.query(`INSERT INTO "temporary_products"("id", "title", "slug", "description", "price", "sale_price", "stock", "images", "status", "created_at", "updated_at", "nameEn", "nameBn", "originalPrice", "specs", "category", "inStock") SELECT "id", "title", "slug", "description", "price", "sale_price", "stock", "images", "status", "created_at", "updated_at", "nameEn", "nameBn", "originalPrice", "specs", "category", "inStock" FROM "products"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`ALTER TABLE "temporary_products" RENAME TO "products"`);
        await queryRunner.query(`CREATE TABLE "temporary_customers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "phone" varchar NOT NULL, "email" varchar, "orders_count" integer NOT NULL DEFAULT (0), "lifetime_value" decimal(12,2) NOT NULL DEFAULT (0), "last_order_date" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "uid" varchar, "address" text, CONSTRAINT "UQ_75488e8c3cfb70e59697b7f7ad8" UNIQUE ("uid"), CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174" UNIQUE ("phone"))`);
        await queryRunner.query(`INSERT INTO "temporary_customers"("id", "name", "phone", "email", "orders_count", "lifetime_value", "last_order_date", "created_at", "updated_at", "uid") SELECT "id", "name", "phone", "email", "orders_count", "lifetime_value", "last_order_date", "created_at", "updated_at", "uid" FROM "customers"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`ALTER TABLE "temporary_customers" RENAME TO "customers"`);
        await queryRunner.query(`DROP INDEX "IDX_f62031695fd6235f851a96ac93"`);
        await queryRunner.query(`DROP INDEX "IDX_e919c0b8fda06743978544a3ea"`);
        await queryRunner.query(`CREATE TABLE "temporary_customer_wishlist" ("customer_id" integer NOT NULL, "product_id" integer NOT NULL, CONSTRAINT "FK_f62031695fd6235f851a96ac93b" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_e919c0b8fda06743978544a3eab" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("customer_id", "product_id"))`);
        await queryRunner.query(`INSERT INTO "temporary_customer_wishlist"("customer_id", "product_id") SELECT "customer_id", "product_id" FROM "customer_wishlist"`);
        await queryRunner.query(`DROP TABLE "customer_wishlist"`);
        await queryRunner.query(`ALTER TABLE "temporary_customer_wishlist" RENAME TO "customer_wishlist"`);
        await queryRunner.query(`CREATE INDEX "IDX_f62031695fd6235f851a96ac93" ON "customer_wishlist" ("customer_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e919c0b8fda06743978544a3ea" ON "customer_wishlist" ("product_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_e919c0b8fda06743978544a3ea"`);
        await queryRunner.query(`DROP INDEX "IDX_f62031695fd6235f851a96ac93"`);
        await queryRunner.query(`ALTER TABLE "customer_wishlist" RENAME TO "temporary_customer_wishlist"`);
        await queryRunner.query(`CREATE TABLE "customer_wishlist" ("customer_id" integer NOT NULL, "product_id" integer NOT NULL, PRIMARY KEY ("customer_id", "product_id"))`);
        await queryRunner.query(`INSERT INTO "customer_wishlist"("customer_id", "product_id") SELECT "customer_id", "product_id" FROM "temporary_customer_wishlist"`);
        await queryRunner.query(`DROP TABLE "temporary_customer_wishlist"`);
        await queryRunner.query(`CREATE INDEX "IDX_e919c0b8fda06743978544a3ea" ON "customer_wishlist" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f62031695fd6235f851a96ac93" ON "customer_wishlist" ("customer_id") `);
        await queryRunner.query(`ALTER TABLE "customers" RENAME TO "temporary_customers"`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "phone" varchar NOT NULL, "email" varchar, "orders_count" integer NOT NULL DEFAULT (0), "lifetime_value" decimal(12,2) NOT NULL DEFAULT (0), "last_order_date" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "uid" varchar, CONSTRAINT "UQ_75488e8c3cfb70e59697b7f7ad8" UNIQUE ("uid"), CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174" UNIQUE ("phone"))`);
        await queryRunner.query(`INSERT INTO "customers"("id", "name", "phone", "email", "orders_count", "lifetime_value", "last_order_date", "created_at", "updated_at", "uid") SELECT "id", "name", "phone", "email", "orders_count", "lifetime_value", "last_order_date", "created_at", "updated_at", "uid" FROM "temporary_customers"`);
        await queryRunner.query(`DROP TABLE "temporary_customers"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME TO "temporary_products"`);
        await queryRunner.query(`CREATE TABLE "products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "slug" varchar NOT NULL, "description" text, "price" decimal(10,2) NOT NULL, "sale_price" decimal(10,2), "stock" integer NOT NULL DEFAULT (0), "images" text, "status" varchar NOT NULL DEFAULT ('active'), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "nameEn" varchar, "nameBn" varchar, "originalPrice" decimal(10,2), "specs" text, "category" varchar, "inStock" boolean NOT NULL DEFAULT (1), CONSTRAINT "UQ_464f927ae360106b783ed0b4106" UNIQUE ("slug"))`);
        await queryRunner.query(`INSERT INTO "products"("id", "title", "slug", "description", "price", "sale_price", "stock", "images", "status", "created_at", "updated_at", "nameEn", "nameBn", "originalPrice", "specs", "category", "inStock") SELECT "id", "title", "slug", "description", "price", "sale_price", "stock", "images", "status", "created_at", "updated_at", "nameEn", "nameBn", "originalPrice", "specs", "category", "inStock" FROM "temporary_products"`);
        await queryRunner.query(`DROP TABLE "temporary_products"`);
        await queryRunner.query(`DROP INDEX "IDX_e919c0b8fda06743978544a3ea"`);
        await queryRunner.query(`DROP INDEX "IDX_f62031695fd6235f851a96ac93"`);
        await queryRunner.query(`DROP TABLE "customer_wishlist"`);
    }

}
