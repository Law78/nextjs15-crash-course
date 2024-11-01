import core from "@actions/core";
import fetch from "node-fetch";
import { context } from "@actions/github";

const trelloApiKey = process.env.TRELLO_API_KEY;
const trelloToken = process.env.TRELLO_AUTH_TOKEN;
const trelloBoardId = process.env.TRELLO_BOARD_ID;

console.log("Trello API Key: ", trelloApiKey);
console.log("Trello Token: ", trelloToken);
console.log("Trello Board ID: ", trelloBoardId);

const prTitle = context.payload.pull_request.title; // Ora dovrebbe funzionare
if (!prTitle) {
  core.setFailed("Il titolo della PR deve essere fornito come input.");
  process.exit(1);
}
const prUrl = context.payload.pull_request?.html_url || "N/A"; // Puoi impostare un valore di default se non disponibile
const repoName = context.repo.owner + "/" + context.repo.repo;

function isValidTrelloBoardId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id) || /^[a-zA-Z0-9]{8}$/.test(id);
}

function extractCodeFromPRTitle(title) {
  const match = title.match(/^\[#([\w-]+)\]/);
  return match ? match[1] : null;
}

async function addGitHubAttachmentToCard(cardId) {
  const attachUrl = `https://api.trello.com/1/cards/${cardId}/attachments`;
  const attachData = new URLSearchParams({
    key: trelloApiKey,
    token: trelloToken,
    url: prUrl,
    name: `PR: ${prTitle}`,
  });

  const response = await fetch(attachUrl, {
    method: "POST",
    body: attachData,
  });

  if (!response.ok) {
    throw new Error(
      `Errore nell'aggiungere l'attachment: ${response.statusText}`
    );
  }

  console.log("Attachment GitHub aggiunto con successo alla card Trello");
}

async function checkAndLinkTrelloCard() {
  if (!isValidTrelloBoardId(trelloBoardId)) {
    core.setFailed(
      `Errore: L'ID della board Trello non sembra essere valido: ${trelloBoardId}`
    );
    return;
  }

  const prCode = extractCodeFromPRTitle(prTitle);
  if (!prCode) {
    core.setFailed(
      `Errore: Il titolo della PR non inizia con un codice valido nel formato [#codice]`
    );
    return;
  }

  try {
    const url = `https://api.trello.com/1/boards/${trelloBoardId}/cards?key=${trelloApiKey}&token=${trelloToken}`;
    console.log(url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const cards = await response.json();
    console.log(`Looking for: #${prCode}`);
    const matchingCard = cards.find((card) => {
      console.log(
        `${prCode} - ${card.idShort} - ${card.name} - ${
          parseInt(prCode) === parseInt(card.idShort)
        } - ${card.name.startsWith(`#${prCode}`)}`
      );
      return parseInt(prCode) === parseInt(card.idShort) &&
        card.name.startsWith(`#${prCode}`)
        ? card
        : null;
    });

    if (!matchingCard) {
      core.setFailed(
        `Errore: Nessuna carta Trello trovata che inizia con il codice "${prCode}" nella board specificata.`
      );
    } else {
      console.log(
        `Carta Trello trovata che inizia con il codice "${prCode}": "${matchingCard.name}"`
      );
      await addGitHubAttachmentToCard(matchingCard.id);
    }
  } catch (error) {
    core.setFailed(
      `Errore durante la verifica o il collegamento della carta Trello: ${error.message}`
    );
  }
}

checkAndLinkTrelloCard();
