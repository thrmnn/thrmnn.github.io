#!/usr/bin/env python3
"""
Sync Personal Information Script

This script reads PERSONAL_INFO.md and automatically updates all configuration files
to keep your website information synchronized.

Usage:
    python sync_personal_info.py

Make sure PERSONAL_INFO.md is up to date before running this script.
"""

import re
import os
from pathlib import Path

# File paths
BASE_DIR = Path(__file__).parent
PERSONAL_INFO_FILE = BASE_DIR / "PERSONAL_INFO.md"
HUGO_CONFIG = BASE_DIR / "config" / "_default" / "hugo.yaml"
PARAMS_CONFIG = BASE_DIR / "config" / "_default" / "params.yaml"
AUTHOR_PROFILE = BASE_DIR / "content" / "authors" / "admin" / "_index.md"
HOMEPAGE = BASE_DIR / "content" / "_index.md"


def parse_personal_info(file_path):
    """Parse PERSONAL_INFO.md and extract key information."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    info = {}
    
    # Helper function to extract value after a key
    def extract_value(pattern, content, default=None):
        match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE)
        if match:
            value = match.group(1).strip()
            # Stop at example markers - split at (* or remove everything after it
            if '(*' in value:
                value = value.split('(*')[0].strip()
            # Remove trailing parentheses with examples (e.g., to be filled, etc.)
            value = re.sub(r'\s*\([^)]*e\.g\.[^)]*\)\s*$', '', value, flags=re.IGNORECASE)
            value = re.sub(r'\s*\([^)]*to be filled[^)]*\)\s*$', '', value, flags=re.IGNORECASE)
            value = re.sub(r'\s*\([^)]*if applicable[^)]*\)\s*$', '', value, flags=re.IGNORECASE)
            value = re.sub(r'\s*\([^)]*full URL[^)]*\)\s*$', '', value, flags=re.IGNORECASE)
            # Remove trailing asterisks and clean up
            value = value.strip().rstrip('*').strip()
            # Check if value starts with a dash followed by a field name (next field was captured)
            if value.startswith('- ') and ':' in value:
                # This means we captured the next field, return empty
                return default
            # If value is just placeholder text or empty, return default
            if not value or value == '*' or value.startswith('*(') or value.startswith('* e.g.') or value == '(to be filled)':
                return default
            return value
        return default
    
    # Basic Information - stop at asterisk markers
    info['first_name'] = extract_value(r'- First Name:\s*([^*\n]+?)(?:\s*\*|$)', content, 'Théo')
    info['last_name'] = extract_value(r'- Last Name:\s*([^*\n]+?)(?:\s*\*|$)', content, 'Hermann')
    info['display_name'] = extract_value(r'- Display Name:\s*([^*\n]+?)(?:\s*\*|$)', content, 'Théo Hermann')
    info['role'] = extract_value(r'- Role/Position:\s*([^*\n]+?)(?:\s*\*|$)', content, '')
    info['affiliation'] = extract_value(r'- Current Affiliation:\s*([^*\n]+?)(?:\s*\*|$)', content, '')
    info['tagline'] = extract_value(r'- Tagline:\s*([^*\n]+?)(?:\s*\*|$)', content, '')
    
    # Contact Information - extract only text before asterisk or example
    # Use more strict pattern that stops at end of line or next field marker
    info['email'] = extract_value(r'- Primary Email:\s*([^\n*]+?)(?:\s*\*|$|\n)', content, '')
    info['twitter_handle'] = extract_value(r'- Twitter/X Handle:\s*([^\n*]+?)(?:\s*\*|$|\n)', content, '')
    info['twitter_url'] = extract_value(r'- Twitter/X URL:\s*([^\n*]+?)(?:\s*\*|$|\n)', content, '')
    info['github_username'] = extract_value(r'- GitHub Username:\s*([^\n*]+?)(?:\s*\*|$|\n)', content, '')
    info['github_url'] = extract_value(r'- GitHub URL:\s*([^\n*]+?)(?:\s*\*|$|\n)', content, '')
    info['linkedin_url'] = extract_value(r'- LinkedIn URL:\s*([^\n*]+?)(?:\s*\*|$|\n)', content, '')
    info['youtube_url'] = extract_value(r'- YouTube Channel URL:\s*([^\n*]+?)(?:\s*\*|$|\n)', content, '')
    info['scholar_url'] = extract_value(r'- Google Scholar Profile URL:\s*([^\n*]+?)(?:\s*\*|$|\n)', content, '')
    
    # Current Position (from Professional Information section)
    info['position_title'] = extract_value(r'- \*\*Position Title:\*\*\s*(.+?)(?:\n|$)', content, '')
    info['company'] = extract_value(r'- \*\*Institution/Company:\*\*\s*(.+?)(?:\n|$)', content, '')
    info['company_url'] = extract_value(r'- \*\*Institution URL:\*\*\s*(.+?)(?:\n|$)', content, '')
    info['position_start'] = extract_value(r'- \*\*Start Date:\*\*\s*(.+?)(?:\n|$)', content, '')
    # Handle empty end date
    end_match = extract_value(r'- \*\*End Date:\*\*\s*(.+?)(?:\n|$)', content, '')
    info['position_end'] = '' if not end_match or '*(' in end_match or 'leave empty' in end_match.lower() else end_match
    info['position_summary'] = extract_value(r'- \*\*Description/Summary:\*\*\s*(.+?)(?:\n|$)', content, '')
    
    # Work Experience entries (from Work Experience section)
    work_section = re.search(r'## Work Experience(.*?)(?=##|$)', content, re.DOTALL)
    info['work_experience'] = []
    if work_section:
        work_blocks = re.split(r'### Work Entry', work_section.group(1))
        for block in work_blocks[1:]:  # Skip first empty split
            position_match = re.search(r'- \*\*Position:\*\*\s*(.+?)(?:\n|$)', block)
            position = ''
            if position_match:
                position = position_match.group(1).split('(*')[0].strip() if '(*' in position_match.group(1) else position_match.group(1).strip()
            
            company_match = re.search(r'- \*\*Company/Institution:\*\*\s*(.+?)(?:\n|$)', block)
            company = ''
            if company_match:
                company = company_match.group(1).split('(*')[0].strip() if '(*' in company_match.group(1) else company_match.group(1).strip()
            
            url_match = re.search(r'- \*\*Company URL:\*\*\s*(.+?)(?:\n|$)', block)
            company_url = ''
            if url_match:
                company_url = url_match.group(1).split('(*')[0].strip() if '(*' in url_match.group(1) else url_match.group(1).strip()
                if company_url.startswith('*(full URL)'):
                    company_url = ''
            
            start_match = re.search(r'- \*\*Start Date:\*\*\s*(.+?)(?:\n|$)', block)
            start = ''
            if start_match:
                start = start_match.group(1).split('(*')[0].strip() if '(*' in start_match.group(1) else start_match.group(1).strip()
                if start.startswith('*(YYYY-MM-DD)') or not start or start == '*':
                    start = ''
            
            end_match = re.search(r'- \*\*End Date:\*\*\s*(.+?)(?:\n|$)', block)
            end = ''
            if end_match:
                end = end_match.group(1).split('(*')[0].strip() if '(*' in end_match.group(1) else end_match.group(1).strip()
                if end.startswith('*(YYYY-MM-DD)') or end.startswith('*(leave empty') or not end or end == '*':
                    end = ''
            
            summary_match = re.search(r'- \*\*Summary:\*\*\s*(.+?)(?:\n|$)', block)
            summary = ''
            if summary_match:
                summary = summary_match.group(1).split('(*')[0].strip() if '(*' in summary_match.group(1) else summary_match.group(1).strip()
                if summary.startswith('*(description') or summary.startswith('*(brief') or not summary or summary == '*':
                    summary = ''
            
            # Only add if we have at least position and company
            if position and company and not position.startswith('*'):
                info['work_experience'].append({
                    'position': position,
                    'company': company,
                    'url': company_url,
                    'date_start': start,
                    'date_end': end,
                    'summary': summary
                })
    
    # Organizations - parse list
    org_matches = re.findall(r'- \*\*Organization \d+:\*\*\s*(.+?)(?:\n|$)', content)
    info['organizations'] = []
    for org in org_matches:
        if org and '*(' not in org:
            parts = org.split(',')
            if len(parts) >= 2:
                name = parts[0].strip()
                url = parts[1].strip()
                info['organizations'].append({'name': name, 'url': url})
    
    # Education - extract education entries
    education_section = re.search(r'## Education(.*?)(?=##|$)', content, re.DOTALL)
    info['education'] = []
    if education_section:
        edu_blocks = re.split(r'### Education Entry', education_section.group(1))
        for block in edu_blocks[1:]:  # Skip first empty split
            # Extract with more lenient parsing - get text before example markers
            degree_match = re.search(r'- \*\*Degree/Area:\*\*\s*(.+?)(?:\n|$)', block)
            degree = ''
            if degree_match:
                degree = degree_match.group(1).split('(*')[0].strip() if '(*' in degree_match.group(1) else degree_match.group(1).strip()
            
            institution_match = re.search(r'- \*\*Institution:\*\*\s*(.+?)(?:\n|$)', block)
            institution = ''
            if institution_match:
                institution = institution_match.group(1).split('(*')[0].strip() if '(*' in institution_match.group(1) else institution_match.group(1).strip()
            
            start_match = re.search(r'- \*\*Start Date:\*\*\s*(.+?)(?:\n|$)', block)
            start = ''
            if start_match:
                start = start_match.group(1).split('(*')[0].strip() if '(*' in start_match.group(1) else start_match.group(1).strip()
                # Remove if it's just placeholder
                if start.startswith('*(YYYY-MM-DD)') or not start or start == '*':
                    start = ''
            
            end_match = re.search(r'- \*\*End Date:\*\*\s*(.+?)(?:\n|$)', block)
            end = ''
            if end_match:
                end = end_match.group(1).split('(*')[0].strip() if '(*' in end_match.group(1) else end_match.group(1).strip()
                # Remove if it's just placeholder
                if end.startswith('*(YYYY-MM-DD)') or end.startswith('*(leave empty') or not end or end == '*':
                    end = ''
            
            summary_match = re.search(r'- \*\*Summary:\*\*\s*(.+?)(?:\n|$)', block)
            summary = ''
            if summary_match:
                summary = summary_match.group(1).split('(*')[0].strip() if '(*' in summary_match.group(1) else summary_match.group(1).strip()
                # Remove if it's just placeholder
                if summary.startswith('*(e.g.') or summary.startswith('*(GPA') or not summary or summary == '*':
                    summary = ''
            
            # Only add if we have at least degree and institution
            if degree and institution and not degree.startswith('*'):
                info['education'].append({
                    'area': degree,
                    'institution': institution,
                    'date_start': start,
                    'date_end': end,
                    'summary': summary
                })
    
    # Research Interests
    interests_section = re.search(r'## Research Interests(.*?)(?=##|$)', content, re.DOTALL)
    info['interests'] = []
    if interests_section:
        interest_matches = re.findall(r'^\d+\.\s*(.+?)(?:\n|$)', interests_section.group(1), re.MULTILINE)
        for interest in interest_matches:
            if interest:
                # Extract text before example markers
                clean_interest = interest.split('(*')[0].strip() if '(*' in interest else interest.strip()
                # Skip if it's just placeholder text
                if clean_interest and clean_interest != '*add more as needed*' and not clean_interest.startswith('*('):
                    info['interests'].append(clean_interest)
    
    # Biography
    bio_match = re.search(r'\*\*Short Biography:\*\*\s*(.+?)(?=\n\n\*Example|\n---|$)', content, re.DOTALL)
    if bio_match:
        bio_text = bio_match.group(1).strip()
        # Extract from code block if present
        if '```' in bio_text:
            bio_text = re.search(r'```[^\n]*\n(.*?)```', bio_text, re.DOTALL)
            if bio_text:
                bio_text = bio_text.group(1).strip()
        info['biography'] = bio_text
    else:
        info['biography'] = ''
    
    # Website Configuration - stop at asterisk markers
    info['site_title'] = extract_value(r'- \*\*Site Title:\*\*\s*([^*\n]+?)(?:\s*\*|$)', content, 'Théo Hermann')
    info['base_url'] = extract_value(r'- \*\*Base URL:\*\*\s*([^*\n]+?)(?:\s*\*|$)', content, '')
    info['site_description'] = extract_value(r'- \*\*Site Description:\*\*\s*([^*\n]+?)(?:\s*\*|$)', content, '')
    info['hero_title'] = extract_value(r'- \*\*Hero Title:\*\*\s*([^*\n]+?)(?:\s*\*|$)', content, '')
    
    return info


def update_hugo_config(file_path, info):
    """Update config/_default/hugo.yaml"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update title
    if info['site_title']:
        content = re.sub(r'^title:\s*.+$', f"title: {info['site_title']}", content, flags=re.MULTILINE)
    
    # Update baseURL
    if info['base_url'] and not info['base_url'].startswith('*'):
        # Clean up base_url - remove example text
        base_url = info['base_url'].strip()
        if '(*' in base_url:
            base_url = base_url.split('(*')[0].strip()
        # Remove any remaining parentheses with examples
        base_url = re.sub(r'\s*\([^)]*e\.g\.[^)]*\)\s*$', '', base_url, flags=re.IGNORECASE).strip()
        base_url = re.sub(r'\s*\([^)]*or your[^)]*\)\s*$', '', base_url, flags=re.IGNORECASE).strip()
        if base_url and not base_url.startswith('*'):
            if not base_url.endswith('/'):
                base_url += '/'
            content = re.sub(r"^baseURL:\s*'.+?'$", f"baseURL: '{base_url}'", content, flags=re.MULTILINE)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Updated {file_path}")


