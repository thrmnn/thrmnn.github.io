# Website Publication Roadmap

This document outlines all steps needed before publishing your personal academic website, prioritized by importance.

## ✅ Phase 1: Core Identity & Configuration - COMPLETED

### 1.1 Personal Information ✅
- [x] Update name in site configuration files
- [x] Update centralized personal information file (`PERSONAL_INFO.md`)
- [x] Update baseURL in `config/_default/hugo.yaml` to match your GitHub username/repository
- [x] Update site title and description in `config/_default/params.yaml`

### 1.2 Author Profile Identity ✅
- [x] Update name fields (first_name, last_name, display_name)
- [x] Update role/tagline
- [x] Update organizations/affiliations
- [x] Update contact information (email, GitHub)
- [x] Remove template tracking IDs (Google Analytics)
- [x] Remove template files (chen_resume.pdf)
- [x] **Remove all template publications** - All template publication directories have been deleted

---

## 🔥 PRIORITY 1: Complete Personal Information & Author Profile (DO THIS FIRST)

**Status:** In Progress - Template cleanup done, now need your actual information

### 1.1 Complete PERSONAL_INFO.md
**Critical Fields to Fill:**
- [ ] **Education**: Add your actual education history (MSc from EPFL, BSc dates, etc.)
- [ ] **Work Experience**: Add your work history (founding researcher at MIT Senseable City Rio, previous positions)
- [ ] **Research Interests**: Replace template interests with your actual research areas
- [ ] **Biography**: Write your "About Me" section (2-3 paragraphs)
- [ ] **Social Media**: Add your Twitter/X, LinkedIn, Google Scholar URLs (if you have them)
- [ ] **Hero Title**: Update to your preferred tagline

**After filling PERSONAL_INFO.md:**
```bash
python3 sync_personal_info.py
hugo server  # Test locally
```

**Why This is Priority 1:** This populates the main author profile that appears on your homepage. Visitors see this first.

---

## 📰 PRIORITY 2: Update News Section

**Status:** Contains template news entries with publication links that need to be removed

### 2.1 Homepage News Section
- [ ] Review news section in `content/_index.md`
- [ ] **Remove all publication links** from news entries (e.g., `/publication/corl2025-3`, `/publication/icra2025`, etc.)
- [ ] Remove or adapt template news entries to reflect your actual activities
- [ ] Add your own recent news, achievements, and updates
- [ ] Format dates correctly (YYYY-MM-DD or YYYY format)

**Why This is Priority 2:** Shows visitors what you've been doing recently and keeps the site current. Note: The news section currently contains many template entries with publication links that should be removed or replaced with your actual news.

---

## 🎤 PRIORITY 3: Update Events & Talks

**Status:** Template event entries present

### 3.1 Events/Talks Section
- [ ] Review events in `content/event/`
- [ ] Remove template events or adapt for your talks
- [ ] Add your actual conference presentations, workshops, invited talks
- [ ] Update event details (date, location, title, description)
- [ ] Or remove this section entirely if not applicable

**Why This is Priority 3:** Important for showcasing your conference participation and speaking engagements (if applicable).

---

## 🤖 PRIORITY 4: Update Robotic Platforms Section (If Applicable)

**Status:** Template platform entries present

### 4.1 Platforms You've Worked With
- [ ] Review platforms in `content/platform/`
- [ ] Remove platforms you haven't worked with
- [ ] Update descriptions for platforms you have used
- [ ] Add images/videos if available
- [ ] Or remove this section entirely if not relevant

**Why This is Priority 4:** Less critical unless platforms are central to your research presentation.

---

## 📚 PRIORITY 5: Update or Remove Teaching Section

**Status:** Contains template teaching examples

### 5.1 Teaching Materials
- [ ] Review `content/teaching/` entries
- [ ] Either:
  - Replace with your actual teaching materials, OR
  - Remove the section if not applicable
- [ ] Update course descriptions and content

**Why This is Priority 5:** Only needed if teaching is part of your professional profile.

---

## 🖼️ PRIORITY 6: Media Assets & Visual Content

### 6.1 Images & Media
- [x] Hero background image updated to `hero_picture.jpg`
- [ ] **Add/update profile photo** (`content/authors/admin/avatar.png`)
- [ ] Review all images in `assets/media/`
- [ ] Add project screenshots/demos if available
- [ ] Optimize image sizes for web performance

