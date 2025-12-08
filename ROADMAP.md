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

## 🎯 PRIORITY 2: Replace Template Publications with Your Own

**Status:** Template publications still present (contain "Li, Chenhao")

### 2.1 Review Publication Structure
- [ ] Understand how publications are organized in `content/publication/`
- [ ] Review one example publication to see the format
- [ ] Check BibTeX citation format in `cite.bib` files

### 2.2 Add Your Publications
- [ ] Remove template publications (or keep as examples if helpful)
- [ ] Create new publication entries for your actual papers
- [ ] Add PDF files to publication folders
- [ ] Update BibTeX citations with your name as author
- [ ] Add publication images/figures if available

**Why This is Priority 2:** Publications are a core part of an academic website and visitors expect to see your research.

---

## 📰 PRIORITY 3: Update News Section

**Status:** Contains template news entries

### 3.1 Homepage News Section
- [ ] Review news section in `content/_index.md`
- [ ] Remove or adapt template news entries
- [ ] Add your own recent news, achievements, paper acceptances
- [ ] Format dates correctly (YYYY-MM-DD or YYYY format)

**Why This is Priority 3:** Shows visitors what you've been doing recently and keeps the site current.

---

## 🎤 PRIORITY 4: Update Events & Talks

**Status:** Template event entries present

### 4.1 Events/Talks Section
- [ ] Review events in `content/event/`
- [ ] Remove template events or adapt for your talks
- [ ] Add your actual conference presentations, workshops, invited talks
- [ ] Update event details (date, location, title, description)

**Why This is Priority 4:** Important for showcasing your conference participation and speaking engagements.

---

## 🤖 PRIORITY 5: Update Robotic Platforms Section (If Applicable)

**Status:** Template platform entries present

### 5.1 Platforms You've Worked With
- [ ] Review platforms in `content/platform/`
- [ ] Remove platforms you haven't worked with
- [ ] Update descriptions for platforms you have used
- [ ] Add images/videos if available
- [ ] Or remove this section entirely if not relevant

**Why This is Priority 5:** Less critical unless platforms are central to your research presentation.

---

## 📚 PRIORITY 6: Update or Remove Teaching Section

**Status:** Contains template teaching examples

### 6.1 Teaching Materials
- [ ] Review `content/teaching/` entries
- [ ] Either:
  - Replace with your actual teaching materials, OR
  - Remove the section if not applicable
- [ ] Update course descriptions and content

**Why This is Priority 6:** Only needed if teaching is part of your professional profile.

---

## 🖼️ PRIORITY 7: Media Assets & Visual Content

### 7.1 Images & Media
- [x] Hero background image updated to `hero_picture.jpg`
- [ ] **Add/update profile photo** (`content/authors/admin/avatar.png`)
- [ ] Review all images in `assets/media/`
- [ ] Add publication figures and images
- [ ] Add project screenshots/demos if available
- [ ] Optimize image sizes for web performance

### 7.2 Documents
- [x] CV/resume file: `static/uploads/resume.pdf` exists
- [ ] **Verify resume PDF is your actual CV** (not template)
- [ ] Add any other documents (certificates, etc.) if needed

**Why This is Priority 7:** Visual content enhances the site but can be added incrementally.

---

## 🔧 PRIORITY 8: Technical Configuration & Testing

### 8.1 GitHub Repository
- [x] Repository name: `theoh-io.github.io` ✓
- [x] Base URL configured ✓
- [ ] Configure GitHub Pages settings (if not auto-deploying)
- [ ] Set up custom domain (optional, if you have one)
- [ ] Verify repository is public (if using GitHub Pages)

### 8.2 Local Testing
- [ ] Test local build: `hugo server`
- [ ] Verify all links work correctly
- [ ] Check responsive design on mobile devices
- [ ] Test in different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify dark/light theme switching works
- [ ] Test all interactive elements

### 8.3 Deployment
- [ ] Set up CI/CD (GitHub Actions or Netlify) if not automatic
- [ ] Verify deployment works
- [ ] Test live site after deployment
- [ ] Configure custom domain (if using)

**Why This is Priority 8:** Technical setup can happen in parallel with content updates, but needs to be done before launch.

---

## 📊 PRIORITY 9: SEO & Analytics (Optional but Recommended)

### 9.1 Analytics Setup
- [ ] Set up Google Analytics account (if desired)
- [ ] Add your Google Analytics ID to `config/_default/params.yaml`
- [ ] Set up Google Search Console
- [ ] Configure other analytics tools if needed

### 9.2 SEO Optimization
- [x] SEO description updated ✓
- [ ] Review meta keywords if needed
- [ ] Verify Open Graph tags work
- [ ] Test with SEO tools (Google PageSpeed, etc.)
- [ ] Submit sitemap to search engines

**Why This is Priority 9:** Can be done after launch, but helpful for visibility.

---

## ✅ PRIORITY 10: Final Review & Launch

### 10.1 Content Quality Check
- [ ] Proofread all text content
- [ ] Check grammar and spelling
- [ ] Verify all dates are correct
- [ ] Ensure consistent formatting
- [ ] Review "About Me" section for accuracy
- [ ] Verify all contact information is correct

### 10.2 Navigation & Links
- [ ] Test all internal links
- [ ] Verify external links work
- [ ] Check footer information
- [ ] Review menu structure

### 10.3 Legal & Attribution
- [x] LICENSE.md reviewed (MIT license for template) ✓
- [ ] Check attribution for any borrowed content/images
- [ ] Verify copyright notices

### 10.4 Pre-Launch Checklist
- [ ] All placeholder content removed
- [ ] All personal information updated
- [ ] All social links working
- [ ] CV/resume accessible and current
- [ ] Publications properly formatted
- [ ] No broken links
- [ ] Images optimized and loading correctly
- [ ] Site loads quickly
- [ ] Mobile responsive design verified

### 10.5 Launch
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
   - Work experience
   - Research interests
   - Biography text

2. **Run sync script and test:**
   ```bash
   python3 sync_personal_info.py
   hugo server
   ```

3. **Start adding your publications** - replace template publications with your own

**After that, work through priorities 3-10 as time permits.**

---

## Maintenance Tasks (Post-Launch)

### Ongoing Updates
- [ ] Update publications as new ones are accepted
- [ ] Add new events/talks
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
