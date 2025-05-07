# Please use .runbeforecommit.py

import logic
import io, requests
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import discord, discord.ext.commands

# File paths
DEFAULT_ICON_PATH = "assets/image/teamemblems/DEFAULT.png"
TEAM_ICON_DIR = "assets/image/teamemblems/"
DEFAULT_FONT = "assets/pythongraphics/fonts/SF-Pro/SF-Pro-Display-Bold.otf"
DEFAULT_FONT_HEAVY = "assets/pythongraphics/fonts/SF-Pro/SF-Pro-Display-Black.otf"
FALLBACK_FONT = "assets/pythongraphics/fonts/FOT-RodinNTLG Pro DB.otf"

FALLBACK_FONT_SIZE_DIF = [0.9, 1.05]
FETCH_ERROR_MESSAGE = "Failed to fetch..."

# Caches
CACHING_ENABLED = True
FONT_CACHE = {}
IMAGE_CACHE = {}

def load_font(
    font_name: str, 
    size: int
) -> ImageFont.FreeTypeFont:
    """
    Load a font with the specified name and size, caching it for reuse.

    Args:
        font_name (str): The name of the font to load.
        size (int): The size of the font to load.

    Returns:
        ImageFont.FreeTypeFont: The loaded font object.

    Raises:
        IOError: If the specified font cannot be found, a fallback font is used instead.
    """
    key = (font_name, size)
    if CACHING_ENABLED and key in FONT_CACHE:
        return FONT_CACHE[key]
    
    try:
        font = ImageFont.truetype(font_name, size)
    except IOError:
        print(f"WARNING: {font_name} not found - using fallback font")
        font = ImageFont.truetype(FALLBACK_FONT, size)
    
    if CACHING_ENABLED:
        FONT_CACHE[key] = font
    
    return font

def load_image(
    path: str
) -> Image:
    """
    Load an image from the specified path, caching it for reuse.

    If the image is not already cached, it attempts to load the image from the given path.
    If the image cannot be found, it loads a fallback image from DEFAULT_ICON_PATH.

    Args:
        path (str): The file path to the image to be loaded.

    Returns:
        Image: The loaded image in RGBA format.

    Raises:
        IOError: If the specified image cannot be found, a fallback image is used instead.
    """
    if CACHING_ENABLED and path in IMAGE_CACHE:
        return IMAGE_CACHE[path]
    
    using_fallback = False
    try:
        image = Image.open(path).convert("RGBA")
    except IOError:
        print(f"WARNING: {path} not found - using fallback image")
        using_fallback = True
        image = Image.open(DEFAULT_ICON_PATH).convert("RGBA")
    
    if CACHING_ENABLED and not using_fallback:
        IMAGE_CACHE[path] = image
    
    return image

def add_text(
    text: str,
    pos: tuple[int, int],
    font: str = "FOT-RodinNTLG Pro DB.otf",
    size: int = 30,
    fill: str | tuple = "#fff",
    anchor: str = "",
    spacing: int = 5
) -> None:
    """
    Adds text to an image at the specified position with the given properties.

    Args:
        text (str): The text to be added to the image.
        pos (tuple[int, int]): A tuple (x, y) representing the position where the text should be placed.
        font (str, optional): The path to the font file to be used. Defaults to FOT-RodinNTLG Pro DB.otf.
        size (int, optional): The size of the font. Defaults to 30.
        fill (str or tuple, optional): The color to use for the text. Defaults to "#fff".
        anchor (str, optional): The anchor alignment of the text. Defaults to "".
        spacing (int, optional): The spacing between lines of text. Defaults to 5.
    """
    font = load_font(font, size)

    # Use fallback font for non-ASCII characters
    if not text.isascii() and (not "±" in text) and (not "—" in text): # disgusting hack
        font = ImageFont.truetype(FALLBACK_FONT, size * FALLBACK_FONT_SIZE_DIF[0])

    # Process line breaks
    if "\n" in text:
        lines = text.split("\n")
        line_height = font.getbbox("A")[3] # Height of a single line
        x, y = pos
        for line in lines:
            draw.text((x, y), line, font=font, fill=fill, anchor=anchor)
            y += line_height + spacing # Move down for the next line
    else:
        draw.text(pos, text, font=font, fill=fill, anchor=anchor)