def update_params_config(file_path, info):
    """Update config/_default/params.yaml"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update SEO description
    if info['site_description']:
        # Clean description - remove example text
        desc = info['site_description']
        if '(*' in desc:
            desc = desc.split('(*')[0].strip()
        desc = re.sub(r'\s*\([^)]*e\.g\.[^)]*\)\s*$', '', desc, flags=re.IGNORECASE).strip()
        if desc:
            content = re.sub(
                r"description:\s*'.+?'",
                f"description: '{desc}'",
                content
            )
    
    # Update navbar logo
    if info['display_name']:
        content = re.sub(
            r'text:\s*".+?"',
            f'text: "{info["display_name"]}"',
            content,
            count=1
        )
    
    # Update Twitter handle if provided
    if info['twitter_handle']:
        twitter_handle = info['twitter_handle'].replace('@', '')
        content = re.sub(
            r"twitter:\s*'.+?'",
            f"twitter: '{twitter_handle}'",
            content
        )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Updated {file_path}")


def update_author_profile(file_path, info):
    """Update content/authors/admin/_index.md"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update title
    if info['display_name']:
        content = re.sub(r'^title:\s*.+$', f"title: {info['display_name']}", content, flags=re.MULTILINE)
    
    # Update first_name and last_name
    if info['first_name']:
        content = re.sub(r'^first_name:\s*.+$', f"first_name: {info['first_name']}", content, flags=re.MULTILINE)
    if info['last_name']:
        content = re.sub(r'^last_name:\s*.+$', f"last_name: {info['last_name']}", content, flags=re.MULTILINE)
    
    # Update role
    if info['tagline']:
        # Clean tagline
        tagline = info['tagline']
        if '(*' in tagline:
            tagline = tagline.split('(*')[0].strip()
        tagline = re.sub(r'\s*\([^)]*e\.g\.[^)]*\)\s*$', '', tagline, flags=re.IGNORECASE).strip()
        if tagline:
            content = re.sub(r'^role:\s*.+$', f"role: {tagline}", content, flags=re.MULTILINE)
    
    # Update organizations
    if info['organizations']:
        org_yaml = "organizations:\n"
        for org in info['organizations']:
            org_yaml += f"  - name: {org['name']}\n    url: {org['url']}\n"
        
        # Replace organizations section
        org_pattern = r'organizations:.*?(?=\n\n#|\nprofiles:|\ninterests:)'
        if re.search(org_pattern, content, re.DOTALL):
            content = re.sub(org_pattern, org_yaml.rstrip(), content, flags=re.DOTALL)
        else:
            # Insert before profiles
            content = re.sub(
                r'(# Organizations.*?\n)',
                f'\\1{org_yaml}\n',
                content,
                flags=re.DOTALL
            )
    
    # Update profiles/social links - only add if URL is valid
    profiles = []
    if info.get('email') and info['email'] and not info['email'].startswith('*'):
        email = info['email'].split('(*')[0].strip() if '(*' in info['email'] else info['email']
        if email and '@' in email:
            profiles.append(f"  - icon: at-symbol\n    url: 'mailto:{email}'\n    label: E-mail Me")
    if info.get('twitter_url') and info['twitter_url'] and not info['twitter_url'].startswith('*') and 'http' in info['twitter_url']:
        twitter = info['twitter_url'].split('(*')[0].strip() if '(*' in info['twitter_url'] else info['twitter_url']
        if twitter:
            profiles.append(f"  - icon: brands/x\n    url: {twitter}")
    if info.get('github_url') and info['github_url'] and not info['github_url'].startswith('*') and 'http' in info['github_url']:
        github = info['github_url'].split('(*')[0].strip() if '(*' in info['github_url'] else info['github_url']
        if github:
            profiles.append(f"  - icon: brands/github\n    url: {github}")
    if info.get('linkedin_url') and info['linkedin_url'] and not info['linkedin_url'].startswith('*') and 'http' in info['linkedin_url']:
        linkedin = info['linkedin_url'].split('(*')[0].strip() if '(*' in info['linkedin_url'] else info['linkedin_url']
        if linkedin:
            profiles.append(f"  - icon: brands/linkedin\n    url: {linkedin}")
    if info.get('youtube_url') and info['youtube_url'] and not info['youtube_url'].startswith('*') and 'http' in info['youtube_url']:
        youtube = info['youtube_url'].split('(*')[0].strip() if '(*' in info['youtube_url'] else info['youtube_url']
        if youtube:
            profiles.append(f"  - icon: brands/youtube\n    url: {youtube}")
    if info.get('scholar_url') and info['scholar_url'] and not info['scholar_url'].startswith('*') and 'http' in info['scholar_url']:
        scholar = info['scholar_url'].split('(*')[0].strip() if '(*' in info['scholar_url'] else info['scholar_url']
        if scholar:
            profiles.append(f"  - icon: academicons/google-scholar\n    url: {scholar}")
    profiles.append("  - icon: academicons/cv\n    url: uploads/resume.pdf")
    
    if profiles:
        profiles_yaml = "profiles:\n" + "\n".join(profiles) + "\n"
        profiles_pattern = r'profiles:.*?(?=\n\ninterests:|\n# Interests)'
        if re.search(profiles_pattern, content, re.DOTALL):
            content = re.sub(profiles_pattern, profiles_yaml.rstrip(), content, flags=re.DOTALL)
    
    # Update interests
    if info['interests']:
        interests_yaml = "interests:\n"
        for interest in info['interests']:
            # Clean interest - remove example text
            clean_interest = interest.split('(*')[0].strip() if '(*' in interest else interest.strip()
            if clean_interest and not clean_interest.startswith('*'):
                interests_yaml += f"  - {clean_interest}\n"
        
        # Match interests section - match up to education (single or double newline)
        interests_pattern = r'interests:.*?(?=\n\w|\n#)'
        if re.search(interests_pattern, content, re.DOTALL):
            # Find where interests section ends
            match = re.search(interests_pattern, content, re.DOTALL)
            if match:
                start = match.start()
                # Find the start of the interests: line
                interests_line_start = content.rfind('\ninterests:', 0, start)
                if interests_line_start == -1:
                    interests_line_start = content.find('interests:')
                if interests_line_start >= 0:
                    # Replace from interests: to the match end
                    before = content[:interests_line_start]
                    after = content[match.end():]
                    content = before + interests_yaml.rstrip() + '\n' + after
    
    # Update education
    if info['education']:
        edu_yaml = "education:\n"
        for edu in info['education']:
            if edu['area'] and edu['institution']:
                edu_yaml += f"  - area: {edu['area']}\n"
                edu_yaml += f"    institution: {edu['institution']}\n"
                if edu['date_start']:
                    edu_yaml += f"    date_start: {edu['date_start']}\n"
                if edu['date_end']:
                    edu_yaml += f"    date_end: {edu['date_end']}\n"
                if edu['summary']:
                    edu_yaml += f"    summary: |\n      {edu['summary']}\n"
        
        # Match education section - more flexible pattern
        # Look for education: and match until work: or end of file
        edu_pattern = r'education:.*?(?=\nwork:|\n# Work|$)'
        if re.search(edu_pattern, content, re.DOTALL):
            content = re.sub(edu_pattern, edu_yaml.rstrip(), content, flags=re.DOTALL)
        else:
            # Fallback: try to find education: and replace everything until work:
            edu_pattern2 = r'(education:).*?(\nwork:)'
            if re.search(edu_pattern2, content, re.DOTALL):
                content = re.sub(edu_pattern2, r'\1\n' + edu_yaml.rstrip() + r'\2', content, flags=re.DOTALL)
    
    # Update work experience - combine current position and work entries
    work_entries = []
    
    # Add current position if available
    if info.get('position_title') and info.get('company'):
        work_entries.append({
            'position': info['position_title'],
            'company': info['company'],
            'url': info.get('company_url', ''),
            'date_start': info.get('position_start', ''),
            'date_end': info.get('position_end', ''),
            'summary': info.get('position_summary', '')
        })
    
    # Add work experience entries (reverse to show most recent first)
    if info.get('work_experience'):
        work_entries.extend(reversed(info['work_experience']))
    
    if work_entries:
        work_yaml = "work:\n"
        for entry in work_entries:
            # Clean all fields
            position = entry['position'].split('(*')[0].strip() if '(*' in entry['position'] else entry['position'].strip()
            company = entry['company'].split('(*')[0].strip() if '(*' in entry['company'] else entry['company'].strip()
            url = entry.get('url', '').split('(*')[0].strip() if entry.get('url') and '(*' in entry.get('url', '') else (entry.get('url', '') or '').strip()
            date_start = entry.get('date_start', '').split('(*')[0].strip() if entry.get('date_start') and '(*' in entry.get('date_start', '') else (entry.get('date_start', '') or '').strip()
            date_end = entry.get('date_end', '').split('(*')[0].strip() if entry.get('date_end') and '(*' in entry.get('date_end', '') else (entry.get('date_end', '') or '').strip()
            summary = entry.get('summary', '').split('(*')[0].strip() if entry.get('summary') and '(*' in entry.get('summary', '') else (entry.get('summary', '') or '').strip()
            
            if position and company:
                work_yaml += f"  - position: {position}\n"
                work_yaml += f"    company_name: {company}\n"
                if url and not url.startswith('*'):
                    work_yaml += f"    company_url: '{url}'\n"
                if date_start and not date_start.startswith('*'):
                    work_yaml += f"    date_start: {date_start}\n"
                if date_end and not date_end.startswith('*'):
                    work_yaml += f"    date_end: {date_end}\n"
                if summary and not summary.startswith('*'):
                    work_yaml += f"    summary: |\n      {summary}\n"
        
        work_pattern = r'work:.*?(?=\n\n# Skills|\n# Skills|$)'
        if re.search(work_pattern, content, re.DOTALL):
            content = re.sub(work_pattern, work_yaml.rstrip(), content, flags=re.DOTALL)
    
    # Update biography section at the end
    if info['biography']:
        bio_section = f"---\n\n## About Me\n\n{info['biography']}\n"
        # Replace existing biography or add at the end
        bio_pattern = r'---\s*\n\n## About Me.*?$'
        if re.search(bio_pattern, content, re.DOTALL):
            content = re.sub(bio_pattern, bio_section.rstrip(), content, flags=re.DOTALL)
        else:
            # Add at the end before final newlines
            content = content.rstrip() + "\n\n" + bio_section.rstrip() + "\n"
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Updated {file_path}")


