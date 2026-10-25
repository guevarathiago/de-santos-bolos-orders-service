# De Santos Bolos · Orders Service

Orders microservice for **De Santos Bolos**, a cake shop in Santos/SP. It owns the product catalog and the customer orders.

It is an internal service: its only client is the De Santos Bolos back-end (a separate repository), whose chat assistant (a LangGraph agent) uses it to show the menu, place orders for logged-in customers and let admins follow them.

```
Browser ──► De Santos Bolos back-end ──(x-api-key)──► Orders Service ──► PostgreSQL (own database)
            (auth, chat agent, RAG)                   (products, orders)
```

## Stack

Node.js 22 · TypeScript · Express 5 · TypeORM · PostgreSQL 17 · Zod · Vitest + Supertest

## Design choices

- **Database per service.** Orders have their own PostgreSQL database. The user id comes from the main back-end, so `Order.userId` is a plain id with no foreign key.
- **Internal API key.** Every route except `/health` needs the `x-api-key` header, compared in constant time.
- **Trusted caller.** The service does not authenticate customers; the main back-end does, and sends the `userId`. Passing `userId` when reading one order makes the service check ownership (another user's order answers 404).
- **Price snapshot.** Each item copies the product name and price at order time, so later menu changes do not rewrite past orders.
- **Money in cents** (`integer`) to avoid floating point rounding.
- **Status machine.** `PENDING → CONFIRMED → PREPARING → READY → DELIVERED`, and `PENDING`/`CONFIRMED → CANCELLED`. Any other change answers 409.
- **Store calendar.** Menu cakes need 24 hours of notice, so delivery must be after today, counted in the `America/Sao_Paulo` time zone.

## API

All routes except `/health` require `x-api-key`.

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/products?available=true` | List products |
| POST | `/products` | Create a product `{ name, description?, priceCents, available? }` |
| POST | `/orders` | Create an order `{ userId, deliveryDate, items: [{ productId, quantity }], notes? }` |
| GET | `/orders?userId=&status=` | List orders, newest first (up to 50) |
| GET | `/orders/:id?userId=` | One order; with `userId`, only if it belongs to that user |
| PATCH | `/orders/:id/status` | Change the status `{ status }` |

Errors: `400` invalid input, `401` missing or wrong key, `404` not found, `409` status change not allowed, `422` business rule (product unavailable, delivery date).

## Running locally

```bash
docker compose up -d           # PostgreSQL on localhost:5434
cp .env.example .env           # then set INTERNAL_API_KEY to a long random string
npm ci
npm run migration:run
npm run seed:products          # sample menu (placeholder prices)
npm run dev                    # http://localhost:3001
```

The same `INTERNAL_API_KEY` goes into the De Santos Bolos back-end `.env`.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start in watch mode |
| `npm test` | Run the tests |
| `npm run typecheck` | Type-check without emitting |
| `npm run migration:run` / `migration:revert` / `migration:show` | Manage the schema |
| `npm run seed:products` | Insert the sample menu when the catalog is empty |
