# Setting up your Windows computer

## For Stage 0 you only need two things

You do **not** need Node.js or any coding tools yet. That comes in Stage 1.

1. **A free GitHub account** at github.com.
2. **Git for Windows** from git-scm.com. Accept the default options in the installer.

(Optional but handy: **Visual Studio Code** from code.visualstudio.com, for reading the files comfortably.)

## A privacy tip before you start

Git stamps every saved change with a name and an email address, and on a public GitHub project **anyone can see them**. Use GitHub's private "no-reply" email instead of your real one:

1. On GitHub, open **Settings > Emails**.
2. Tick **Keep my email addresses private**.
3. Copy the address shown, which looks like `12345678+yourname@users.noreply.github.com`.

You can also tick **Block command line pushes that expose my email**.

## Steps

1. **Tell Git who you are** (once only). Open **PowerShell** from the Start menu and type these two lines, with your own details:
   ```
   git config --global user.name "Your Name or Username"
   git config --global user.email "12345678+yourname@users.noreply.github.com"
   ```
2. **Create the project on GitHub.** Click **New repository**. Name it `breathe`. Choose **Public**. Leave "Add a README" and the other options **unticked**, because we already have our own. Click **Create repository**.
3. **Unzip** the Stage 0 folder somewhere you can find it, for example `Documents`.
4. **Open PowerShell inside that folder.** In File Explorer, open the `breathe` folder, click the address bar, type `powershell` and press Enter.
5. **Run these commands one at a time:**
   ```
   git init -b main
   git add .
   git commit -m "Stage 0: foundations"
   git remote add origin https://github.com/YOUR-USERNAME/breathe.git
   git push -u origin main
   ```
   A window may open asking you to sign in to GitHub. That is normal, and it is Git for Windows asking safely. You never type your password into Breathe.

## What those commands do

| Command | In plain English |
|---|---|
| `git init -b main` | Turns this folder into a Git project |
| `git add .` | Gets all the files ready to be saved |
| `git commit -m "..."` | Saves a snapshot, with a short note |
| `git remote add origin ...` | Tells Git where the GitHub copy lives |
| `git push -u origin main` | Uploads the snapshot to GitHub |

If anything shows an error, copy the message to me and I will explain it.