def draw_box(
    box: tuple,
    corner_radius: int,
    fill_color: str | tuple,
    outline_color: str | tuple = "#fff",
    outline_width: int = 0
) -> None:
    """
    Draws a rectangle which can be rounded.

    Args:
        box (tuple): A tuple defining the bounding box of the rectangle (x0, y0, x1, y1).
        corner_radius (int): The radius of the corners for rounding.
        fill_color (str or tuple): The fill color of the rectangle.
        outline_color (str or tuple, optional): The outline color of the rectangle. Defaults to "#fff".
        outline_width (int, optional): The width of the outline. Defaults to 0.
    """
    draw.rounded_rectangle(box, radius=corner_radius, fill=fill_color, outline=outline_color, width=outline_width)

def draw_box_custom(
    pos: tuple[int, int],
    width: int,
    height: int,
    corner_radius: int,
    fill_color: str | tuple,
    outline_color: str | tuple = "#fff",
    outline_width: int = 0
) -> None:
    """
    Draws a rounded rectangle with specified width and height.

    Args:
        pos (tuple[int, int]): The (x, y) position of the top-left corner of the rectangle.
        width (int): The width of the rectangle.
        height (int): The height of the rectangle.
        corner_radius (int): The radius of the corners of the rectangle.
        fill_color (str or tuple): The fill color of the rectangle.
        outline_color (str or tuple, optional): The outline color of the rectangle. Defaults to "#fff".
        outline_width (int, optional): The width of the outline. Defaults to 0.
    """
    draw.rounded_rectangle((pos[0], pos[1], pos[0]+width, pos[1]+height), radius=corner_radius, fill=fill_color, outline=outline_color, width=outline_width)

def create_team_standings_image(
    season_id: int
) -> None:
    """
    Create a team standings image for the current season.

    Args:
        season_id (int): The ID of the current season.
    """
    # Load base image
    base = Image.open("assets/pythongraphics/graphics/teamstandingbgtall.png").convert("RGBA")
    global draw
    draw = ImageDraw.Draw(base)

    # Fetch team standings data
    team_standings = logic.get_season_team_standings(season_id)

    # Constants
    TITLE_POSITION = (200, 105)
    TITLE_FONT_SIZE = 60
    TITLE_COLOR = "#fff"
    ACCENT_COLOR = "#bc0839"
    INIT_POS = [200, 217]
    TEAM_ICON_SIZE = (72, 72)
    TEAM_COLOR_BOX_SIZE = (18, 72)
    POINTS_X_OFFSET = 865
    POINTS_Y_OFFSET = -12
    TEAM_NAME_OFFSET = 55
    POSITION_OFFSET = 118
    MAX_TEAMS = 20

    # Add title
    add_text(f"SEASON {season_id}", (TITLE_POSITION[0], TITLE_POSITION[1] - 50), DEFAULT_FONT, TITLE_FONT_SIZE - 15, TITLE_COLOR, anchor="lm")
    add_text("TEAM STANDINGS", TITLE_POSITION, DEFAULT_FONT, TITLE_FONT_SIZE, TITLE_COLOR, anchor="lm")
    timestamp = datetime.now().strftime("%d/%m/%Y")
    
    if (season_id == logic.get_current_season()):
        add_text(f"Standings as of\n{timestamp}", (TITLE_POSITION[0] + 900, TITLE_POSITION[1] - 85), DEFAULT_FONT, TITLE_FONT_SIZE - 35, TITLE_COLOR, anchor="rt")
    else:
        add_text(f"This season\nhas concluded", (TITLE_POSITION[0] + 900, TITLE_POSITION[1] - 85), DEFAULT_FONT, TITLE_FONT_SIZE - 35, TITLE_COLOR, anchor="rt")

    # Draw team standings
    for i, (team_id, current_points) in enumerate(team_standings[:MAX_TEAMS]):
        team_data = logic.get_team_data(team_id)
        current_name = team_data[1]
        team_color = logic.get_team_color(team_id)

        # Add position marker
        add_text(f"{i+1}", (INIT_POS[0] - POSITION_OFFSET, INIT_POS[1]), DEFAULT_FONT, 52, TITLE_COLOR, anchor="mm")

        # Add team name
        add_text(current_name.upper(), (INIT_POS[0] + TEAM_NAME_OFFSET, INIT_POS[1]), DEFAULT_FONT, 60, ACCENT_COLOR, anchor="lm")

        # Add team emblem
        emblem_path = f"{TEAM_ICON_DIR}{current_name}.png"
        icon = load_image(emblem_path).resize(TEAM_ICON_SIZE, Image.BILINEAR)
        base.paste(icon, (INIT_POS[0] - 35, INIT_POS[1] - 35), icon)

        # Add team color rounded boxes
        draw_box_custom((INIT_POS[0] - 70, INIT_POS[1] - 36), *TEAM_COLOR_BOX_SIZE, 7, team_color)

        # Add points
        add_text(f"{current_points}", (INIT_POS[0] + POINTS_X_OFFSET, INIT_POS[1] + POINTS_Y_OFFSET), DEFAULT_FONT, 50, ACCENT_COLOR, anchor="rm")
        
        # Add match counter
        matches = logic.get_team_matches_played(team_id, season_id)
        add_text(f"{matches} {'match' if matches == 1 else 'matches'}".upper(), (INIT_POS[0] + POINTS_X_OFFSET, INIT_POS[1] + 25), DEFAULT_FONT, 20, ACCENT_COLOR, anchor="rm")

        # Update Y position for the next team
        INIT_POS[1] += POSITION_OFFSET

    # Crop the image to only show the number of teams in the chosen season
    final_height = POSITION_OFFSET * min(len(team_standings), MAX_TEAMS) + 166  # Adjusted height
    cropped_base = base.crop((0, 0, 1125, final_height))

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    cropped_base.save(f"assets/pythongraphics/output/team_standings_season{season_id}.png")

