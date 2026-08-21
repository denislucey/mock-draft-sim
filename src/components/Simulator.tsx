import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import PickMatrix from "./PickMatrix";
import "./Simulator.css";

const NUM_TEAMS = 16;
const NUM_ROUNDS = 15;
const SHEET_URL = "https://sheetdb.io/api/v1/oh7dymh21dcag";
const flexPositions = ["RB", "WR", "TE"];

import csv from "../assets/2026_adp.csv?raw";

interface playerRow {
  id: number;
  Name: string;
  Position: "RB" | "TE" | "WR" | "QB" | "K" | "DEF";
  Team: string;
  ADP: string;
}

interface apiPayload {
  Time: string;
  Pick: number;
  Team: number;
  Round: number;
  Player: string;
}

function Simulator() {
  const [currentPick, setCurrentPick] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);

  const [draftStarted, setDraftStarted] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<playerRow[]>([]);
  const [playerBoard, setPlayerBoard] = useState(availablePlayers);

  useEffect(() => {
    Papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      complete: (results: any) => {
        const sortedData = results.data.sort(
          (a: playerRow, b: playerRow) => parseFloat(a.ADP) - parseFloat(b.ADP),
        );
        setAvailablePlayers(sortedData);
        setPlayerBoard(sortedData);
      },
    });
  }, []);

  const [draftGrid, setDraftGrid] = useState(
    Array.from({ length: NUM_ROUNDS }, () => Array(NUM_TEAMS).fill(null)),
  );

  const [playersTeam, setPlayersTeam] = useState(1);
  const [isPlayersTurn, setIsPlayersTurn] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("ALL");

  function calcDraftPick(pick: number, round: number) {
    if (round < 2)
      if (round % 2 == 0) return pick + 1;
      else return 32 - pick;
    else if (round % 2 == 0) return (round + 1) * 16 - pick;
    else return pick + 1 + 16 * round;
  }

  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  // fix this nonsense
  function turnPickIntoRound(pick: number) {
    return Math.floor((pick - 1) / NUM_TEAMS);
  }

  function turnPickIntoTeam(pick: number, round: number) {
    if (round < 3)
      if (round % 2 == 1) return pick;
      else return 33 - pick;
    else if (round % 2 == 0) return ((pick - 1) % 16) + 1;
    else return round * 16 + 1 - pick;
  }

  function draftHumanPlayer(player: playerRow) {
    // logLog(player);
    draftPlayer(player);
  }

  const logLog = async (player: playerRow): Promise<void> => {
    // log

    const new_data: apiPayload = {
      Time: new Date().toISOString(),
      Pick: currentPick,
      Round: currentRound,
      Team: playersTeam,
      Player: player.Name,
    };
    try {
      const response = await fetch(SHEET_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [new_data],
        }),
      });
      if (!response.ok) {
        console.log("got invalid response");
      }
    } catch (error) {
      console.log("got error");
    }
  };

  function draftPlayer(player: playerRow) {
    console.log(player.Name);

    // update grid
    const newGrid = [...draftGrid];
    newGrid[turnPickIntoRound(currentPick)][
      turnPickIntoTeam(currentPick, currentRound) - 1
    ] = player;
    setDraftGrid(newGrid);

    // remove player from selection
    setPlayerBoard(playerBoard.filter((p) => p.id !== player.id));

    // increment pick and round
    setCurrentPick(currentPick + 1);
    if (currentPick % 16 == 0) setCurrentRound(currentRound + 1);
    setIsPlayersTurn(PickMatrix[playersTeam].includes(currentPick + 1));
  }

  function startDraft() {
    setDraftStarted(true);
    if (playersTeam == 1) setIsPlayersTurn(true);
    else setIsPlayersTurn(false);
    // setPlayerBoard(availablePlayers);
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
    const input = window.prompt(
      "Please enter your pick 1-16, 0 autosims the whole draft",
    );
    setPlayersTeam(Number(input));
    if (playersTeam == 1) setIsPlayersTurn(true);
    else setIsPlayersTurn(false);
  }

  function assignPlayer(player: playerRow) {
    const input = window.prompt("Please assign pick 1-240");
    const newGrid = [...draftGrid];
    newGrid[turnPickIntoRound(Number(input))][
      turnPickIntoTeam(Number(input), turnPickIntoRound(Number(input)) + 1) - 1
    ] = player;
    setDraftGrid(newGrid);

    // remove player from selection
    setPlayerBoard(playerBoard.filter((p) => p.id !== player.id));
  }

  const filteredPlayerBoard = useMemo(() => {
    if (selectedPosition == "ALL") return playerBoard;
    if (selectedPosition == "FLEX")
      return playerBoard.filter((p) => flexPositions.includes(p.Position));
    return playerBoard.filter((p) => p.Position == selectedPosition);
  }, [playerBoard, selectedPosition]);

  //MOST IMPORTANT

  // THINGS I want to address
  /*
  defense and kicker are still taken too often, barely any taken before round 11
  */

  useEffect(() => {
    console.log(isPlayersTurn);
    if (!draftStarted) return;
    if (currentPick == 241) return;
    if (
      draftGrid[turnPickIntoRound(currentPick)][
        turnPickIntoTeam(currentPick, currentRound) - 1
      ]
    ) {
      setCurrentPick(currentPick + 1);
      if (currentPick % 16 == 0) setCurrentRound(currentRound + 1);
      setIsPlayersTurn(PickMatrix[playersTeam].includes(currentPick + 1));
      return;
    }
    if (isPlayersTurn) return;

    const timer = setTimeout(() => {
      //figure out what the draft logic is going to be
      // my thought is to hardcode some rules about looking at what positions are needed

      // step one: look at already drafted players, compile positions
      const playersPicks =
        PickMatrix[turnPickIntoTeam(currentPick, currentRound)];

      let playerDict = {
        RB: 0,
        WR: 0,
        TE: 0,
        QB: 0,
        K: 0,
        DEF: 0,
      };
      for (const pick of playersPicks) {
        const selection: playerRow =
          draftGrid[turnPickIntoRound(pick)][
            turnPickIntoTeam(currentPick, currentRound) - 1
          ];
        if (selection)
          playerDict[selection.Position as keyof typeof playerDict] += 1;
        else continue;
      }
      console.log(playerDict);

      // step 2: eliminate positions based off of hardcoded rules

      let positionsToDraft = ["RB", "WR"];

      // need to think more ab these
      if (playerDict["QB"] < 1) positionsToDraft.push("QB");
      else if (playerDict["QB"] < 2 && currentRound > 9)
        positionsToDraft.push("QB");
      if (playerDict["TE"] < 1) positionsToDraft.push("TE");
      else if (playerDict["TE"] < 2 && currentRound > 9)
        positionsToDraft.push("TE");

      if (playerDict["K"] < 1)
        if (currentRound == 10 && getRandomInt(currentRound) == 0)
          positionsToDraft.push("K");
        else if (currentRound == 11 && getRandomInt(currentRound) <= 2)
          positionsToDraft.push("K");
        else if (currentRound == 12 && getRandomInt(currentRound) <= 4)
          positionsToDraft.push("K");
        else if (currentRound >= 13) positionsToDraft.push("K");
      if (playerDict["DEF"] < 1)
        if (currentRound == 10 && getRandomInt(currentRound) == 0)
          positionsToDraft.push("DEF");
        else if (currentRound == 11 && getRandomInt(currentRound) <= 2)
          positionsToDraft.push("DEF");
        else if (currentRound == 12 && getRandomInt(currentRound) <= 4)
          positionsToDraft.push("DEF");
        else if (currentRound >= 13) positionsToDraft.push("DEF");

      //force rb/wr selections if team is too unbalanced
      if (currentRound >= 3 && playerDict["RB"] == 0) positionsToDraft = ["RB"];
      if (currentRound >= 4 && playerDict["WR"] == 0) positionsToDraft = ["WR"];

      if (currentRound >= 6 && playerDict["RB"] < 2) positionsToDraft = ["RB"];
      if (currentRound >= 7 && playerDict["WR"] < 2) positionsToDraft = ["WR"];

      if (currentRound == 14 && playerDict["DEF"] + playerDict["K"] == 0)
        if (getRandomInt(2) == 0) positionsToDraft = ["K"];
        else positionsToDraft = ["DEF"];

      if (currentRound == 15 && playerDict["DEF"] == 0)
        positionsToDraft = ["DEF"];
      if (currentRound == 15 && playerDict["K"] == 0) positionsToDraft = ["K"];

      // filter to positions we're taking
      const filteredPlayerBoard = playerBoard.filter((p) =>
        positionsToDraft.includes(p.Position),
      );

      // randomly pick a player, as draft goes on, get more random
      draftPlayer(
        filteredPlayerBoard[
          getRandomInt(
            Math.ceil((positionsToDraft.length * (currentRound + 1)) / 10) + 1,
          )
        ],
      );
    }, 50);

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
                <td key={teamId} className={pick ? pick.Position : "draftSpot"}>
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
        <p>Position filter</p>
        <select
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
        >
          <option value="ALL">ALL</option>
          <option value="QB">QB</option>
          <option value="WR">WR</option>
          <option value="RB">RB</option>
          <option value="TE">TE</option>
          <option value="K">K</option>
          <option value="DEF">DEF</option>
          <option value="FLEX">FLEX</option>
        </select>
        <table>
          <thead>
            <tr>
              <th>Draft?</th>
              <th>Rank</th>
              <th>Name</th>
              <th>ADP</th>
              <th>Position</th>
              <th>Team</th>
              <th>Assign Spot</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayerBoard.map((player, index) => (
              <tr key={player.id} className={player.Position}>
                <td>
                  <button
                    onClick={() => draftHumanPlayer(player)}
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
                <td>
                  <button onClick={() => assignPlayer(player)}>
                    Assign Player
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Simulator;
