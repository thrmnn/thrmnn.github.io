#!/usr/bin/env python3
"""
Sync Projects Script

This script reads PROJECTS.md and automatically creates/updates Hugo content files
in content/project/ to keep your website synchronized.

Usage:
    python3 sync_projects.py

Make sure PROJECTS.md is up to date before running this script.
"""

import re
import os
from pathlib import Path

# File paths
BASE_DIR = Path(__file__).parent
PROJECTS_FILE = BASE_DIR / "PROJECTS.md"
PROJECT_CONTENT_DIR = BASE_DIR / "content" / "project"


def parse_projects(file_path):
    """Parse PROJECTS.md and extract project information."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    projects = []
    
    # Find all project entries (between ### and next ### or end)
    project_pattern = r'### (.+?)\n(.*?)(?=\n### |\Z)'
    matches = re.finditer(project_pattern, content, re.DOTALL)
    
    for match in matches:
        project_name = match.group(1).strip()
        project_content = match.group(2).strip()
        
        # Skip template/example entries
        if ('Example:' in project_name or 
            project_name.startswith('Example') or
            project_name == 'Project Name' or
            'Template' in project_name or
            project_name.startswith('*(')):
            continue
        
        # Parse project fields
        project = {'name': project_name}
        
        # Extract Title
        title_match = re.search(r'- \*\*Title:\*\*\s*(.+?)(?:\n|$)', project_content)
        if title_match:
            project['title'] = title_match.group(1).strip()
        else:
            project['title'] = project_name
        
        # Extract Date
        date_match = re.search(r'- \*\*Date:\*\*\s*(.+?)(?:\n|$)', project_content)
        project['date'] = date_match.group(1).strip() if date_match else ''
        
        # Extract Summary
        summary_match = re.search(r'- \*\*Summary:\*\*\s*(.+?)(?:\n|$)', project_content)
        project['summary'] = summary_match.group(1).strip() if summary_match else ''
        
        # Extract Description (multi-line, until next field)
        desc_match = re.search(r'- \*\*Description:\*\*\s*(.+?)(?:\n- \*\*|$)', project_content, re.DOTALL)
        project['description'] = desc_match.group(1).strip() if desc_match else ''
        
        # Extract External Link
        link_match = re.search(r'- \*\*External Link:\*\*\s*(.+?)(?:\n|$)', project_content)
        project['external_link'] = link_match.group(1).strip() if link_match else ''
        
        # Extract Image
        image_match = re.search(r'- \*\*Image:\*\*\s*(.+?)(?:\n|$)', project_content)
        project['image'] = image_match.group(1).strip() if image_match else ''
        
        # Extract Tags
        tags_match = re.search(r'- \*\*Tags:\*\*\s*(.+?)(?:\n|$)', project_content)
        if tags_match:
            tags_str = tags_match.group(1).strip()
            project['tags'] = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
        else:
            project['tags'] = []
        
        # Extract Code URL
        code_match = re.search(r'- \*\*Code URL:\*\*\s*(.+?)(?:\n- \*\*|$)', project_content, re.DOTALL)
        if code_match:
            code_url = code_match.group(1).strip()
            if code_url.startswith('-') or code_url == '':
                project['code_url'] = ''
            else:
                project['code_url'] = code_url
        else:
            project['code_url'] = ''
        
        # Extract PDF URL
        pdf_match = re.search(r'- \*\*PDF URL:\*\*\s*(.+?)(?:\n- \*\*|$)', project_content, re.DOTALL)
        if pdf_match:
            pdf_url = pdf_match.group(1).strip()
            if pdf_url.startswith('-') or pdf_url == '':
                project['pdf_url'] = ''
            else:
                project['pdf_url'] = pdf_url
        else:
            project['pdf_url'] = ''
        
        # Extract Video URL
        video_match = re.search(r'- \*\*Video URL:\*\*\s*(.+?)(?:\n- \*\*|$)', project_content, re.DOTALL)
        if video_match:
            video_url = video_match.group(1).strip()
            if video_url.startswith('-') or video_url == '':
                project['video_url'] = ''
            else:
                project['video_url'] = video_url
        else:
            project['video_url'] = ''
        
        # Only add if we have at least a title
        if project.get('title'):
            projects.append(project)
    
    return projects


def create_slug(name):
    """Create a URL-friendly slug from project name."""
    # Convert to lowercase
    slug = name.lower()
    # Replace spaces and special chars with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def create_project_content(project):
    """Create Hugo content file for a project."""
    slug = create_slug(project['name'])
    project_dir = PROJECT_CONTENT_DIR / slug
    project_dir.mkdir(parents=True, exist_ok=True)
    
    content_file = project_dir / "index.md"
    
    # Format date for Hugo (convert to ISO format if needed)
    date_str = project.get('date', '')
    if date_str and len(date_str) == 10:  # YYYY-MM-DD
        date_str = f"{date_str}T00:00:00Z"
    
    # Build front matter
    front_matter = "---\n"
    front_matter += f"title: {project['title']}\n"
    
    if date_str:
        front_matter += f"date: '{date_str}'\n"
    
    if project.get('external_link'):
        front_matter += f"external_link: '{project['external_link']}'\n"
    
    if project.get('image') and project['image'].strip():
        front_matter += "\nimage:\n"
        front_matter += f"  caption: {project['title']}\n"
        # Hugo Blox looks for images in assets/media/ - use relative path from assets/media/
        image_path = project['image']
        if not image_path.startswith('projects/'):
            image_path = f"projects/{image_path}"
        front_matter += f"  filename: {image_path}\n"
        front_matter += "  focal_point: Smart\n"
    
    # Tags
    if project.get('tags'):
        front_matter += "\ntags:\n"
        for tag in project['tags']:
            front_matter += f"  - {tag}\n"
    else:
        front_matter += "\ntags: []\n"
    
    if project.get('code_url'):
        front_matter += f"\nurl_code: '{project['code_url']}'\n"
    else:
        front_matter += "\nurl_code: ''\n"
    
    if project.get('pdf_url'):
        front_matter += f"url_pdf: '{project['pdf_url']}'\n"
    else:
        front_matter += "url_pdf: ''\n"
    
    if project.get('video_url'):
        front_matter += f"url_video: '{project['video_url']}'\n"
    else:
        front_matter += "url_video: ''\n"
    
    front_matter += "url_slides: ''\n"
    front_matter += "\nslides: ''\n"
    front_matter += "---\n\n"
    
    # Add summary and description as content
    if project.get('summary'):
        front_matter += f"{project['summary']}\n\n"
    
    if project.get('description'):
        front_matter += project['description']
    
    with open(content_file, 'w', encoding='utf-8') as f:
        f.write(front_matter)
    
    return slug


def main():
    """Main function to sync projects."""
    print("🔍 Reading PROJECTS.md...")
    
    if not PROJECTS_FILE.exists():
        print(f"❌ Error: {PROJECTS_FILE} not found!")
        return
    
    try:
        projects = parse_projects(PROJECTS_FILE)
        print(f"✓ Parsed {len(projects)} project(s)\n")
        
        if not projects:
            print("⚠️  No projects found in PROJECTS.md")
            return
        
        print("📝 Creating/updating project content files...\n")
        
        # Ensure project content directory exists
        PROJECT_CONTENT_DIR.mkdir(parents=True, exist_ok=True)
        
        # Get list of slugs that should exist (only from PROJECTS.md)
        created_slugs = []
        for project in projects:
            slug = create_project_content(project)
            created_slugs.append(slug)
            print(f"✓ Created/updated: {project['title']} ({slug})")
        
        # Note: We don't remove existing projects that aren't in PROJECTS.md
        # because there might be manually created projects (like pandas, pytorch, scikit)
        # Only sync projects that are explicitly in PROJECTS.md
        
        print(f"\n✅ Sync complete! {len(projects)} project(s) processed.")
        print("\n📋 Next steps:")
        print("   1. Review the created files in content/project/")
        print("   2. Add images to assets/media/projects/ if needed")
        print("   3. Test locally with: hugo server")
        print("   4. Commit changes to git")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
