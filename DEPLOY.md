# Deployment Guide (PHP & MySQL)

This guide explains how to deploy PromptForge to a shared hosting environment (e.g., HostGator, Bluehost, Namecheap) running PHP and MySQL.

## Prerequisites
1.  A web server with PHP 7.4+ installed.
2.  A MySQL or MariaDB database.
3.  Access to a File Manager or FTP.

---

## Step 1: Frontend Build (React)

Since browsers cannot run `.tsx` files directly, you must build the React application into static HTML/JS/CSS files.

1.  **Environment Variables**: 
    Ensure you have your Gemini API Key ready. If using a build tool like Vite, Create React App, or Parcel, set the key in your environment file (e.g., `.env`) before building:
    ```
    REACT_APP_API_KEY=your_gemini_api_key
    ```
    *Note: The app code expects the key to be injected via `process.env.API_KEY`.*

2.  **Build**:
    Run your build command locally:
    ```bash
    npm run build
    ```
    This creates a `dist` or `build` folder containing `index.html` and bundled assets.

---

## Step 2: Database Setup

1.  Log in to your hosting control panel (e.g., cPanel).
2.  Go to **MySQL Databases** and create a new database (e.g., `myuser_promptforge`).
3.  Create a database user and assign it to that database with full privileges.
4.  Open **phpMyAdmin**, select your new database, and run the SQL script found in `api/schema.txt` (or copy/paste the SQL below):

```sql
CREATE TABLE IF NOT EXISTS `prompt_blocks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `tag` varchar(100) NOT NULL,
  `subTag` varchar(100) DEFAULT NULL,
  `createdAt` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prompt_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `generated_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` longtext NOT NULL,
  `prompt` text,
  `timestamp` bigint(20) DEFAULT NULL,
  `seed` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `saved_prompts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `timestamp` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## Step 3: Server Configuration

1.  **Upload API Files**:
    *   Create a folder named `api` in your public web directory (e.g., `public_html/api` or `public_html/promptforge/api`).
    *   Upload `api/index.txt`, `api/config.txt`, and `api/htaccess.txt`.

2.  **Rename Files**:
    *   Rename `api/index.txt` -> `api/index.php`
    *   Rename `api/config.txt` -> `api/config.php`
    *   Rename `api/htaccess.txt` -> `api/.htaccess` (Ensure the dot is at the start).

3.  **Configure Database Connection**:
    *   Edit `api/config.php` on the server.
    *   Fill in your Host (usually `localhost`), Database Name, Username, and Password.

---

## Step 4: Upload Frontend

1.  Take the **contents** of your local `dist` or `build` folder (from Step 1).
2.  Upload them to the parent folder of your `api` directory.
    
    **Example Structure:**
    ```
    public_html/
    ├── index.html        (From build)
    ├── assets/           (From build)
    └── api/              (Created in Step 3)
        ├── index.php
        ├── config.php
        └── .htaccess
    ```

## Troubleshooting

*   **404 on API calls**: Check that the `api` folder exists and contains `index.php`. Check that `services/storage.ts` was built with the correct path (defaults to `./api`).
*   **Database Error**: Open `api/config.php` and verify credentials.
*   **White Screen**: Open browser console (F12). If you see 404s for .js files, ensure you uploaded the `assets` folder correctly.
