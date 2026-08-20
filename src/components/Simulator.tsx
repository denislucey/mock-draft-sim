import { useState } from "react";

const NUM_TEAMS = 16;
const NUM_ROUNDS = 15;

const availablePlayers = [
  { id: 1, name: "Denis Lucey", position: "QB", team: "NEP", adp: "1.1" },
  { id: 2, name: "Askhath Burra", position: "RB", team: "LAL", adp: "2.6" },
  { id: 3, name: "CMC", position: "RB", team: "SFG", adp: "3.8" },
];

function Simulator() {
  const [currentPick, setCurrentPick] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);

  const [draftStarted, setDraftStarted] = useState(false);
  const [playerBoard, setPlayerBoard] = useState(availablePlayers)

  const [draftGrid, setDraftGrid] = useState(
    Array.from({ length: NUM_ROUNDS }, () => Array(NUM_TEAMS).fill(null)),
  );

  const [playersTeam, setPlayersTeam] = useState(1);

  function calcDraftPick(pick: number, round: number) {
    if (round < 2)
      if (round % 2 == 0) return pick + 1;
      else return 32 - pick;
    else if (round % 2 == 0) return (round + 1) * 16 - pick;
    else return pick + 1 + 16 * round;
  }

  // fix this nonsense
  function turnPickIntoRound(pick: number) {
    return Math.floor(pick / NUM_TEAMS);
  }

  function turnPickIntoTeam(pick: number) {
    if (currentRound < 3)
      if (currentRound % 2 == 1) return pick;
      else return 33 - pick;
    else if (currentRound % 2 == 0) return pick % 16;
    else return currentRound * 16 + 1 - pick;
  }

  function isPlayersPick(playersTeam: number) {
    return !(playersTeam == turnPickIntoTeam(currentPick) && draftStarted);
  }

  function draftPlayer(player: Map) {
    console.log(player.name);

    // update grid
    const newGrid = [...draftGrid];
    newGrid[turnPickIntoRound(currentPick)][turnPickIntoTeam(currentPick) - 1] =
      player;
    setDraftGrid(newGrid);

    // remove player from selection
    setPlayerBoard(playerBoard.filter(p=>p.id !== player.id))

    // increment pick and round
    setCurrentPick(currentPick + 1);
    if (currentPick % 16 == 0) setCurrentRound(currentRound + 1);
  }

  function startDraft() {
    console.log("draft started");
    setDraftStarted(true);
  }

  function resetDraft() {
    console.log("draft reset");
    setCurrentPick(1);
    setCurrentRound(1);
    setDraftStarted(false);
    setDraftGrid(
      Array.from({ length: NUM_ROUNDS }, () => Array(NUM_TEAMS).fill(null)),
    );
    setPlayerBoard(availablePlayers);
  }

  function changeTeam() {
    console.log("changingTeam");
    const input = window.prompt("Please enter your pick 1-16:", "Default text");
    setPlayersTeam(Number(input));
  }

  return (
    <>
      <h1>Mock Draft Sim</h1>
      <h2>
        On the clock: Round {currentRound}, Pick {currentPick}
      </h2>
      <h2>You are team {playersTeam}</h2>
      <div>
        <button onClick={() => startDraft()}>Start Draft</button>
        <button onClick={() => resetDraft()}>Reset Draft</button>
        <button onClick={() => changeTeam()}>Change Team</button>
      </div>
      <table>
        <thead>
          {Array.from({ length: NUM_TEAMS }).map((_, i) => (
            <th key={i}>Team {i + 1}</th>
          ))}
        </thead>
        <tbody>
          {draftGrid.map((roundRow, roundIdx) => (
            <tr>
              {roundRow.map((pick, teamId) => (
                <td>
                  {pick ? (
                    <div>
                      <span>{pick.name}</span>
                      <span>{pick.position}</span>
                    </div>
                  ) : (
                    <span>Pick:{calcDraftPick(teamId, roundIdx)}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <h3>Available players</h3>
        <table>
          <thead>
            <tr>
              <th>Draft?</th>
              <th>Rank</th>
              <th>Name</th>
              <th>ADP</th>
              <th>Position</th>
              <th>Team</th>
            </tr>
          </thead>
          <tbody>
            {playerBoard.map((player, index) => (
              <tr>
                <button
                  onClick={() => draftPlayer(player)}
                  disabled={isPlayersPick(playersTeam)}
                >
                  Draft Player
                </button>
                <td>{index + 1}</td>
                <td>{player.name}</td>
                <td>{player.adp}</td>
                <td>{player.position}</td>
                <td>{player.team}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Simulator;
