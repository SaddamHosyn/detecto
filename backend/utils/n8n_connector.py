import httpx
import pygame  # If you want to play real audio
import os
import colorama
from colorama import Fore, Style

# Initialize colorama for Windows terminal colors
colorama.init(autoreset=True)

# Initialize pygame mixer for audio
pygame.mixer.init()

# REPLACE THIS WITH YOUR COPIED N8N URL
N8N_URL = "https://saddamhosyn.app.n8n.cloud/webhook/human-check-v2"

def play_sound_for_action(action):
    # Get the absolute path to the folder where this script lives
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(current_dir)
    sound_path = ""
    
    if action == "low_noise":
        # YELLOW TEXT for Warning
        print(Fore.YELLOW + ">>> ACTION: Playing Low Noise - ⚠️ Warning: Crowd Growing")
        sound_path = os.path.join(backend_dir, "sounds", "low.mp3")
        
    elif action == "loud_noise":
        # RED TEXT for Critical Alert
        print(Fore.RED + Style.BRIGHT + ">>> ACTION: Playing LOUD NOISE - 🚨 CRITICAL ALERT: TOO MANY PEOPLE! 🚨")
        sound_path = os.path.join(backend_dir, "sounds", "loud.mp3")
        
    else:
        # GREEN TEXT for Safe
        print(Fore.GREEN + ">>> ACTION: Silence - ✅ Area Clear")
    
    # Play sound logic
    if sound_path and os.path.exists(sound_path):
        try:
            pygame.mixer.music.load(sound_path)
            pygame.mixer.music.play()
        except Exception as e:
            print(Fore.RED + f"Error playing sound: {e}")
    else:
        if action != "silence":
            print(Fore.RED + f"⚠️ Sound file not found at: {sound_path}")

async def process_human_count(count):
    print(f"Humans detected: {count}. Asking n8n what to do...")
    
    try:
        async with httpx.AsyncClient() as client:
            # Send the count to n8n (Increased timeout to 30s to be safe)
            response = await client.post(N8N_URL, json={"count": count}, timeout=30.0)
            
            if response.status_code == 200:
                data = response.json()
                action = data.get("sound")
                
                print(f"n8n says: {action}")
                play_sound_for_action(action)
                return action
            else:
                print(Fore.RED + "Error contacting n8n")
                
    except Exception as e:
        print(Fore.RED + f"Connection error: {e}")
