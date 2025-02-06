"use server";

import { authSchema } from "@/serverAuth";
import { z } from "zod";
import { getNNDB } from "@/db";
import { Category } from "@/types";
import { categoryIdSchema } from "@/schemas";

export {
  listCategory,
  createCategory,
  deleteCategory,
  updateCategory,
};

async function listCategory(
  auth: z.input<typeof authSchema>,
) {
  const { role } = await authSchema.parseAsync(auth);
  if (role !== "admin") {
    return { type: "Forbidden" } as const;
  }

  const categories = await getNNDB()
    .selectFrom("categories")
    .select(["id", "name", "parent_id", "is_group"])
    .execute();

  const table = new Map<number, Category>();
  for (const category of categories) {
    table.set(category.id, {
      id: category.id,
      name: category.name,
      is_group: category.is_group,
      parent_id: category.parent_id,
      children: [],
    });
  }
  const roots: Category[] = [];
  for (const category of categories) {
    if (category.parent_id !== null) {
      const parent = table.get(category.parent_id);
      if (parent) {
        parent.children.push(table.get(category.id)!);
      }
    } else {
      roots.push(table.get(category.id)!);
    }
  }
  return { type: "Ok", categories: roots } as const;
}

const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  parent: categoryIdSchema.nullable(),
  is_group: z.boolean(),
});

async function createCategory(
  auth: z.input<typeof authSchema>,
  payload: z.input<typeof createCategorySchema>,
) {
  const { role } = await authSchema.parseAsync(auth);
  if (role !== "admin") {
    return { type: "Forbidden" } as const;
  }
  const { name, parent, is_group } = createCategorySchema.parse(payload);
  return await getNNDB()
    .transaction()
    .execute(async (db) => {
      if (parent) {
        const p = await db
          .selectFrom("categories")
          .select("is_group")
          .where("id", "=", parent.id)
          .executeTakeFirstOrThrow();
        if (!p.is_group) {
          return { type: "BadRequest", message: "the parent category is not a group" } as const;
        }
      }
      const id = await db
        .insertInto("categories")
        .values({ name, parent_id: parent?.id, is_group })
        .returning("id")
        .executeTakeFirst();
      return { type: "Ok", id } as const;
    });
}

async function deleteCategory(
  auth: z.input<typeof authSchema>,
  payload: z.input<typeof categoryIdSchema>,
) {
  const { role } = await authSchema.parseAsync(auth);
  if (role !== "admin") {
    return { type: "Forbidden" } as const;
  }
  const { id } = categoryIdSchema.parse(payload);
  return await getNNDB()
    .transaction()
    .execute(async (db) => {
      await db
        .deleteFrom("categories")
        .where("id", "=", id)
        .execute();
      return { type: "Ok" } as const;
    });
}

const updateCategorySchema = categoryIdSchema.extend({
  name: z.string().min(1).max(255).optional(),
  parent: categoryIdSchema.nullable().optional(),
  is_group: z.boolean().optional(),
});

async function updateCategory(
  auth: z.input<typeof authSchema>,
  payload: z.input<typeof updateCategorySchema>,
) {
  const { role } = await authSchema.parseAsync(auth);
  if (role !== "admin") {
    return { type: "Forbidden" } as const;
  }
  const { id, name, parent, is_group } = updateCategorySchema.parse(payload);
  return await getNNDB()
    .transaction()
    .execute(async (db) => {
      if (parent) {
        const p = await db
          .selectFrom("categories")
          .select("is_group")
          .where("id", "=", parent.id)
          .executeTakeFirstOrThrow();
        if (!p.is_group) {
          return { type: "BadRequest", message: "the parent category is not a group" } as const;
        }
      }
      if (is_group === true) {
        const articles = await db
          .selectFrom("article_categories")
          .select(eb => eb.fn.countAll<number>().as("count"))
          .where("category_id", "=", id)
          .executeTakeFirstOrThrow();
        if (articles.count > 0) {
          return { type: "BadRequest", message: "the category has articles" } as const;
        }
      }
      if (is_group === false) {
        const children = await db
          .selectFrom("categories")
          .select("id")
          .where("parent_id", "=", id)
          .execute();
        if (children.length > 0) {
          return { type: "BadRequest", message: "the category has children" } as const;
        }
      }
      await db
        .updateTable("categories")
        .set({
          name,
          parent_id: parent === null ? null : parent?.id,
          is_group,
        })
        .where("id", "=", id)
        .execute();
      return { type: "Ok" } as const;
    });
}
