import sqlite3
import discord
import re
from multipledispatch import dispatch

connection = sqlite3.connect('database/umkl_db.db')
cursor = connection.cursor()

# ---------------
# GET CURRENT SEASON / TOURNAMENT
# ---------------
def get_current_season():
    """Fetch the ID of the most recent season from the database."""
    return cursor.execute(f"""SELECT MAX(season_id)
                              FROM season""").fetchone()[0]

def get_current_tournament_id():
    """Fetch the ID of the most recent tournament from the database."""
    return cursor.execute(f"""SELECT MAX(tournament_id)
                              FROM tournament""").fetchone()[0]

# ---------------
# REGISTRATION
# ---------------
def is_user_registered(user):
    """Check if a user is already registered in the database."""
    return cursor.execute(f"""SELECT 1
                            FROM user
                            WHERE user_id = {user.id}
                            """).fetchone()

def register_user(user):
    """Register a new user in the database."""
    cursor.execute(f"""INSERT INTO user (user_id)
                    VALUES ({user.id})
                    """)
                    
    connection.commit()

# ---------------
# POINTS / STANDINGS
# ---------------
def get_team_career_points(team_id):
    """Calculate the total career points for a team across all tournaments."""
    return cursor.execute(f"""SELECT SUM(points)
                              FROM tournament_result, tournament_entry
                              WHERE team_id = {team_id}
                              AND tournament_result.tournament_entry_id = tournament_entry.tournament_entry_id
                              AND approved = 1
                              """).fetchone()[0]

def get_team_season_points(team_id, season_id):
    """Calculate the total points for a team in a specific season."""
    points =  cursor.execute(f"""SELECT SUM(points)
                                 FROM tournament_result, tournament_entry, tournament
                                 WHERE team_id = {team_id}
                                 AND tournament_result.tournament_entry_id = tournament_entry.tournament_entry_id
                                 AND tournament_entry.tournament_id = tournament.tournament_id
                                 AND approved = 1
                                 AND season_id = {season_id}""").fetchone()[0]
    
    return points if points else 0

def get_season_team_standings(season_id):
    """Get the standings of all teams in a specific season, sorted by points."""
    standings = []
    for team_data in get_season_teams(season_id):
        team_points = get_team_season_points(team_data[0], season_id)
        standings.append((team_data[0], team_points))

    return sorted(standings, key=lambda x: x[1], reverse=True)
        
