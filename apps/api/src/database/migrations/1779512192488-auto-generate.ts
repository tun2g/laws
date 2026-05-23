import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoGenerate1779512192488 implements MigrationInterface {
    name = 'AutoGenerate1779512192488'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "skill_runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "kind" character varying(32) NOT NULL, "status" character varying(16) NOT NULL DEFAULT 'QUEUED', "input" text NOT NULL, "output" text, "sideOutput" text, "errorMessage" text, "tokenUsage" integer, "citationsJson" text, "model" character varying(64), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "startedAt" TIMESTAMP WITH TIME ZONE, "finishedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6352eae8df927c05a9278cf8f4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_aa14d5d29162cdab84ac2a00d3" ON "skill_runs" ("projectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5bcb8a4d6dc9522e2862657665" ON "skill_runs" ("status") `);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "name" character varying(200) NOT NULL, "clientName" character varying(200), "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a8e7e6c3f9d9528ed35fe5bae3" ON "projects" ("ownerId") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(320) NOT NULL, "passwordHash" character varying(256) NOT NULL, "name" character varying(128) NOT NULL, "role" character varying(16) NOT NULL DEFAULT 'USER', "codexConnectedAt" TIMESTAMP WITH TIME ZONE, "codexHomeDir" text, "codexWorkspaceDir" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "action" character varying(64) NOT NULL, "meta" text, "ip" character varying(64), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cfa83f61e4d27a87fcae1e025a" ON "audit_logs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs" ("createdAt") `);
        await queryRunner.query(`CREATE TABLE "chat_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "kind" character varying(32) NOT NULL, "title" character varying(200) NOT NULL, "codexSessionId" character varying(128), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_chat_sessions_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_sessions_projectId" ON "chat_sessions" ("projectId") `);
        await queryRunner.query(`CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionId" uuid NOT NULL, "role" character varying(16) NOT NULL, "content" text NOT NULL DEFAULT '', "eventsJson" text, "tokenUsage" integer, "status" character varying(16) NOT NULL DEFAULT 'complete', "errorMessage" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "finishedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_chat_messages_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_sessionId" ON "chat_messages" ("sessionId") `);
        await queryRunner.query(`ALTER TABLE "skill_runs" ADD CONSTRAINT "FK_aa14d5d29162cdab84ac2a00d38" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_a8e7e6c3f9d9528ed35fe5bae33" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_sessions" ADD CONSTRAINT "FK_chat_sessions_projectId" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_sessionId" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TABLE "news_articles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source" character varying(64) NOT NULL, "sourceUrl" text NOT NULL, "articleUrl" text NOT NULL, "title" character varying(500) NOT NULL, "summary" text, "imageUrl" text, "publishedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "fetchedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "hash" char(64) NOT NULL, CONSTRAINT "UQ_news_articles_articleUrl" UNIQUE ("articleUrl"), CONSTRAINT "PK_news_articles_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_news_articles_publishedAt" ON "news_articles" ("publishedAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_news_articles_source" ON "news_articles" ("source")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_news_articles_source"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_news_articles_publishedAt"`);
        await queryRunner.query(`DROP TABLE "news_articles"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_sessionId"`);
        await queryRunner.query(`ALTER TABLE "chat_sessions" DROP CONSTRAINT "FK_chat_sessions_projectId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_sessionId"`);
        await queryRunner.query(`DROP TABLE "chat_messages"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_sessions_projectId"`);
        await queryRunner.query(`DROP TABLE "chat_sessions"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_a8e7e6c3f9d9528ed35fe5bae33"`);
        await queryRunner.query(`ALTER TABLE "skill_runs" DROP CONSTRAINT "FK_aa14d5d29162cdab84ac2a00d38"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfa83f61e4d27a87fcae1e025a"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a8e7e6c3f9d9528ed35fe5bae3"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5bcb8a4d6dc9522e2862657665"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa14d5d29162cdab84ac2a00d3"`);
        await queryRunner.query(`DROP TABLE "skill_runs"`);
    }

}
