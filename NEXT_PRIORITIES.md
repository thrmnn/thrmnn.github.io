# Next Priorities & Roadmap

**Last Updated:** 2025-01-13  
**Current Status:** Core infrastructure complete, ready for content expansion

---

## ✅ What's Been Completed

### Infrastructure & Automation
- ✅ **Personal Information System**: Complete `PERSONAL_INFO.md` with all education, work experience, and biography
- ✅ **Automatic Sync**: Git pre-commit hook automatically syncs `PERSONAL_INFO.md` to all config files
- ✅ **Sync Script**: Robust parsing for education, work experience, contact info, biography
- ✅ **YAML Fixes**: All syntax errors resolved, proper handling of empty fields
- ✅ **Work Experience**: All 5 work entries correctly parsed and displayed
- ✅ **Education**: All 3 education entries correctly parsed and displayed
- ✅ **Basic Configuration**: Site title, baseURL, SEO description configured
- ✅ **Contact Information**: Email, GitHub, LinkedIn, Google Scholar configured

### Content
- ✅ **Author Profile**: Name, role, affiliations, contact info complete
- ✅ **Biography**: Complete "About Me" section with research background
- ✅ **Research Interests**: Listed (Autonomous Robots, LiDAR 3D Modeling, Multimodal Fusion)
- ✅ **Hero Section**: Title and background image configured

---

## 🔥 PRIORITY 1: Content Expansion (Next 1-2 Weeks)

### 1.1 Publications Section
**Status:** Empty - Ready for your publications

**Action Items:**
- [ ] Add your publications (if any) to `content/publication/`
- [ ] Format: Create a folder for each publication with `index.md`
- [ ] Include: Title, authors, venue, year, abstract, links to papers
- [ ] Or: Hide/remove publications section if not applicable yet

**Why:** Publications are core to academic profiles. Even if you have 0-2 publications, it's worth setting up the structure.

**Resources:**
- See `NEWS_GUIDE.md` for publication format examples
- Hugo Blox supports various publication types (journal, conference, preprint, etc.)

---

### 1.2 News Section
**Status:** Currently empty (good - no template content)

**Action Items:**
- [ ] Add recent news entries (awards, paper acceptances, talks, new positions)
- [ ] Format: Use HTML in `content/_index.md` news section
- [ ] Structure: Group by year (2025, 2024, etc.)
- [ ] Keep it updated: Add new entries monthly/quarterly

**Example Format:**
```html
<div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
  <p><strong>January 2025</strong> - Started as Research Fellow at MIT Senseable City Lab</p>
  <p><strong>December 2024</strong> - Completed Visiting Research Fellowship at IRI Barcelona</p>
</div>
```

**Why:** Shows recent activity and keeps site current. Visitors check this first.

---

### 1.3 Projects Section
**Status:** Check what's in `content/project/` and `content/projects.md`

**Action Items:**
- [ ] Review existing project entries
- [ ] Add your research projects (LiDAR 3D modeling, favela mapping, etc.)
- [ ] Include: Project description, images, links, collaborators
- [ ] Or: Remove if not using this section

**Why:** Showcases your research work visually and descriptively.

---

## 📰 PRIORITY 2: Events & Talks (Next 2-4 Weeks)

### 2.1 Conference Presentations & Talks
**Status:** Template events present - need cleanup

**Action Items:**
- [ ] Review `content/event/` directory
- [ ] Remove template events
- [ ] Add your actual:
  - Conference presentations
  - Invited talks
  - Workshop participations
  - Seminars given
- [ ] Include: Date, venue, title, abstract/summary, slides link (if available)

**Why:** Important for academic visibility and networking.

**If Not Applicable:**
- [ ] Remove events section from homepage (`content/_index.md`)
- [ ] Or keep structure but leave empty for future use

---

## 🖼️ PRIORITY 3: Media & Visual Content (Next 2-4 Weeks)

### 3.1 Profile Photo
**Status:** Missing

**Action Items:**
- [ ] Add professional headshot to `content/authors/admin/avatar.png`
- [ ] Recommended: Square image, 400x400px or larger, professional quality
- [ ] Update `PERSONAL_INFO.md` with path if needed

**Why:** Personalizes your profile and makes it more professional.

---

### 3.2 Project Images & Media
**Status:** Check existing assets

**Action Items:**
- [ ] Review `assets/media/` directory
- [ ] Add project screenshots/demos
- [ ] Add research visualization images
- [ ] Optimize images for web (compress, resize)
- [ ] Add alt text for accessibility

**Why:** Visual content makes research more engaging and understandable.

---

### 3.3 CV/Resume
**Status:** File exists at `static/uploads/resume.pdf`

**Action Items:**
- [ ] Verify the PDF is your current, up-to-date CV
- [ ] Update if needed
- [ ] Ensure it matches information on website
- [ ] Test download link works

**Why:** Many visitors will download your CV.

---

## 🤖 PRIORITY 4: Platform & Teaching Sections (Optional)

### 4.1 Robotic Platforms
**Status:** Template entries present

**Decision:**
- [ ] **Option A**: Remove section if not relevant to your current research
- [ ] **Option B**: Update with platforms you've actually worked with
  - Add descriptions, images, your contributions
  - Focus on platforms relevant to your work

**Why:** Only important if platforms are central to your research narrative.

---

### 4.2 Teaching Section
**Status:** Template content present

