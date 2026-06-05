# 🚀 POSH Training Portal — Setup Guide
### You'll have your portal live in ~30 minutes. No coding required.

---

## What you need to do (overview)
1. Create a free Supabase account (your database)
2. Create a free Vercel account (your hosting)
3. Create a free Resend account (email notifications)
4. Upload this code to GitHub (free, 2 minutes)
5. Connect everything and deploy

---

## STEP 1 — Set up your database (Supabase)

1. Go to **https://supabase.com** → click "Start your project" → sign up free
2. Click **"New project"**
   - Give it a name: `posh-portal`
   - Set a database password (save it somewhere safe)
   - Choose region: **Southeast Asia (Singapore)**
   - Click **Create new project** and wait ~1 minute
3. Once ready, click **SQL Editor** in the left sidebar
4. Click **New query**
5. Open the file `supabase-setup.sql` from this folder and **copy-paste all its contents** into the editor
6. Click **Run** — you should see "Success"
7. Now go to **Project Settings** (gear icon) → **API**
8. Copy and save these two values:
   - **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → this is your `SUPABASE_SERVICE_ROLE_KEY`

---

## STEP 2 — Set up email notifications (Resend)

1. Go to **https://resend.com** → sign up free
2. Click **API Keys** in the sidebar → **Create API Key**
   - Name: `posh-portal`
   - Click **Create**
3. Copy the key that appears (starts with `re_`) → this is your `RESEND_API_KEY`
4. **Important:** On the free plan, emails can only be sent to the email address you signed up with.
   - Your `ADMIN_EMAIL` should match your Resend signup email.
   - To send to any email later, you need to add a custom domain in Resend (optional, free).

---

## STEP 3 — Upload code to GitHub

1. Go to **https://github.com** → sign up free if you don't have an account
2. Click the **+** icon (top right) → **New repository**
   - Name: `posh-portal`
   - Keep it **Private**
   - Click **Create repository**
3. You'll see a page with instructions. Click **"uploading an existing file"** link
4. Drag and drop the entire `posh-portal` folder contents into the upload area
5. Click **Commit changes**

---

## STEP 4 — Deploy on Vercel (your live link)

1. Go to **https://vercel.com** → sign up free using your GitHub account
2. Click **Add New Project**
3. Find your `posh-portal` repository → click **Import**
4. You'll see a configuration screen. **Don't change anything** in Framework Preset
5. Click **Environment Variables** and add each of these one by one:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | (from Supabase Step 1) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (from Supabase Step 1) |
| `SUPABASE_SERVICE_ROLE_KEY` | (from Supabase Step 1) |
| `RESEND_API_KEY` | (from Resend Step 2) |
| `ADMIN_EMAIL` | your@email.com |
| `ADMIN_USERNAME` | admin |
| `ADMIN_PASSWORD` | Choose a strong password for yourself |

6. Click **Deploy**
7. Wait ~2 minutes → you'll get a link like `https://posh-portal-xyz.vercel.app` 🎉

---

## STEP 5 — Start using your portal

### Log in as admin
- Go to your Vercel link
- Username: `admin`
- Password: whatever you set as `ADMIN_PASSWORD`

### Add your first employee
1. In the admin panel, click **"Add employee"**
2. Fill in their name, username, password, company
3. Tick the courses they should take
4. Click **Add employee**
5. Share the portal link + their username + password with them

### Track completions
- The **Completion Report** tab shows who has completed what
- Click **Export Excel** to download a spreadsheet
- You'll get an email every time someone completes a course

---

## Your portal pages

| Page | URL |
|---|---|
| Employee login | `your-link.vercel.app/login` |
| Employee dashboard | `your-link.vercel.app/dashboard` |
| Admin panel | `your-link.vercel.app/admin` |

---

## Need help?

If you get stuck at any step, take a screenshot and share it — happy to help you troubleshoot!
