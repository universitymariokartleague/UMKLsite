# Please use .runbeforecommit.py instead
#
# This script generates the YouTube IDs for videos on the UMKL YouTube channel (excludes livestreams)

import subprocess, json
def get_yt_ids_for_channel(link):
    command = f'yt-dlp "{link}" --restrict-filenames -j'
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    
    videos = []
    for line in result.stdout.strip().split('\n'):
        if line:
            video = json.loads(line)
            upload_date = video['upload_date']
            # Format the upload date to YYYY-MM-DD
            formatted_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
            videos.append({
                'id': video['id'],
                'title': video['title'],
                'date': formatted_date
            })
    
    with open('pages/videos/videoids.json', 'w') as f:
        json.dump(videos, f, indent=4)