import { MigrationInterface, QueryRunner } from "typeorm";

export class AddItemsJsonToOrders1783353166368 implements MigrationInterface {
    name = 'AddItemsJsonToOrders1783353166368'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        if (isPostgres) {
            await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "items_json" text`);
        } else {
            await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "items_json" text`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        if (isPostgres) {
            await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "items_json"`);
        } else {
            // SQLite drop column is complex, but since it's dev database, keeping it added is fine.
        }
    }
}
