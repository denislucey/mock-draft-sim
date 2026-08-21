import { useEffect, useState } from "react";
import Papa from "papaparse";

const NUM_TEAMS = 16;
const NUM_ROUNDS = 15;

import csv from "../assets/2026_adp.csv?raw";

function Simulator() {
  const [currentPick, setCurrentPick] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);

  const [draftStarted, setDraftStarted] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [playerBoard, setPlayerBoard] = useState(availablePlayers);

  useEffect(() => {
    Papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        console.log(results);
        const sortedData = results.data.sort(
          (a, b) => parseFloat(a.ADP) - parseFloat(b.ADP),
        );
        setAvailablePlayers(sortedData);
      },
    });
  }, []);

  const [draftGrid, setDraftGrid] = useState(
    Array.from({ length: NUM_ROUNDS }, () => Array(NUM_TEAMS).fill(null)),
  );

  const [playersTeam, setPlayersTeam] = useState(1);
  const [isPlayersTurn, setIsPlayersTurn] = useState(false);

  function calcDraftPick(pick: number, round: number) {
    if (round < 2)
      if (round % 2 == 0) return pick + 1;
      else return 32 - pick;
    else if (round % 2 == 0) return (round + 1) * 16 - pick;
    else return pick + 1 + 16 * round;
  }

  // fix this nonsense
  function turnPickIntoRound(pick: number) {
    return Math.floor((pick - 1) / NUM_TEAMS);
  }

  function turnPickIntoTeam(pick: number) {
    if (currentRound < 3)
      if (currentRound % 2 == 1) return pick;
      else return 33 - pick;
    else if (currentRound % 2 == 0) return ((pick-1) % 16)+1;
    else return currentRound * 16 + 1 - pick;
  }

  function draftPlayer(player: Map) {
    console.log(player.name);

    // update grid
    const newGrid = [...draftGrid];
    newGrid[turnPickIntoRound(currentPick)][turnPickIntoTeam(currentPick) - 1] =
      player;
    setDraftGrid(newGrid);

    // remove player from selection
    setPlayerBoard(playerBoard.filter((p) => p.id !== player.id));

    // increment pick and round
    setCurrentPick(currentPick + 1);
    if (currentPick % 16 == 0) setCurrentRound(currentRound + 1);
    setIsPlayersTurn(turnPickIntoTeam(currentPick + 1) == playersTeam);
  }

  function startDraft() {
    console.log(playerBoard);
    setDraftStarted(true);
    if (playersTeam == 1) setIsPlayersTurn(true);
    else setIsPlayersTurn(false);
    setPlayerBoard(availablePlayers);
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
    if (playersTeam == 1) setIsPlayersTurn(true);
    else setIsPlayersTurn(false);
  }

  useEffect(() => {
    console.log(isPlayersTurn);
    if (!draftStarted) return;
    if (isPlayersTurn) return;

    const timer = setTimeout(() => {
      draftPlayer(playerBoard[0]);
    }, 500);

    return () => clearTimeout(timer);
  });

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
            <tr key={roundIdx}>
              {roundRow.map((pick, teamId) => (
                <td key={teamId}>
                  {pick ? (
                    <div>
                      <span>{pick.Name}</span>
                      <span>{pick.Position}</span>
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
              <tr key={player.id}>
                <td>
                  <button
                    onClick={() => draftPlayer(player)}
                    disabled={!isPlayersTurn}
                  >
                    Draft Player
                  </button>
                </td>
                <td>{index + 1}</td>
                <td>{player.Name}</td>
                <td>{player.ADP}</td>
                <td>{player.Position}</td>
                <td>{player.Team}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Simulator;
