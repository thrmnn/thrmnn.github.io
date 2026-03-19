# Push Mission Control to GitHub

**Le code est prêt à pusher vers ton repo!**

Repo: `https://github.com/thrmnn/missioncontrol`

---

## Option A: Via Laptop (Plus Simple - 1 minute)

Quand tu auras accès à ton laptop:

```bash
cd ~/clawd/mission-control
git push -u origin master
```

Ça devrait marcher immédiatement si tu as GitHub CLI configuré ou SSH keys.

---

## Option B: Via Mobile (Upload Manuel - 5 minutes)

### Méthode: Upload ZIP sur GitHub

1. **Crée un ZIP du code:**

Je vais créer un fichier ZIP pour toi (voir ci-dessous).

2. **Ouvre GitHub sur mobile:**

👉 https://github.com/thrmnn/missioncontrol

3. **Upload files:**
- Tap "Add file" → "Upload files"
- Upload le ZIP
- GitHub va extraire automatiquement

---

## Option C: GitHub CLI (Si configuré)

Si tu as `gh` installé:

```bash
cd ~/clawd/mission-control
gh auth login
git push -u origin master
```

---

## ⚡ Je crée un ZIP pour toi maintenant

Attends 30 secondes...

---

## Valeurs Convex pour Vercel

Quand tu déploies sur Vercel, utilise:

```
CONVEX_DEPLOYMENT=prod:fearless-magpie-92
NEXT_PUBLIC_CONVEX_URL=https://fearless-magpie-92.convex.cloud
```

**Important:** Le deployment ID devrait être `prod:fearless-magpie-92` (avec "prod:" devant)

Si ça ne marche pas, essaie aussi: `dev:fearless-magpie-92`

---

## Next Steps

1. ✅ Convex setup (fait!)
2. ⏳ Push code to GitHub (en cours)
3. ⏳ Deploy to Vercel
4. ⏳ Seed database

On y est presque! 🚀