**Decision:**
- [ ] **Option A**: Remove if not teaching currently
- [ ] **Option B**: Update with your actual teaching:
  - Courses taught (General Physics, Mobile Robotics at EPFL)
  - Teaching materials, course descriptions
  - Student projects supervised

**Why:** Shows teaching experience, but only needed if teaching is part of your profile.

---

## 🔧 PRIORITY 5: Technical Polish (Ongoing)

### 5.1 Testing & Quality Assurance
**Action Items:**
- [ ] Test all internal links work
- [ ] Verify external links (GitHub, LinkedIn, Google Scholar)
- [ ] Test on mobile devices (responsive design)
- [ ] Test in different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Check dark/light theme switching
- [ ] Verify all images load correctly
- [ ] Test site performance (PageSpeed Insights)

---

### 5.2 SEO & Discoverability
**Action Items:**
- [ ] Set up Google Search Console
- [ ] Submit sitemap to Google
- [ ] Verify Open Graph tags work (for social media sharing)
- [ ] Add meta keywords if desired
- [ ] Consider Google Analytics (optional)

---

### 5.3 GitHub Pages Deployment
**Status:** Repository is `thrmnn.github.io` - should auto-deploy

**Action Items:**
- [ ] Verify GitHub Pages is enabled in repository settings
- [ ] Check that site is live at `https://thrmnn.github.io/`
- [ ] Test live site after each major update
- [ ] Set up custom domain (optional, if you have one)

---

## 📊 Priority Summary

### Immediate (This Week)
1. **Add profile photo** - Quick win, high impact
2. **Update news section** - Add 2-3 recent entries
3. **Verify CV is current** - Check `static/uploads/resume.pdf`

### Short-term (Next 2-4 Weeks)
4. **Publications** - Add any existing publications or set up structure
5. **Projects** - Add research projects with descriptions
6. **Events** - Clean up template events, add your talks (if any)
7. **Media assets** - Add project images, optimize existing ones

### Medium-term (Next 1-2 Months)
8. **Platform/Teaching sections** - Decide to keep/remove/update
9. **SEO setup** - Google Search Console, sitemap submission
10. **Testing** - Comprehensive cross-browser, mobile testing

### Ongoing
11. **Keep content updated** - Add news entries regularly
12. **Update work experience** - As you progress in your career
13. **Add new publications** - As they're published
14. **Refresh projects** - As research evolves

---

## 🎯 Quick Wins (Can Do Today)

1. **Add profile photo** (5 minutes)
   - Find a professional headshot
   - Save as `content/authors/admin/avatar.png`
   - Commit and push

2. **Add 2-3 news entries** (10 minutes)
   - Edit `content/_index.md` news section
   - Add recent achievements/updates
   - Format by year

3. **Verify CV** (2 minutes)
   - Check `static/uploads/resume.pdf` is current
   - Update if needed

4. **Test live site** (5 minutes)
   - Visit `https://thrmnn.github.io/`
   - Check all links work
   - Test on mobile

---

## 📝 Content Strategy

### What Makes a Great Academic Website

1. **Clear Research Narrative**: Your work should tell a story
   - Current focus: LiDAR + CFD + Urban Planning + Public Health
   - Background: Robotics → Computer Vision → Urban Intelligence
   - Future: Continue this trajectory

2. **Recent Activity**: News section shows you're active
   - Add entries monthly or quarterly
   - Include: papers, talks, awards, collaborations

3. **Visual Storytelling**: Images and media make research accessible
   - Project screenshots
   - Research visualizations
   - Conference photos (if appropriate)

4. **Professional Presentation**: 
   - Consistent formatting
   - No broken links
   - Up-to-date information
   - Professional photos

---

## 🚀 Launch Checklist

Before considering the site "complete":

- [ ] All personal information accurate and complete
- [ ] Profile photo added
- [ ] CV is current and downloadable
- [ ] News section has at least 3-5 entries
- [ ] No broken links (internal or external)
- [ ] All images load correctly
- [ ] Site works on mobile devices
- [ ] Site loads quickly (< 3 seconds)
- [ ] Tested in multiple browsers
- [ ] GitHub Pages deployment working
- [ ] Google Scholar link works
- [ ] Social media links work

---

## 📚 Resources

- **Sync Script**: `sync_personal_info.py` - Auto-updates config from `PERSONAL_INFO.md`
- **News Guide**: `NEWS_GUIDE.md` - How to add news entries
- **Architecture**: `ARCHITECTURE_DESCRIPTION.md` - Technical details
- **Automatic Sync**: `AUTOMATIC_SYNC.md` - How the pre-commit hook works

---

## 💡 Pro Tips

1. **Start Small**: Don't try to do everything at once. Focus on high-impact items first.

2. **Iterate**: Your website is a living document. Update it regularly as your career progresses.

3. **Quality over Quantity**: Better to have 3 great projects than 10 mediocre ones.

4. **Keep It Current**: Update news section regularly. Stale content looks unprofessional.

5. **Test Everything**: Before sharing your site, test all links, forms, and downloads.

6. **Mobile First**: Most visitors will view on mobile. Ensure it looks great on small screens.

7. **SEO Matters**: Use descriptive titles, alt text for images, and proper heading structure.

---

**Next Action:** Start with Priority 1.1 (Publications) or the Quick Wins above. Choose based on what you have ready to add!