def get_team_season_position(team_id, season_id):
    """Get the ordinal position (eg: 1st, 2nd) of a team in a specific season."""
    ordinal = lambda n: "%d%s" % (n,"tsnrhtdd"[(n//10%10!=1)*(n%10<4)*n%10::4])
    for i, (team, points) in enumerate(get_season_team_standings(season_id)):
        if team == team_id:
            return ordinal(i+1)

def get_team_tournament_points(tournament_id, team_id):
    """Calculate the total points for a team in a specific tournament."""
    return cursor.execute(f"""SELECT SUM(points)
                                FROM tournament_result, tournament_entry, tournament
                                WHERE team_id = {team_id}
                                AND tournament.tournament_id = {tournament_id}
                                AND tournament_result.tournament_entry_id = tournament_entry.tournament_entry_id
                                AND tournament_entry.tournament_id = tournament.tournament_id
                                AND approved = 1
                                """).fetchone()[0]

# ---------------
# USER/TEAM DATA
# ---------------
def get_season_teams(season_id):
    """Fetch all teams participating in a specific season."""
    return cursor.execute(f"""SELECT team.team_id, team_name, team_color FROM team, season_entry
                              WHERE season_id = {season_id}
                              AND team.team_id = season_entry.team_id""").fetchall()

def get_user_current_team_id(user):
    """Fetch the team ID associated with a specific user."""

    query = """
        SELECT team.team_id 
        FROM user
        JOIN tournament_result ON user.user_id = tournament_result.user_id
        JOIN tournament_entry ON tournament_result.tournament_entry_id = tournament_entry.tournament_entry_id
        JOIN team ON tournament_entry.team_id = team.team_id
        WHERE user.user_id = ?
        ORDER BY tournament_entry.tournament_entry_id DESC
        LIMIT 1
    """

    cursor.execute(query, (user.id,))
    result = cursor.fetchone()
    
    if result is None:
        return None
    
    return result[0]

def get_user_career_points(user):
    """Calculate the total career points for a user across all tournaments."""
    points = cursor.execute(f"""SELECT SUM(points) FROM tournament_result
                                WHERE user_id = {user.id}
                                AND approved = 1""").fetchone()[0]
    
    return points if points else 0

def get_user_tournament_entries(user):
    """Fetch all tournament entries for a specific user."""
    return cursor.execute(f"""SELECT tournament_id 
                                FROM tournament_entry, tournament_result
                                WHERE tournament_entry.tournament_entry_id = tournament_result.tournament_entry_id
                                AND user_id = {user.id}
                                AND points IS NOT NULL""").fetchall()

def get_team_names_list():
    """Fetch a list of team names."""
    return cursor.execute(f"""SELECT team_name FROM team""").fetchall()

def get_team_id_and_name_list():
    return cursor.execute(f"""SELECT team_id, team_name FROM team""").fetchall()

def get_teams_list():
    return cursor.execute(f"""SELECT * FROM team""").fetchall()

def get_team_data(team_id):
    """Fetch all data for a specific team."""
    return cursor.execute(f"""SELECT * FROM team WHERE team_id = {team_id}""").fetchone()

def get_team_color(team_id):
    """Fetch color for a specific team."""
    result = cursor.execute(f"""SELECT team_color FROM team WHERE team_id = {team_id}""").fetchone()
    if result:
        return result[0]  # Return the first element of the tuple
    return "#000000"  # Error

def get_team_color_from_team_name(team_name):
    """Fetch color for a specific team."""
    result = cursor.execute(f"""SELECT team_color FROM team WHERE team_name = '{team_name}'""").fetchone()
    if result:
        return result[0]  # Return the first element of the tuple
    return "#000000"  # Error

def get_team_matches_played(team_id, season_id):
    """Return the amount of matches a team has played in a specific season."""
    query = """
        SELECT COUNT(DISTINCT te.tournament_id)
        FROM tournament_result tr
        JOIN tournament_entry te ON tr.tournament_entry_id = te.tournament_entry_id
        JOIN tournament t ON te.tournament_id = t.tournament_id
        WHERE te.team_id = ? AND t.season_id = ?
    """
    cursor.execute(query, (team_id, season_id))
    result = cursor.fetchone()
    if result:
        return result[0]
    return -1

def get_tournament_standings(tournament_id):
    """Fetch the standings for a specific tournament, ordered by points."""
    return cursor.execute(f"""SELECT tournament_entry.tournament_entry_id, user_id, points, tournament_id, team_id 
                                FROM tournament_result, tournament_entry
                                WHERE tournament_id = {tournament_id}
                                AND tournament_entry.tournament_entry_id = tournament_result.tournament_entry_id 
                                ORDER BY points DESC""").fetchall()
    
def get_user_tournament_wins(user):
    """Calculate the number of tournament wins for a specific user."""
    wins = 0
    for tournament_id in get_user_tournament_entries(user):
        if get_tournament_standings(tournament_id[0])[0][1] == user.id:
            wins += 1

    return wins

def get_team_tournaments(team_id):
    """Fetch all tournament IDs for a specific team."""
    return cursor.execute(f"""SELECT tournament_id FROM tournament_entry WHERE team_id = {team_id}""").fetchall()

def get_team_wins(team_id):
    """Calculate the number of tournament wins for a specific team."""
    wins = []
    for tournament_id in get_team_tournaments(team_id):
        results = get_tournament_team_results(tournament_id[0], 1)
        if results:
            if results[0][0] == team_id:
                wins.append(tournament_id)

    return wins

def get_team_losses(team_id):
    """Calculate the number of tournament losses for a specific team."""
    losses = []
    for tournament_id in get_team_tournaments(team_id):
        results = get_tournament_team_results(tournament_id[0], 1)
        if results:
            if results[0][0] != team_id:
                losses.append(tournament_id)

    return losses

def get_user_tournament_podiums(user):
    """Calculate the number of podium finishes (1st, 2nd, or 3rd) for a specific user."""
    podiums = 0

    for tournament_id in get_user_tournament_entries(user):
        standings = get_tournament_standings(tournament_id[0])

        if standings[0][1] == user.id:  # 1st place
            podiums += 1
        elif len(standings) > 1 and standings[1][1] == user.id:  # 2nd place
            podiums += 1
        elif len(standings) > 2 and standings[2][1] == user.id:  # 3rd place
            podiums += 1

    return podiums

def get_user_highest_finish(user):
    """Determine the highest finish (best position) achieved by a user in any tournament."""
    highest_finish = None

    for tournament_id in get_user_tournament_entries(user):
        standings = get_tournament_standings(tournament_id[0])

        for position, (tournament_id, user_id, _, _, _) in enumerate(standings, start=1):
            if user_id == user.id:
                if highest_finish is None or position < highest_finish:
                    highest_finish = position
                break  # No need to check further once user is found
    ordinal = lambda n: "%d%s" % (n,"tsnrhtdd"[(n//10%10!=1)*(n%10<4)*n%10::4]) # 1 -> First etc
    return ordinal(highest_finish) if highest_finish is not None else "N/A"

# ---------------
# TOURNAMENT
# ---------------
def create_tournament(tournament_date):
    """Create a new tournament in the database."""

    query = """
    INSERT INTO tournament (season_id, tournament_date, game_id)
    VALUES (?, ?, ?)
    """
    values = (get_current_season(), tournament_date, 9)
    cursor.execute(query, values)
    connection.commit()
    return 1

def register_user_for_tournament(user, tournament_entry_id):
    """Register a user for a specific tournament."""
    cursor.execute(f"""INSERT INTO tournament_result (tournament_entry_id, user_id)
                       VALUES ({tournament_entry_id}, {user.id})""")
    connection.commit()
    return 1

def is_in_tournament(user, tournament_entry_id):
    """Check if a user is in a tournament."""
    result = cursor.execute(f"""SELECT * FROM tournament_result 
                                WHERE tournament_entry_id = {tournament_entry_id} and user_id = {user.id}""").fetchone()
    return result is not None

def has_open_tournament_from_entry_id(tournament_entry_id):
    """Check if there is an open tournament for a given tournament_entry_id."""
    result = cursor.execute(f"""SELECT 1
                                FROM tournament_result
                                WHERE tournament_entry_id = {tournament_entry_id} AND approved = 0""").fetchone()
    return result

def has_open_tournament_from_tournament_id(tournament_id):
    """Check if there is an open tournament for a given tournament_id."""
    result = cursor.execute(f"""SELECT 1
                                FROM tournament_result tr
                                JOIN tournament_entry te On tr.tournament_entry_id = te.tournament_entry_id
                                WHERE te.tournament_id = {tournament_id} AND tr.points approved = 0""").fetchone()
    return result

def get_tournament_entry(team_id, tournament_id):
    return cursor.execute(f"""SELECT tournament_entry_id
                              FROM tournament_entry
                              WHERE team_id = {team_id} AND tournament_id = {tournament_id}""").fetchone()[0]

def get_latest_tournament_entry(team_id):
    """Fetch the latest tournament_entry_id for a given team_id."""
    return cursor.execute(f"""SELECT MAX(tournament_entry_id) FROM tournament_entry WHERE team_id = {team_id}""").fetchone()[0]

def get_tournament_entry_participants(tournament_entry_id):
    """Fetch all user_id participating in a specific tournament entry."""
    return cursor.execute(f"""SELECT user_id FROM tournament_result WHERE tournament_entry_id = {tournament_entry_id}""").fetchall()

def create_new_tournament_entry(team_id):
    """Create a new tournament entry for a specific team."""
    cursor.execute(f"INSERT INTO tournament_entry (team_id, tournament_id) VALUES ({team_id}, {get_current_tournament_id()})")
    connection.commit()
    return 1
def set_signup_message_id(tournament_entry_id, signup_message_id):
    cursor.execute(f"""UPDATE tournament_entry SET signup_message_id = {signup_message_id} WHERE tournament_entry_id = {tournament_entry_id}""")
    connection.commit()
    return 1
def get_signup_message_id(tournament_entry_id):
    return cursor.execute(f"""
                    SELECT signup_message_id
                    FROM tournament_entry
                    WHERE tournament_entry_id = {tournament_entry_id}""").fetchone()[0]

@dispatch(discord.Interaction)
def get_team_id_from_role(interaction):
    """Check if the user has a discord role with a corresponding team_name value"""
    for team_name in get_team_names_list():
        current_team_role = discord.utils.get(interaction.guild.roles, name=team_name[0])
        user_roles = interaction.user.roles
        if current_team_role in user_roles:
            return cursor.execute(f"""SELECT team_id FROM team WHERE team_name = '{current_team_role}'""").fetchone()[0]
    return None

@dispatch(discord.Member)
def get_team_id_from_role(member):
    """Check if the user has a discord role with a corresponding team_name value"""
    for team_name in get_team_names_list():
        current_team_role = discord.utils.get(member.guild.roles, name=team_name[0])
        user_roles = member.roles
        if current_team_role in user_roles:
            return cursor.execute(f"""SELECT team_id FROM team WHERE team_name = '{current_team_role}'""").fetchone()[0]
    return None
        

def get_role_from_team_id(interaction, team_id):
    return discord.utils.get(interaction.guild.roles, name=get_team_data(team_id)[1])

def get_team_id_from_entry(tournament_entry_id):
    return cursor.execute(f"""SELECT team_id
                              FROM tournament_entry
                              WHERE tournament_entry_id = {tournament_entry_id}""").fetchone()[0]


def get_tournament_id_from_entry(tournament_entry_id):
    """Convert tournament_entry to tournament_id"""
    return cursor.execute(f"""SELECT tournament_id FROM tournament_entry WHERE tournament_entry_id = {tournament_entry_id}""").fetchone()[0]

def get_tournament_teams(tournament_id):
    """Get the team_ids of the teams in a tournament"""
    return cursor.execute(f"""SELECT team_id FROM tournament_entry WHERE tournament_id = {tournament_id} ORDER BY tournament_entry_id""").fetchall()

def get_tournament_name(tournament_id):
    """Get the auto-generated tournament name based on tournament_id"""
    team_names = [get_team_data(team_id[0])[1] for team_id in get_tournament_teams(tournament_id)]
    return f"{team_names[0]} VS {team_names[1]}"

def get_tournament_date(tournament_id):
    """Get the date of a tournament based on tournament_id"""
    return cursor.execute(f"""SELECT tournament_date FROM tournament WHERE tournament_id = {tournament_id}""").fetchone()[0]

def get_tournament_players(tournament_entry_id):
    return cursor.execute(f"""SELECT user_id
                                FROM tournament_result
                                WHERE tournament_entry_id = {tournament_entry_id}""").fetchall()

def substitute_player(current_player, substitute_player, tournament_entry_id):
    cursor.execute(f"""UPDATE tournament_result
                        SET user_id = {substitute_player.id}
                        WHERE user_id = {current_player.id} AND tournament_entry_id = {tournament_entry_id}""")
    connection.commit()
    return 1

def submit_score(tournament_entry_id, user_id, points):
    cursor.execute(f"""UPDATE tournament_result SET points = {points} WHERE tournament_entry_id = {tournament_entry_id} AND user_id = {user_id}""")
    connection.commit()
    return 1

def get_tournament_player_results(tournament_id, approved):
    """Get the tournament results for a given tournament_id. Approved is always 1 except when checking approval. Sorts by team_id (ascending) and points (descending)."""
    return cursor.execute(f"""SELECT te.team_id, tr.user_id, tr.points
                                FROM tournament_result tr
                                JOIN tournament_entry te ON tr.tournament_entry_id = te.tournament_entry_id
                                JOIN (
                                    SELECT te.team_id, SUM(tr.points) AS total_points
                                    FROM tournament_result tr
                                    JOIN tournament_entry te ON tr.tournament_entry_id = te.tournament_entry_id
                                    WHERE te.tournament_id = {tournament_id} AND tr.approved = {approved}
                                    GROUP BY te.team_id
                                ) tp ON te.team_id = tp.team_id
                                WHERE te.tournament_id = {tournament_id} AND tr.approved = {approved}
                                ORDER BY tp.total_points DESC, tr.points DESC""").fetchall()


def get_tournament_team_results(tournament_id, approved):
    return cursor.execute(f"""SELECT team_id, tp.total_points
                            FROM (
                                SELECT te.team_id, SUM(tr.points) AS total_points
                                FROM tournament_result tr
                                JOIN tournament_entry te ON tr.tournament_entry_id = te.tournament_entry_id
                                WHERE te.tournament_id = {tournament_id} AND tr.approved = {approved}
                                GROUP BY te.team_id
                            ) tp
                            ORDER BY tp.total_points DESC""").fetchall()


def is_all_results_added(tournament_id):
    num_null_results = cursor.execute(f"""SELECT COUNT(*)
                                           FROM tournament_result tr
                                           JOIN tournament_entry te ON tr.tournament_entry_id = te.tournament_entry_id
                                           WHERE te.tournament_id = {tournament_id}
                                           AND tr.points IS NULL
                                        """).fetchone()[0]
    return num_null_results == 0


def approve_results(tournament_id):
    cursor.execute(f"""UPDATE tournament_result
                           SET approved = 1
                           WHERE tournament_entry_id IN (
                               SELECT tournament_entry_id
                               FROM tournament_entry
                               WHERE tournament_id = {tournament_id}
                           )""")
    
    connection.commit()
    return 1


def start_new_season():
    cursor.execute(f"""INSERT INTO season DEFAULT VALUES""")
    connection.commit()
    return 1

# ---------------
# TEAM
# ---------------
def create_new_team(team_name: str, team_full_name: str, team_color: str):
    query = """INSERT INTO team (team_name, team_full_name, team_color)
                VALUES (?, ?, ?)"""
    cursor.execute(query, (team_name, team_full_name, team_color))
    connection.commit()
    return 1

def create_season_entry(team_id, season_id):
    cursor.execute(f"""INSERT INTO season_entry (team_id, season_id) VALUES ({team_id}, {season_id})""")
    connection.commit()
    return 1

def is_team_in_season(team_id, season_id):
    result = cursor.execute(f"""SELECT 1 FROM season_entry WHERE team_id = {team_id} AND season_id = {season_id}""").fetchone()
    return result is not None

# ---------------
# MISC
# ---------------
def is_hex_color(s):
    if s.startswith("#"):
        s = s[1:]
    hex_pattern = r"^([A-Fa-f0-9]{6})$"
    return bool(re.match(hex_pattern, s))