### 6.2 Documents
- [x] CV/resume file: `static/uploads/resume.pdf` exists
- [ ] **Verify resume PDF is your actual CV** (not template)
- [ ] Add any other documents (certificates, etc.) if needed

**Why This is Priority 6:** Visual content enhances the site but can be added incrementally.

---

## 🔧 PRIORITY 7: Technical Configuration & Testing

### 7.1 GitHub Repository
- [x] Repository name: `thrmnn.github.io` ✓
- [x] Base URL configured ✓
- [ ] Configure GitHub Pages settings (if not auto-deploying)
- [ ] Set up custom domain (optional, if you have one)
- [ ] Verify repository is public (if using GitHub Pages)

### 7.2 Local Testing
- [ ] Test local build: `hugo server`
- [ ] Verify all links work correctly
- [ ] Check responsive design on mobile devices
- [ ] Test in different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify dark/light theme switching works
- [ ] Test all interactive elements

### 7.3 Deployment
- [ ] Set up CI/CD (GitHub Actions or Netlify) if not automatic
- [ ] Verify deployment works
- [ ] Test live site after deployment
- [ ] Configure custom domain (if using)

**Why This is Priority 7:** Technical setup can happen in parallel with content updates, but needs to be done before launch.

---

## 📊 PRIORITY 8: SEO & Analytics (Optional but Recommended)

### 8.1 Analytics Setup
- [ ] Set up Google Analytics account (if desired)
- [ ] Add your Google Analytics ID to `config/_default/params.yaml`
- [ ] Set up Google Search Console
- [ ] Configure other analytics tools if needed

### 8.2 SEO Optimization
- [x] SEO description updated ✓
- [ ] Review meta keywords if needed
- [ ] Verify Open Graph tags work
- [ ] Test with SEO tools (Google PageSpeed, etc.)
- [ ] Submit sitemap to search engines

**Why This is Priority 8:** Can be done after launch, but helpful for visibility.

---

## ✅ PRIORITY 9: Final Review & Launch

### 9.1 Content Quality Check
- [ ] Proofread all text content
- [ ] Check grammar and spelling
- [ ] Verify all dates are correct
- [ ] Ensure consistent formatting
- [ ] Review "About Me" section for accuracy
- [ ] Verify all contact information is correct

### 9.2 Navigation & Links
- [ ] Test all internal links
- [ ] Verify external links work
- [ ] Check footer information
- [ ] Review menu structure
- [ ] **Remove any broken publication links** from news/content sections

### 9.3 Legal & Attribution
- [x] LICENSE.md reviewed (MIT license for template) ✓
- [ ] Check attribution for any borrowed content/images
- [ ] Verify copyright notices

### 9.4 Pre-Launch Checklist
- [ ] All placeholder content removed
- [ ] All personal information updated
- [ ] All social links working
- [ ] CV/resume accessible and current
- [ ] No broken links (especially publication links)
- [ ] Images optimized and loading correctly
- [ ] Site loads quickly
- [ ] Mobile responsive design verified

### 9.5 Launch
- [ ] Final content review
- [ ] Deploy to production
- [ ] Verify live site works correctly
- [ ] Submit to search engines (Google, Bing)
- [ ] Share on social media
- [ ] Announce to colleagues/network

---

## 📋 Quick Reference: What to Do Right Now

**Next 3 Steps (In Order):**

1. **Fill out PERSONAL_INFO.md completely** - especially:
   - Education history with dates
   - Work experience with dates
   - Research interests
   - Biography text

2. **Run sync script and test:**
   ```bash
   python3 sync_personal_info.py
   hugo server
   ```

3. **Clean up news section** - Remove all publication links and template news entries from `content/_index.md`

**After that, work through priorities 2-9 as time permits.**

---

## Maintenance Tasks (Post-Launch)

### Ongoing Updates
- [ ] Add new events/talks (if applicable)
- [ ] Update news section regularly
- [ ] Keep CV/resume current
- [ ] Update work experience and education as needed
- [ ] Review analytics periodically
- [ ] Keep dependencies up to date (Hugo, theme updates)

---

## Status Legend

- ✅ Completed
- [ ] Pending
- 🔥 High Priority - Do This First
- ⚠️ Important but can wait
- 📝 Optional/Nice to have

---

**Last Updated:** 2025-01-XX  
**Current Phase:** Priority 1 - Completing Personal Information
