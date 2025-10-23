# Security Guidelines

## Files That Must NEVER Be Committed

The following files contain sensitive credentials and are excluded via `.gitignore`:

### Environment Files
- `.env` - Main environment file with DB credentials and API keys
- `.env.local` - Local development overrides
- `.env.production` - Production environment file
- `.env.caprover` - CapRover deployment credentials
- `backend/.env*` - Any backend environment files
- `frontend/.env*` - Any frontend environment files (except .env.example)

### Deployment Files
- `deploy/CAPROVER_ENV_VALUES.txt` - Contains actual DB passwords and API keys
- `deploy/ENVIRONMENT_VARIABLES.md` - Contains actual credentials
- `deploy/caprover/deploy.tar.gz` - Deployment tarball

### Build Artifacts
- `backend/main` - Compiled Go binary
- `backend/bin/` - Build artifacts
- `database/data/` - Local database data

---

## Safe Template Files (OK to Commit)

These are example files without real credentials:
- `.env.example` - Template for environment variables
- `.env.production.example` - Production template
- `deploy/CAPROVER_ENV_VALUES.txt.example` - CapRover template
- `deploy/ENVIRONMENT_VARIABLES.example.md` - Documentation template

---

## Before Every Commit

Run this checklist:

```bash
# 1. Check git status
git status

# 2. Verify no sensitive files are staged
git status --ignored

# 3. Check for sensitive data in staged changes
git diff --cached | grep -E "API_KEY|PASSWORD|SECRET"

# 4. If found, reset and update .gitignore
git reset <file>
echo "<file>" >> .gitignore
```

---

## Sensitive Data Patterns to Watch For

Never commit files containing:

### Database Credentials
- `DB_PASSWORD=...`
- Connection strings like: `postgresql://user:password@host:port/db`

### API Keys
- `GOOGLE_API_KEY=AIza...`
- `OPENAI_API_KEY=sk-proj-...`
- `ANTHROPIC_API_KEY=sk-ant-...`

### Secrets
- JWT secrets
- Session secrets
- Encryption keys

---

## What's Currently Protected

✅ **Properly Ignored:**
- `.env` (contains real DB password and API key)
- `.env.caprover` (contains production credentials)
- `backend/.env` and `backend/.env.production`
- `deploy/CAPROVER_ENV_VALUES.txt` (real credentials)
- `deploy/ENVIRONMENT_VARIABLES.md` (real credentials)
- `deploy/caprover/deploy.tar.gz` (may contain sensitive data)

✅ **Safe to Commit:**
- `deploy.sh` (no credentials)
- `deploy/CAPROVER_DEPLOYMENT.md` (documentation only)
- `deploy/CAPROVER_ENV_VALUES.txt.example` (template)
- `deploy/ENVIRONMENT_VARIABLES.example.md` (template)
- `deploy/caprover/captain-definition` (Docker config, no secrets)
- `.env.example` (template)
- `.env.production.example` (template)

---

## If You Accidentally Commit Secrets

If you accidentally commit sensitive data:

### 1. Remove from Git History (Immediately)

```bash
# Remove file from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch <FILE_PATH>" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (if already pushed)
git push origin --force --all
```

### 2. Rotate All Exposed Credentials

- **Database Password**: Change immediately in your database
- **API Keys**: Revoke and generate new keys:
  - Google API: https://console.cloud.google.com/apis/credentials
  - OpenAI: https://platform.openai.com/api-keys
  - Anthropic: https://console.anthropic.com/settings/keys

### 3. Update Everywhere

- Update `.env` files locally
- Update CapRover environment variables
- Redeploy applications

---

## Current .gitignore Protection

```gitignore
# Environment files (contain sensitive credentials)
.env
.env.local
.env.production
.env.caprover
.env.*.local
backend/.env
backend/.env.production
backend/.env.local
frontend/.env
frontend/.env.local
frontend/.env.production

# Sensitive deployment files (contain API keys and passwords)
deploy/CAPROVER_ENV_VALUES.txt
deploy/ENVIRONMENT_VARIABLES.md

# CapRover deployment artifacts
deploy/caprover/deploy.tar.gz
```

---

## Verification Commands

### Check what will be committed
```bash
git status
git diff --cached
```

### Check for ignored files
```bash
git status --ignored
```

### Search staged files for sensitive patterns
```bash
git diff --cached | grep -i "password\|api_key\|secret"
```

### Verify a file is ignored
```bash
git check-ignore -v <filename>
```

---

## Team Guidelines

1. **Never share `.env` files** via Slack, email, or any public channel
2. **Use password managers** for storing credentials (1Password, Bitwarden, etc.)
3. **Use environment variables** in production, never hardcode secrets
4. **Rotate credentials** every 90 days
5. **Review all commits** before pushing
6. **Enable GitHub secret scanning** in repository settings

---

## Emergency Contacts

If credentials are leaked:
1. Immediately revoke/rotate all exposed credentials
2. Notify the team
3. Update all environments
4. Monitor for unauthorized access

---

## Additional Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [git-secrets](https://github.com/awslabs/git-secrets) - Prevent committing secrets
- [gitleaks](https://github.com/gitleaks/gitleaks) - Detect secrets in git repos
