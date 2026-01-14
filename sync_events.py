#!/usr/bin/env python3
"""
Sync Events Script

This script reads EVENTS.md and automatically creates/updates Hugo content files
in content/event/ to keep your website synchronized.

Usage:
    python3 sync_events.py

Make sure EVENTS.md is up to date before running this script.
"""

import re
import os
from pathlib import Path

# File paths
BASE_DIR = Path(__file__).parent
EVENTS_FILE = BASE_DIR / "EVENTS.md"
EVENT_CONTENT_DIR = BASE_DIR / "content" / "event"


def parse_events(file_path):
    """Parse EVENTS.md and extract event information."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    events = []
    
    # Find all event entries (between ### and next ### or end)
    event_pattern = r'### (.+?)\n(.*?)(?=\n### |\Z)'
    matches = re.finditer(event_pattern, content, re.DOTALL)
    
    for match in matches:
        event_name = match.group(1).strip()
        event_content = match.group(2).strip()
        
        # Skip template/example entries
        if ('Example:' in event_name or 
            event_name.startswith('Example') or
            event_name == 'Event Name' or
            'Template' in event_name or
            event_name.startswith('*(')):
            continue
        
        # Parse event fields
        event = {'name': event_name}
        
        # Extract Title
        title_match = re.search(r'- \*\*Title:\*\*\s*(.+?)(?:\n|$)', event_content)
        if title_match:
            event['title'] = title_match.group(1).strip()
        else:
            event['title'] = event_name
        
        # Extract Event Type
        type_match = re.search(r'- \*\*Event Type:\*\*\s*(.+?)(?:\n|$)', event_content)
        event['event_type'] = type_match.group(1).strip() if type_match else 'Research Presentation'
        
        # Extract Event URL
        url_match = re.search(r'- \*\*Event URL:\*\*\s*(.+?)(?:\n|$)', event_content)
        event['event_url'] = url_match.group(1).strip() if url_match else ''
        
        # Extract Date
        date_match = re.search(r'- \*\*Date:\*\*\s*(.+?)(?:\n|$)', event_content)
        event['date'] = date_match.group(1).strip() if date_match else ''
        
        # Extract All Day
        all_day_match = re.search(r'- \*\*All Day:\*\*\s*(.+?)(?:\n|$)', event_content)
        all_day_str = all_day_match.group(1).strip().lower() if all_day_match else 'false'
        event['all_day'] = all_day_str in ['true', 'yes', '1']
        
        # Extract Location
        location_match = re.search(r'- \*\*Location:\*\*\s*(.+?)(?:\n|$)', event_content)
        event['location'] = location_match.group(1).strip() if location_match else ''
        
        # Extract Address (multi-line)
        # Address section ends at next top-level field marker (- **FieldName:**)
        address_match = re.search(r'- \*\*Address:\*\*\s*(.+?)(?=\n- \*\*|$)', event_content, re.DOTALL)
        address_content = address_match.group(1) if address_match else ''
        event['address'] = {}
        if address_content:
            # Parse each address field line by line
            # Split by lines and process each address field individually
            lines = address_content.split('\n')
            current_field = None
            current_value = []
            
            for line in lines:
                line = line.strip()
                # Check if this line starts a new address field
                if line.startswith('- Street:'):
                    if current_field and current_value:
                        event['address'][current_field] = ' '.join(current_value).strip()
                    current_field = 'street'
                    value_part = line[9:].strip()  # After "- Street:"
                    current_value = [value_part] if value_part else []
                elif line.startswith('- City:'):
                    if current_field and current_value:
                        event['address'][current_field] = ' '.join(current_value).strip()
                    current_field = 'city'
                    value_part = line[7:].strip()  # After "- City:"
                    current_value = [value_part] if value_part else []
                elif line.startswith('- Region:'):
                    if current_field and current_value:
                        event['address'][current_field] = ' '.join(current_value).strip()
                    current_field = 'region'
                    value_part = line[9:].strip()  # After "- Region:"
                    current_value = [value_part] if value_part else []
                elif line.startswith('- Postcode:'):
                    if current_field and current_value:
                        event['address'][current_field] = ' '.join(current_value).strip()
                    current_field = 'postcode'
                    value_part = line[11:].strip()  # After "- Postcode:"
                    current_value = [value_part] if value_part else []
                elif line.startswith('- Country:'):
                    if current_field and current_value:
                        event['address'][current_field] = ' '.join(current_value).strip()
                    current_field = 'country'
                    value_part = line[10:].strip()  # After "- Country:"
                    current_value = [value_part] if value_part else []
                elif current_field and line:
                    # Continuation of current field value (shouldn't happen with current format, but handle it)
                    current_value.append(line)
            
            # Handle last field
            if current_field and current_value:
                val = ' '.join(current_value).strip()
                if val:
                    event['address'][current_field] = val
            
            # Remove empty values
            event['address'] = {k: v for k, v in event['address'].items() if v}
        
        # Extract Summary
        summary_match = re.search(r'- \*\*Summary:\*\*\s*(.+?)(?:\n|$)', event_content)
        event['summary'] = summary_match.group(1).strip() if summary_match else ''
        
        # Extract Abstract (multi-line)
        abstract_match = re.search(r'- \*\*Abstract:\*\*\s*(.+?)(?:\n- \*\*|$)', event_content, re.DOTALL)
        event['abstract'] = abstract_match.group(1).strip() if abstract_match else ''
        
        # Extract Tags
        tags_match = re.search(r'- \*\*Tags:\*\*\s*(.+?)(?:\n|$)', event_content)
        if tags_match:
            tags_str = tags_match.group(1).strip()
            event['tags'] = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
        else:
            event['tags'] = []
        
        # Extract Slides URL
        slides_match = re.search(r'- \*\*Slides URL:\*\*\s*(.+?)(?:\n- \*\*|$)', event_content, re.DOTALL)
        if slides_match:
            slides_url = slides_match.group(1).strip()
            if slides_url.startswith('-') or slides_url == '':
                event['slides_url'] = ''
            else:
                event['slides_url'] = slides_url
        else:
            event['slides_url'] = ''
        
        # Extract Video URL
        video_match = re.search(r'- \*\*Video URL:\*\*\s*(.+?)(?:\n- \*\*|$)', event_content, re.DOTALL)
        if video_match:
            video_url = video_match.group(1).strip()
            if video_url.startswith('-') or video_url == '':
                event['video_url'] = ''
            else:
                event['video_url'] = video_url
        else:
            event['video_url'] = ''
        
        # Only add if we have at least a title
        if event.get('title'):
            events.append(event)
    
    return events


def create_slug(name):
    """Create a URL-friendly slug from event name."""
    # Convert to lowercase
    slug = name.lower()
    # Replace spaces and special chars with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def create_event_content(event):
    """Create Hugo content file for an event."""
    slug = create_slug(event['name'])
    event_dir = EVENT_CONTENT_DIR / slug
    event_dir.mkdir(parents=True, exist_ok=True)
    
    content_file = event_dir / "index.md"
    
    # Format date for Hugo
    date_str = event.get('date', '')
    if date_str and len(date_str) == 10:  # YYYY-MM-DD
        date_str = f"{date_str}T00:00:00Z"
    
    # Build front matter
    front_matter = "---\n"
    front_matter += f"title: '{event['title']}'\n\n"
    front_matter += f"event: {event.get('event_type', 'Research Presentation')}\n"
    
    if event.get('event_url'):
        front_matter += f"event_url: {event['event_url']}\n\n"
    
    if event.get('location'):
        front_matter += f"location: {event['location']}\n"
    
    if event.get('address') and any(event['address'].values()):
        front_matter += "address:\n"
        if event['address'].get('street'):
            front_matter += f"  street: {event['address']['street']}\n"
        if event['address'].get('city'):
            front_matter += f"  city: {event['address']['city']}\n"
        if event['address'].get('region'):
            front_matter += f"  region: {event['address']['region']}\n"
        if event['address'].get('postcode'):
            front_matter += f"  postcode: '{event['address']['postcode']}'\n"
        if event['address'].get('country'):
            front_matter += f"  country: {event['address']['country']}\n"
    
    if date_str:
        front_matter += f"\ndate: '{date_str}'\n"
        front_matter += f"all_day: {str(event.get('all_day', False)).lower()}\n"
    
    front_matter += "\n# Schedule page publish date (NOT talk date).\n"
    front_matter += "publishDate: '2017-01-01T00:00:00Z'\n\n"
    front_matter += "authors:\n  - admin\n\n"
    
    if event.get('tags'):
        front_matter += "tags:\n"
        for tag in event['tags']:
            front_matter += f"  - {tag}\n"
    else:
        front_matter += "tags: []\n"
    
    front_matter += "\n# Is this a featured talk? (true/false)\n"
    front_matter += "featured: false\n\n"
    
    if event.get('summary'):
        front_matter += f"summary: {event['summary']}\n"
    
    if event.get('abstract'):
        front_matter += f"abstract: '{event['abstract']}'\n"
    
    if event.get('slides_url'):
        front_matter += f"\nurl_slides: '{event['slides_url']}'\n"
    else:
        front_matter += "\nurl_slides: ''\n"
    
    if event.get('video_url'):
        front_matter += f"url_video: '{event['video_url']}'\n"
    else:
        front_matter += "url_video: ''\n"
    
    front_matter += "url_code: ''\n"
    front_matter += "url_pdf: ''\n"
    front_matter += "\nslides: ''\n"
    front_matter += "---\n\n"
    
    # Add abstract as content if not already in front matter
    if event.get('abstract') and not event.get('abstract') in front_matter:
        front_matter += event['abstract']
    
    with open(content_file, 'w', encoding='utf-8') as f:
        f.write(front_matter)
    
    return slug


def main():
    """Main function to sync events."""
    print("🔍 Reading EVENTS.md...")
    
    if not EVENTS_FILE.exists():
        print(f"❌ Error: {EVENTS_FILE} not found!")
        return
    
    try:
        events = parse_events(EVENTS_FILE)
        print(f"✓ Parsed {len(events)} event(s)\n")
        
        if not events:
            print("⚠️  No events found in EVENTS.md")
            return
        
        print("📝 Creating/updating event content files...\n")
        
        # Ensure event content directory exists
        EVENT_CONTENT_DIR.mkdir(parents=True, exist_ok=True)
        
        # Get list of slugs that should exist (only from EVENTS.md)
        created_slugs = []
        for event in events:
            slug = create_event_content(event)
            created_slugs.append(slug)
            print(f"✓ Created/updated: {event['title']} ({slug})")
        
        # Note: We don't remove existing events that aren't in EVENTS.md
        # because there might be manually created events
        
        print(f"\n✅ Sync complete! {len(events)} event(s) processed.")
        print("\n📋 Next steps:")
        print("   1. Review the created files in content/event/")
        print("   2. Test locally with: hugo server")
        print("   3. Commit changes to git")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
