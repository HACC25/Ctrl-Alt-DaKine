# Fix 403 Forbidden Error - Enable Vertex AI

Your service account needs access to Vertex AI. Run these commands:

## 1. Enable Vertex AI API
```bash
gcloud services enable aiplatform.googleapis.com --project=sigma-night-477219-g4
```

## 2. Grant your service account the necessary role
```bash
gcloud projects add-iam-policy-binding sigma-night-477219-g4 \
    --member="serviceAccount:vertex-express@sigma-night-477219-g4.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

## Alternative: Use the Google Cloud Console

If you don't have gcloud CLI installed:

1. Go to https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=sigma-night-477219-g4
2. Click "ENABLE" to enable the Vertex AI API

3. Go to https://console.cloud.google.com/iam-admin/iam?project=sigma-night-477219-g4
4. Find your service account: `vertex-express@sigma-night-477219-g4.iam.gserviceaccount.com`
5. Click the pencil icon to edit
6. Add role: "Vertex AI User" (or `roles/aiplatform.user`)
7. Save

After enabling and granting permissions, restart your backend server and try again!
