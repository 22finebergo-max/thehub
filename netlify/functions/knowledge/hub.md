# The Game Hub: what it is

The Game Hub is a free site of games made by Amaan and friends. It runs on Netlify as plain static files (HTML, CSS, JavaScript), with no build step. It can be installed as an app on a phone (it is a PWA) and most games also work offline after the first visit. Scores and some features are saved in a shared Supabase database. Photos of the people in the games are used with their permission.

The home page lists every game as a card. Clicking a card opens the game. The Settings button at the top of the home page holds the sound and haptics options and the profile. The "Ask the Hub" button on the home page opens this assistant.

## Games on the hub

- **Tic-Tac-Zach** (crewarcade): noughts and crosses against Zach. Easy is random, Hard is unbeatable. Build a win streak for the leaderboard.
- **Crew Memory** (crewarcade): flip and match pairs of the crew. Race the clock alone, play a friend, or beat the bot.
- **Christian Says** (crewarcade): a memory game. Watch the crew light up, then repeat the pattern. Hard mode shuffles the faces every round.
- **Dodge a Joe** (crewarcade): Charlie runs while Joes fall. Grab Amaans for bonus points. One life on Hard.
- **Amaan Clicker**: an idle clicker with upgrades, buildings, rebirths, prestige, pets, chat and a global leaderboard.
- **Paccy Matt**: Pac-Man style. Charlie eats every pellet while four ghosts chase him. Amaan's pellets turn the ghosts blue for a short time.
- **Snariyan**: a snake game. Ariyan eats Amaan to grow, and must not hit the walls or its own tail. Can race a friend online.
- **Like a Christian**: a rhythm game. Slide Christian under the falling bars in time with the song. Uses one finger.
- **Stack a Josh**: stack sliding Joshes into a tower. Perfect drops build taller. Online for 2 to 4 players.
- **Angry Haider**: a slingshot physics game. Fling Haider and Zainab at the forts of Zach and Austin through glass and wood. Has a campaign.
- **Kick the Austin**: a sandbox physics toy. Austin is a squishy rubber toy to fling, tickle and bounce around. Made for young children.
- **Connect Samuel**: Connect 4 with Samuel discs. Play the AI on Easy, Medium or Hard, or online one versus one.
- **Wack a Joe**: whack-a-mole with Joes, from nine holes, before the clock runs out.
- **Ariyan Runner**: an endless runner. Switch lanes, dodge Joes and red blocks, grab Amaans.
- **Kings Shootout**: a penalty shootout. Two random crew teams, five kicks each. Drag back from the ball to aim and let go.
- **Geo-Metry Dash**: a rhythm platformer with six original levels. The cube, ship, wave, ball and UFO modes switch with portals mid-level. Has a level editor where you can make your own levels and publish them to a community list. Dhyiaan and Bartu appear as skins too.
- **Kingsnite**: a 3D battle royale on one island. Ten players (you and nine bots). Loot weapons (pistol, rifle, shotgun), heal with bandages and medkits, and outlast the shrinking storm. Pick a skin in the lobby. Use the on-screen controls on a phone.
- **Snookamaan**: snooker with the crew. Amaan is the white ball, Haider the black, and Ariyan, Dhyiaan and Ben are the reds and colours. Play solo, or start a party with a 4-letter code and play a friend online, taking turns. The Help button shows which ball is which person and how many points each is worth.

## How games are kept

Each game is a folder under the games folder. Most games are a single file, index.html. The hub home page lists the games in index.html as cards. The offline cache (sw.js) keeps a list of files to store on the phone. A new version of the hub gets a new cache name so phones pick up the changes.

## Common questions

- Scores: a game's leaderboard is kept in the shared Supabase database. Your own best scores may also be saved on your device.
- Installing: on a phone, use the browser's "Add to Home Screen" option. The hub then opens like an app.
- Offline: the hub home page and most games work offline after the first visit. Online features (leaderboards, party play, community levels) need a connection.