def create_event_versus_image(
    team_IDs: list[int]
) -> None:
    """
    Create a versus image for two teams.

    Args:
        team_IDs (list[int]): List containing the IDs of the two teams.
    """
    # Load base image
    base = Image.open("assets/pythongraphics/graphics/vsbg.png").convert("RGBA")
    global draw
    draw = ImageDraw.Draw(base)

    # Fetch team data
    team_data = [logic.get_team_data(team_id) for team_id in team_IDs]
    team_names = [team[1] for team in team_data]
    full_team_names = [team[2] for team in team_data]
    team_colors = [team[3] for team in team_data]
    
    # Constants
    OVERLAY_PATH = "assets/pythongraphics/graphics/vsoverlay.png"
    ACCENT_COLOR = "#fff"
    TEXT_POS = [(1022, 600), (3378, 600)]
    FULL_TEXT_Y_OFFSET = 1275
    EMBLEM_WIDTH = 750
    EMBLEM_Y = 862

    # Draw team color boxes
    for i, (x, y) in enumerate([(0, 0), (2200, 0)]):
        draw_box_custom((x, y), 2200, 2475, 0, team_colors[i], ACCENT_COLOR, 0)

    # Add team names and full team names
    for i, (text, full_text) in enumerate(zip(team_names, full_team_names)):
        add_text(text.upper(), TEXT_POS[i], DEFAULT_FONT_HEAVY, 275, ACCENT_COLOR, anchor="mm")
        add_text(full_text.upper(), (TEXT_POS[i][0], TEXT_POS[i][1] + FULL_TEXT_Y_OFFSET), DEFAULT_FONT, 110, ACCENT_COLOR, anchor="mm")
    
    # Add overlay
    overlay = load_image(OVERLAY_PATH)
    base = Image.alpha_composite(base, overlay)

    # Add emblems
    for i, team_name in enumerate(team_names):
        emblem_path = f"{TEAM_ICON_DIR}{team_name}.png"
        icon = load_image(emblem_path).resize((EMBLEM_WIDTH, EMBLEM_WIDTH), Image.BILINEAR)
        base.paste(icon, (TEXT_POS[i][0] - (EMBLEM_WIDTH // 2), EMBLEM_Y), icon)
    
    base.save("assets/pythongraphics/output/versus.png")

async def create_results_image(
    bot: discord.ext.commands.Bot,
    tournament_id: int
) -> None:
    """
    Create a results image for the current season.

    Args:
        bot (discord.ext.commands.Bot): The bot object from Discord.
        tournament_id (int): The ID of the tournament.
    """
    # Load base image
    base = Image.open("assets/pythongraphics/graphics/resultsbg.png").convert("RGBA")
    global draw
    draw = ImageDraw.Draw(base)

    # Fetch data
    team_points = logic.get_tournament_team_results(tournament_id, 1)
    score_data = logic.get_tournament_player_results(tournament_id, 1)

    # Sort by score in descending order and assign positions with ties
    sorted_scores = sorted(score_data, key=lambda x: x[2], reverse=True)
    position_map = {}
    prev_score = None
    position = 1

    for i, data in enumerate(sorted_scores):
        current_score = data[2]
        if current_score != prev_score:
            position = i + 1
        position_map[data[2]] = position
        prev_score = current_score

    # Assign positions to the original score_data while maintaining its order
    score_data_with_positions = [(position_map[data[2]], *data) for data in score_data]

    # Fetch team data
    if len(team_points) < 2:
        print(f"ERROR: Tournament ID: {tournament_id} doesn't have any scores assigned to it.")
        return
    team_data = [logic.get_team_data(team_points[0][0]), logic.get_team_data(team_points[1][0])]
    team_names = [team[1] for team in team_data]
    team_colors = [team[3] for team in team_data]

    # Constants
    TEAM_FONT_SIZE = 135
    TEAM_SCORE_FONT_SIZE = 425
    PLAYER_FONT_SIZE = 100
    PLAYER_MAX_WIDTH = 900
    POSITION_FONT_SIZE = 75
    OVERLAY_PATH = "assets/pythongraphics/graphics/resultsoverlay.png"
    ACCENT_COLOR = "#fff"
    TEXT_POS = [(465, 1215 + -270), (465, 2430 + -270)] # split at y = 1215
    FULL_TEXT_X_OFFSET = 2300
    FULL_TEXT_Y_OFFSET = -325
    EMBLEM_WIDTH = 600

    # Draw team color boxes
    for i, (x, y) in enumerate([(0, 0), (0, 1215)]):
        draw_box_custom((x, y), 3268, 1215, 0, team_colors[i], ACCENT_COLOR, 0)

    # Add overlay
    overlay = load_image(OVERLAY_PATH)
    base = Image.alpha_composite(base, overlay)
    draw = ImageDraw.Draw(base)  # Reinitialize draw after overlay

    # Add team names and scores
    for i, (team_name, team_score_data) in enumerate(zip(team_names, team_points)):
        add_text(team_name.upper(), TEXT_POS[i], DEFAULT_FONT, TEAM_FONT_SIZE, ACCENT_COLOR, anchor="mm")
        add_text(str(team_score_data[1]), (TEXT_POS[i][0] + FULL_TEXT_X_OFFSET, TEXT_POS[i][1] + FULL_TEXT_Y_OFFSET), DEFAULT_FONT, TEAM_SCORE_FONT_SIZE, ACCENT_COLOR, anchor="mm")

    # Split score data into two arrays for the winning and losing teams
    winning_team = score_data_with_positions[0][1] # First user in list should be on the winning team
    winning_team_results = []
    losing_team_results = []
    for result in score_data_with_positions:
        if result[1] == winning_team:
            winning_team_results.append(result)
        else:
            losing_team_results.append(result)
        
    # Add match results
    async def add_match_results(score_data, y_offset, text_color):
        for i, match_data in enumerate(score_data):
            # Fetch discord username
            member_name = FETCH_ERROR_MESSAGE
            if bot and match_data[2] > 0:
                member_object = bot.get_user(match_data[2])
                if member_object is None:
                    member_object = await bot.fetch_user(match_data[2])
                member_name = member_object.name

            # Add position
            add_text(f"{match_data[0]}", (1022, y_offset + (i * 192)), DEFAULT_FONT, POSITION_FONT_SIZE, ACCENT_COLOR, anchor="mm")

            # Truncate member_name if necessary
            max_width = PLAYER_MAX_WIDTH * (1 if member_name.isascii() else FALLBACK_FONT_SIZE_DIF[1])
            member_name_width = draw.textlength(member_name, font=load_font(DEFAULT_FONT, PLAYER_FONT_SIZE))
            if member_name_width > max_width:
                font = load_font(DEFAULT_FONT, PLAYER_FONT_SIZE)
                ellipsis_width = draw.textlength("...", font=font)
                truncated_text = member_name
                while draw.textlength(truncated_text, font=font) + ellipsis_width > max_width:
                    truncated_text = truncated_text[:-1]
                member_name = truncated_text + "..."

            # Add discord username and score
            add_text(f"{member_name}", (1110, y_offset - 2 + (i * 192)), DEFAULT_FONT, PLAYER_FONT_SIZE, text_color, anchor="lm")
            add_text(f"{match_data[3]}", (2200, y_offset - 2 + (i * 192)), DEFAULT_FONT, PLAYER_FONT_SIZE, text_color, anchor="rm")

    # Add top and bottom match results
    await add_match_results(winning_team_results, 118, team_colors[0])
    if losing_team_results:
        await add_match_results(losing_team_results, 1358, team_colors[1])

    # Add points gap
    points_gap = team_points[0][1] - team_points[1][1]
    add_text(f"±{abs(points_gap)}", (2770, 1215), DEFAULT_FONT, PLAYER_FONT_SIZE, "#bc0839", anchor="mm")

    # Add emblems
    for i, team_name in enumerate(team_names):
        emblem_path = f"{TEAM_ICON_DIR}{team_name}.png"
        icon = load_image(emblem_path).resize((EMBLEM_WIDTH, EMBLEM_WIDTH), Image.BILINEAR)
        base.paste(icon, (TEXT_POS[i][0] - (EMBLEM_WIDTH // 2),  (TEXT_POS[i][1] - 700)), icon)

    base.save("assets/pythongraphics/output/results.png")

def create_winner_image(
    tournament_id: int
) -> None:
    """
    Create an image for the winning team of a tournament.

    Args:
        tournament_id (int): The ID of the tournament.
    """
    # Load base image
    base = Image.open("assets/pythongraphics/graphics/winnerbg.png").convert("RGBA")
    global draw
    draw = ImageDraw.Draw(base)

    # Fetch data
    team_points = logic.get_tournament_team_results(tournament_id, 1)
    if len(team_points) < 2:
        print(f"ERROR: Tournament ID: {tournament_id} doesn't have any scores assigned to it.")
        return
    team_data = [logic.get_team_data(team_points[0][0]), logic.get_team_data(team_points[1][0])]
    team_names = [team[1] for team in team_data]
    team_colors = [team[3] for team in team_data]

    # Constants
    OVERLAY_PATH = "assets/pythongraphics/graphics/winneroverlay.png"
    ACCENT_COLOR = "#fff"
    MATCH_FONT_SIZE = 135
    SCORE_FONT_SIZE = 90
    EMBLEM_WIDTH = 1350

    # Draw winning team color as background
    draw_box_custom((0, 0), 2474, 2474, 0, team_colors[0], ACCENT_COLOR, 0)

    # Add overlay
    overlay = load_image(OVERLAY_PATH)
    base = Image.alpha_composite(base, overlay)
    draw = ImageDraw.Draw(base)  # Reinitialize draw after overlay

    # Add team names and scores
    add_text(f"{team_names[0]} VS {team_names[1]}".upper(), (1237, 1730), DEFAULT_FONT, MATCH_FONT_SIZE, ACCENT_COLOR, anchor="mm")
    add_text(f"{team_names[0]} {team_points[0][1]} — {team_names[1]} {team_points[1][1]}".upper(), (1237, 2290), DEFAULT_FONT, SCORE_FONT_SIZE, ACCENT_COLOR, anchor="mm")

    # Add emblem
    emblem_path = f"{TEAM_ICON_DIR}{team_names[0]}.png"
    icon = load_image(emblem_path).resize((EMBLEM_WIDTH, EMBLEM_WIDTH), Image.BILINEAR)
    base.paste(icon, (1237 - (EMBLEM_WIDTH // 2), 235), icon)

    base.save("assets/pythongraphics/output/winner.png")

def create_welcome_image(
    user: discord.User
) -> None:
    """
    Create a welcome image for a user.

    Args:
        user (discord.User): The user to create the welcome image for.
    """
    # Load base image
    base = Image.open("assets/pythongraphics/graphics/welcomebg.png").convert("RGBA")
    global draw
    draw = ImageDraw.Draw(base)

    # Constants
    ACCENT_COLOR = "#bc0839"
    TEXT_POS = (468, 894)
    CIRCLE_WIDTH = 625
    PLAYER_FONT_SIZE = 80
    PLAYER_MAX_WIDTH = 700

    # Add user avatar
    useravatarimage = Image.open(requests.get(user.avatar, stream=True).raw) if user else Image.open(DEFAULT_ICON_PATH)
    
    # # Get accent_color from profile picture
    # accent_color = get_accent_color(useravatarimage)
    # draw_box_custom((0, 0), 1920, 10, 0, accent_color, ACCENT_COLOR, 0)
    # draw_box_custom((0, 1070), 1920, 10, 0, accent_color, ACCENT_COLOR, 0)
    # draw_box_custom((0, 0), 10, 1080, 0, accent_color, ACCENT_COLOR, 0)
    # draw_box_custom((1910, 0), 10, 1080, 0, accent_color, ACCENT_COLOR, 0)

    avatar_image = crop_to_circle(useravatarimage).resize((CIRCLE_WIDTH, CIRCLE_WIDTH), resample=Image.BICUBIC)
    base.paste(avatar_image, (460 - CIRCLE_WIDTH // 2, 452 - CIRCLE_WIDTH // 2), avatar_image)

    username = user.name if user else FETCH_ERROR_MESSAGE

    # Truncate member_name if necessary
    max_width = PLAYER_MAX_WIDTH * (1 if username.isascii() else FALLBACK_FONT_SIZE_DIF[1])
    member_name_width = draw.textlength(username, font=load_font(DEFAULT_FONT, PLAYER_FONT_SIZE))
    if member_name_width > max_width:
        font = load_font(DEFAULT_FONT, PLAYER_FONT_SIZE)
        ellipsis_width = draw.textlength("...", font=font)
        truncated_text = username
        while draw.textlength(truncated_text, font=font) + ellipsis_width > max_width:
            truncated_text = truncated_text[:-1]
        username = truncated_text + "..."

    # Add username
    add_text(username, TEXT_POS, DEFAULT_FONT, PLAYER_FONT_SIZE, ACCENT_COLOR, anchor="mm")

    base.save("assets/pythongraphics/output/welcome.png")

def crop_to_circle(
    image: Image
) -> Image:
    """
    Crop an image to a circle.

    Args:
        image (Image): The image to crop.

    Returns:
        Image: The cropped image.
    """
    image = image.resize((1000, 1000))

    # Create a mask with the same size as the image
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, image.size[0], image.size[1]), fill=255)

    # Apply the circular mask to the image
    result = Image.new("RGBA", image.size)
    result.paste(image, mask=mask)

    return result

# def get_luminance(rgb):
#     """Calculate the perceived luminance of an RGB color."""
#     r, g, b = rgb
#     return 0.299 * r + 0.587 * g + 0.114 * b

# def get_accent_color(image, min_luminance=50, max_luminance=200):
#     """Get the accent color of an image, excluding very dark and very light colors."""
#     from collections import Counter

#     # Resize the image to speed up processing
#     image = image.resize((100, 100))
    
#     # Convert the image to RGB if it's not already
#     image = image.convert('RGB')
    
#     # Get all pixels from the image
#     pixels = list(image.getdata())
    
#     # Filter out dark colors based on luminance
#     filtered_pixels = [
#         pixel for pixel in pixels 
#         if min_luminance <= get_luminance(pixel) <= max_luminance
#     ]
    
#     if not filtered_pixels:
#         return "#bc0839" # default color
    
#     # Find the most common color among the filtered pixels
#     most_common_color = Counter(filtered_pixels).most_common(1)[0][0]
    
#     return most_common_color

def process_bytes_image(image_path):
    """Process an image and return it as bytes."""
    try:
        with Image.open(image_path) as img:
            # Save the image to a bytes buffer
            with io.BytesIO() as image_buffer:
                img.save(image_buffer, format="PNG")
                image_buffer.seek(0)
                return image_buffer.read()
    except Exception as e:
        raise ValueError(f"Failed to process image: {e}")

# async def main():
    # max_season = logic.get_current_season()
    # for i in range(1, max_season + 1):
        # create_team_standings_image(season_id=i)

    # create_event_versus_image(team_IDs=[1, 2])
    # await create_results_image(None, tournament_id=7)
    # create_winner_image(tournament_id=7)
    # create_welcome_image(None)

# if __name__ == "__main__":
#     import asyncio
#     asyncio.run(main())