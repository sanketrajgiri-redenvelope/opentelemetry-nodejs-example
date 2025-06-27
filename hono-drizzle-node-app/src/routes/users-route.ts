import { Hono } from "hono";
import { db } from "../db/index.js";
import { usersTable } from "../db/schema.js";
import { eq } from "drizzle-orm/expressions";
import logger from "../logger.js";

// create users route
const usersRoute = new Hono();

// get all users
usersRoute.get("/", async (c) => {
  logger.info("Received request at /users");
  const users = await db.select().from(usersTable);
  return c.json(users);
});

// create a new user
usersRoute.post("/", async (c) => {
  logger.info("Received request to create a new user");
  const { name, age, email } = await c.req.json();
  const newUser = await db.insert(usersTable).values({ name, age, email });
  return c.json(newUser);
});

// get a user by id
usersRoute.get("/:id", async (c) => {
  logger.info("Received request to get user by id");
  const { id } = c.req.param();
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, Number(id)));
  return c.json(user);
});

// update a user by id
usersRoute.put("/:id", async (c) => {
  logger.info("Received request to update user by id");
  const { id } = c.req.param();
  const { name, age, email } = await c.req.json();
  const updatedUserResult = await db
    .update(usersTable)
    .set({ name, age, email })
    .where(eq(usersTable.id, Number(id)));

  // error if not found
  if (!updatedUserResult) {
    logger.error(`User with id ${id} not found`);
    return c.json({ error: "User not found" }, 404);
  }

  // else get updated user
  const updatedUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, Number(id)));

  logger.info(`User with id ${id} updated successfully`);

  return c.json(updatedUser);
});

// delete a user by id
usersRoute.delete("/:id", async (c) => {
  const { id } = c.req.param();
  logger.info(`Received request to delete user with id ${id}`);
  const deletedUser = await db
    .delete(usersTable)
    .where(eq(usersTable.id, Number(id)));
  logger.info(`User with id ${id} deleted successfully`);
  return c.json(deletedUser);
});



export default usersRoute;