def update_homepage(file_path, info):
    """Update content/_index.md contact section"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update hero title if provided
    if info['hero_title']:
        # Clean hero title - remove example text
        hero_title = info['hero_title'].split('(*')[0].strip() if '(*' in info['hero_title'] else info['hero_title'].strip()
        if hero_title:
            content = re.sub(
                r'title:\s*<br/><br/>.+?(?=\n|$)',
                f"title: <br/><br/>{hero_title}",
                content,
                flags=re.MULTILINE
            )
    
    # Update contact buttons - only add if URL is valid
    buttons = []
    if info.get('email') and info['email'] and '@' in info['email']:
        buttons.append(f"        - text: E-mail\n          icon: at-symbol\n          url: mailto:{info['email']}")
    if info.get('twitter_url') and info['twitter_url'] and ('http' in info['twitter_url'] or 'https' in info['twitter_url']):
        buttons.append(f"        - text: Message\n          icon: brands/x\n          url: {info['twitter_url']}")
    if info.get('linkedin_url') and info['linkedin_url'] and ('http' in info['linkedin_url'] or 'https' in info['linkedin_url']):
        buttons.append(f"        - text: Connect\n          icon: brands/linkedin\n          url: {info['linkedin_url']}")
    
    if buttons:
        buttons_yaml = "\n".join(buttons)
        buttons_pattern = r'buttons:\s*\n.*?(?=\n    design:)'
        if re.search(buttons_pattern, content, re.DOTALL):
            content = re.sub(buttons_pattern, f"buttons:\n{buttons_yaml}", content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Updated {file_path}")


def main():
    """Main function to sync all configuration files."""
    print("🔍 Reading PERSONAL_INFO.md...")
    
    if not PERSONAL_INFO_FILE.exists():
        print(f"❌ Error: {PERSONAL_INFO_FILE} not found!")
        return
    
    try:
        info = parse_personal_info(PERSONAL_INFO_FILE)
        print(f"✓ Parsed personal information for {info.get('display_name', 'unknown')}\n")
        
        print("📝 Updating configuration files...\n")
        
        if HUGO_CONFIG.exists():
            update_hugo_config(HUGO_CONFIG, info)
        else:
            print(f"⚠️  Warning: {HUGO_CONFIG} not found")
        
        if PARAMS_CONFIG.exists():
            update_params_config(PARAMS_CONFIG, info)
        else:
            print(f"⚠️  Warning: {PARAMS_CONFIG} not found")
        
        if AUTHOR_PROFILE.exists():
            update_author_profile(AUTHOR_PROFILE, info)
        else:
            print(f"⚠️  Warning: {AUTHOR_PROFILE} not found")
        
        if HOMEPAGE.exists():
            update_homepage(HOMEPAGE, info)
        else:
            print(f"⚠️  Warning: {HOMEPAGE} not found")
        
        print("\n✅ Sync complete! All configuration files have been updated.")
        print("\n📋 Next steps:")
        print("   1. Review the updated files to ensure everything looks correct")
        print("   2. Test locally with: hugo server")
        print("   3. Commit changes to git")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

