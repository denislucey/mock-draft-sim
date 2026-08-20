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

  const [draftGrid, setDraftGrid] = useState(
    Array.from({ length: NUM_ROUNDS }, () => Array(NUM_TEAMS).fill(null)),
  );

  function calcDraftPick(pick: number, round: number) {
    if (round < 2)
      if (round % 2 == 0) return pick + 1;
      else return 32 - pick;
    else if (round % 2 == 0) return (round + 1) * 16 - pick;
    else return pick + 1 + 16 * round;
  }

  return (
    <>
      <h1>Mock Draft Sim</h1>
      <h2>
        On the clock: Round {currentRound}, Pick {currentPick}
      </h2>
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
                    <span>TAKEN</span>
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
            {availablePlayers.map((player, index) => (
                <tr>
                    <td>Yes</td>
                    <td>{index+1}</td>
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
