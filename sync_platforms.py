#!/usr/bin/env python3
"""
Sync Platforms Script

This script reads PLATFORMS.md and automatically creates/updates Hugo content files
in content/platform/ to keep your website synchronized.

Usage:
    python3 sync_platforms.py

Make sure PLATFORMS.md is up to date before running this script.
"""

import re
import os
from pathlib import Path

# File paths
BASE_DIR = Path(__file__).parent
PLATFORMS_FILE = BASE_DIR / "PLATFORMS.md"
PLATFORM_CONTENT_DIR = BASE_DIR / "content" / "platform"


def parse_platforms(file_path):
    """Parse PLATFORMS.md and extract platform information."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    platforms = []
    
    # Find all platform entries (between ### and next ### or end)
    platform_pattern = r'### (.+?)\n(.*?)(?=\n### |\Z)'
    matches = re.finditer(platform_pattern, content, re.DOTALL)
    
    for match in matches:
        platform_name = match.group(1).strip()
        platform_content = match.group(2).strip()
        
        # Skip template/example entries
        if ('Example:' in platform_name or 
            platform_name.startswith('Example') or
            platform_name == 'Platform Name' or
            'Template' in platform_name):
            continue
        
        # Parse platform fields
        platform = {'name': platform_name}
        
        # Extract Title
        title_match = re.search(r'- \*\*Title:\*\*\s*(.+?)(?:\n|$)', platform_content)
        if title_match:
            platform['title'] = title_match.group(1).strip()
        else:
            platform['title'] = platform_name
        
        # Extract Date
        date_match = re.search(r'- \*\*Date:\*\*\s*(.+?)(?:\n|$)', platform_content)
        platform['date'] = date_match.group(1).strip() if date_match else ''
        
        # Extract Summary
        summary_match = re.search(r'- \*\*Summary:\*\*\s*(.+?)(?:\n|$)', platform_content)
        platform['summary'] = summary_match.group(1).strip() if summary_match else ''
        
        # Extract Description (multi-line, until next field)
        desc_match = re.search(r'- \*\*Description:\*\*\s*(.+?)(?:\n- \*\*|$)', platform_content, re.DOTALL)
        platform['description'] = desc_match.group(1).strip() if desc_match else ''
        
        # Extract External Link
        link_match = re.search(r'- \*\*External Link:\*\*\s*(.+?)(?:\n|$)', platform_content)
        platform['external_link'] = link_match.group(1).strip() if link_match else ''
        
        # Extract Image
        image_match = re.search(r'- \*\*Image:\*\*\s*(.+?)(?:\n|$)', platform_content)
        platform['image'] = image_match.group(1).strip() if image_match else ''
        
        # Extract Tags
        tags_match = re.search(r'- \*\*Tags:\*\*\s*(.+?)(?:\n|$)', platform_content)
        if tags_match:
            tags_str = tags_match.group(1).strip()
            platform['tags'] = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
        else:
            platform['tags'] = []
        
        # Extract Code URL (stop at next field marker)
        code_match = re.search(r'- \*\*Code URL:\*\*\s*(.+?)(?:\n- \*\*|$)', platform_content, re.DOTALL)
        if code_match:
            code_url = code_match.group(1).strip()
            # Clean up - remove if it's just a dash or next field
            if code_url.startswith('-') or code_url == '':
                platform['code_url'] = ''
            else:
                platform['code_url'] = code_url
        else:
            platform['code_url'] = ''
        
        # Extract Video URL (stop at next field marker or end)
        video_match = re.search(r'- \*\*Video URL:\*\*\s*(.+?)(?:\n- \*\*|$)', platform_content, re.DOTALL)
        if video_match:
            video_url = video_match.group(1).strip()
            # Clean up - remove if it's just a dash or next field
            if video_url.startswith('-') or video_url == '':
                platform['video_url'] = ''
            else:
                platform['video_url'] = video_url
        else:
            platform['video_url'] = ''
        
        # Only add if we have at least a title
        if platform.get('title'):
            platforms.append(platform)
    
    return platforms


def create_slug(name):
    """Create a URL-friendly slug from platform name."""
    # Convert to lowercase
    slug = name.lower()
    # Replace spaces and special chars with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def create_platform_content(platform):
    """Create Hugo content file for a platform."""
    slug = create_slug(platform['name'])
    platform_dir = PLATFORM_CONTENT_DIR / slug
    platform_dir.mkdir(parents=True, exist_ok=True)
    
    content_file = platform_dir / "index.md"
    
    # Format date for Hugo (convert to ISO format if needed)
    date_str = platform.get('date', '')
    if date_str and len(date_str) == 10:  # YYYY-MM-DD
        date_str = f"{date_str}T00:00:00Z"
    
    # Build front matter
    front_matter = "---\n"
    front_matter += f"title: {platform['title']}\n"
    front_matter += f"summary: {platform.get('summary', '')}\n"
    
    if date_str:
        front_matter += f"date: '{date_str}'\n"
    
    if platform.get('external_link'):
        front_matter += f"external_link: '{platform['external_link']}'\n"
    
    if platform.get('image'):
        front_matter += "\nimage:\n"
        front_matter += f"  caption: {platform['title']}\n"
        front_matter += "  focal_point: Smart\n"
        # Note: Image path will need to be set in Hugo config or use full path
    
    if platform.get('tags'):
        front_matter += "\ntags:\n"
        for tag in platform['tags']:
            front_matter += f"  - {tag}\n"
    
    if platform.get('code_url'):
        front_matter += f"\nurl_code: '{platform['code_url']}'\n"
    else:
        front_matter += "\nurl_code: ''\n"
    
    if platform.get('video_url'):
        front_matter += f"url_video: '{platform['video_url']}'\n"
    else:
        front_matter += "url_video: ''\n"
    
    front_matter += "\nurl_pdf: ''\n"
    front_matter += "url_slides: ''\n"
    front_matter += "\nslides: ''\n"
    front_matter += "---\n\n"
    
    # Add description as content
    if platform.get('description'):
        front_matter += platform['description']
    
    with open(content_file, 'w', encoding='utf-8') as f:
        f.write(front_matter)
    
    return slug


def main():
    """Main function to sync platforms."""
    print("🔍 Reading PLATFORMS.md...")
    
    if not PLATFORMS_FILE.exists():
        print(f"❌ Error: {PLATFORMS_FILE} not found!")
        return
    
    try:
        platforms = parse_platforms(PLATFORMS_FILE)
        print(f"✓ Parsed {len(platforms)} platform(s)\n")
        
        if not platforms:
            print("⚠️  No platforms found in PLATFORMS.md")
            return
        
        print("📝 Creating/updating platform content files...\n")
        
        # Ensure platform content directory exists
        PLATFORM_CONTENT_DIR.mkdir(parents=True, exist_ok=True)
        
        created_slugs = []
        for platform in platforms:
            slug = create_platform_content(platform)
            created_slugs.append(slug)
            print(f"✓ Created/updated: {platform['title']} ({slug})")
        
        print(f"\n✅ Sync complete! {len(platforms)} platform(s) processed.")
        print("\n📋 Next steps:")
        print("   1. Review the created files in content/platform/")
        print("   2. Add images to assets/media/platforms/ if needed")
        print("   3. Test locally with: hugo server")
        print("   4. Commit changes to git")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
