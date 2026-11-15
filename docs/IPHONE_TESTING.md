# Testing DAMPD on your iPhone with Expo Go

Every step here can be done from Safari on the iPad and the iPhone. You don't need a terminal.

How it works: GitHub Actions bundles the app's JavaScript and publishes it to Expo's servers as an **EAS Update**. Expo Go on your phone downloads and runs that update. Nothing has to run on your network.

---

## One-time setup (about 10 minutes)

### 1. Check that Expo Go matches the project's SDK

- Install or update **Expo Go** from the App Store on your iPhone.
- In Expo Go, open **Settings** and find the supported SDK version. It needs to be **SDK 58**, which is the version this project uses. If it shows something else, stop and tell Claude. The project would have to be re-pinned.

### 2. Get the EAS project ID from expo.dev

You've already created the `dampd` project on expo.dev. To copy its ID:

1. Go to <https://expo.dev> in Safari and sign in.
2. Open **Projects → dampd**.
3. The **Project ID** is a UUID like `3a73d776-f45f-445f-b246-xxxxxxxxxxxx`. It's on the project overview page (also under **Project settings**), and inside the `eas init --id …` command on the "Get your project started" page.
4. Copy the **whole** ID. It's 36 characters: 8-4-4-4-12.

> If you ever need to create the project again: on expo.dev choose **Create a project**, name it `dampd`, and make sure the slug is `dampd`, because it has to match `"slug"` in `app.json`.

### 3. Paste the project ID into `app.json`

On github.com, in Safari:

1. Open the repo, then `app.json`, then the pencil icon (**Edit**). For a PR branch, switch to that branch first.
2. Replace **both** occurrences of `REPLACE_WITH_EAS_PROJECT_ID` with your ID:
   ```json
   "updates": { "url": "https://u.expo.dev/<YOUR-PROJECT-ID>" },
   "extra": { "eas": { "projectId": "<YOUR-PROJECT-ID>" } }
   ```
3. **Commit changes**.

(Or just send the ID to Claude in chat and it'll commit it for you. The project ID isn't a secret.)

### 4. Create an Expo access token and save it as a GitHub secret

1. On expo.dev, open your avatar, then **Account settings → Access tokens → Create token**. Name it `github-actions-dampd`, then copy the token. **It's only shown once.**
2. On github.com, open the repo, then **Settings → Secrets and variables → Actions → New repository secret**.
   - **Name:** `EXPO_TOKEN`
   - **Secret:** paste the token
3. **Add secret**.

Never paste this token into chat or into a file in the repo.

> A note on the "GitHub" connection on expo.dev: linking the repo there is used for EAS Build/Workflows triggered by Expo. It doesn't replace the `EXPO_TOKEN` secret, which is what this repo's GitHub Actions workflow uses to publish updates.

---

## Every time: get a build onto your phone

### From a pull request

1. Push commits to the PR branch, or open the PR.
2. On the PR, open the **Checks** tab. Wait for **EAS Update / Publish EAS Update** to go green. It usually takes 2–4 minutes.
3. A bot comment appears on the PR with a **QR code**. Later pushes update the same comment.
4. Open that PR comment **on your iPad** and **scan the QR code with your iPhone's Camera app**, then tap the banner. It opens in Expo Go.
   - Already on the iPhone? Tap the QR image. It opens a page on qr.expo.dev / expo.dev with an "Open in Expo Go" option.
5. The first launch downloads the bundle (a few seconds). The app opens on the Home tab with the seeded KX250.

### From main (after merging)

1. Merge the PR. The **EAS Update** workflow runs on `main`.
2. Open **Actions → EAS Update → (latest run)**. The run **Summary** shows the QR code and a link to the update page on expo.dev.
3. Scan or open it the same way as above.

You can also find every update on **expo.dev → dampd → Updates**. Tap one, then use **Preview → Open in Expo Go**.

### Re-running

On the **Actions** tab, select **EAS Update** and press **Run workflow** to publish again without a new commit.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Workflow is green but says "EAS Update skipped" | Step 3 or 4 isn't done (placeholder still in `app.json`, or no `EXPO_TOKEN` secret). |
| `Invalid project ID` / `Entity not authorized` | The ID in `app.json` is wrong or incomplete, or the token belongs to a different Expo account than the project. |
| Expo Go says the project is incompatible with this version of Expo Go | Expo Go's SDK doesn't match SDK 58. Check step 1. |
| QR opens Safari, not Expo Go | Make sure Expo Go is installed, then use the "Open in Expo Go" button on the page. |
| Your data disappeared | Data is stored on the phone, inside Expo Go. Deleting Expo Go or clearing its data erases it. There's no cloud sync yet. |
