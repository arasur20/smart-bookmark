# Smart Bookmark App

## 🚀 Project Overview

Smart Bookmark is a realtime bookmark management app built with **Next.js (App Router)** and **Supabase**.

Users can:

* Sign in using Google OAuth
* Add and delete bookmarks
* See realtime updates across multiple tabs
* Access only their own bookmarks (secured with RLS)

---

## 🧰 Tech Stack

* **Frontend:** Next.js (App Router)
* **Styling:** Tailwind CSS
* **Backend & Database:** Supabase (PostgreSQL)
* **Authentication:** Google OAuth (Supabase Auth)
* **Realtime:** Supabase Realtime
* **Deployment:** Vercel

---

## ✨ Features

* Google OAuth login (Signup + Login handled automatically)
* Private bookmarks per user
* Add / Delete bookmarks
* Realtime sync across tabs
* URL validation
* Loading indicator while fetching data
* Logout functionality

---

## 🧱 Database Schema

```sql
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  url text not null,
  created_at timestamp default now()
);
```

---

## 🔐 Row Level Security (RLS)

RLS ensures users can only access their own data.

```sql
alter table bookmarks enable row level security;
```

Policies:

```sql
create policy "select own bookmarks"
on bookmarks for select
using (auth.uid() = user_id);

create policy "insert own bookmarks"
on bookmarks for insert
with check (auth.uid() = user_id);

create policy "delete own bookmarks"
on bookmarks for delete
using (auth.uid() = user_id);
```

---

## ⚡ Problems Faced & Solutions

### 1️⃣ Google OAuth redirect error

**Problem:** `redirect_uri_mismatch`

**Solution:**

* Added Supabase callback URL in Google Cloud Console:

```
https://PROJECT_ID.supabase.co/auth/v1/callback
```

---

### 2️⃣ Insert blocked (403 Forbidden)

**Problem:** RLS prevented inserting bookmarks.

**Solution:**

* Added `user_id: user.id` while inserting bookmarks.

---

### 3️⃣ Realtime delete not syncing across tabs

**Problem:** DELETE events were not updating other tabs.

**Solution:**

* Enabled replication:

```sql
ALTER TABLE bookmarks REPLICA IDENTITY FULL;
```

* Refetched bookmarks on realtime change events.

---

### 4️⃣ Inconsistent bookmark ordering

**Problem:** New bookmarks appeared at bottom in some tabs.

**Solution:**

* Added ordering:

```ts
.order("created_at", { ascending: false })
```

---

## 🧪 Local Setup

```bash
npm install
npm run dev
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

## 🌐 Deployment

The app is deployed on **Vercel**.

---
