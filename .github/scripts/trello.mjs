import core from "@actions/core";
import fetch from "node-fetch";
import { context } from "@actions/github";

const trelloApiKey = process.env.TRELLO_API_KEY;
const trelloToken = process.env.TRELLO_AUTH_TOKEN;
const trelloBoardId = process.env.TRELLO_BOARD_ID;

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
    core.setFailed(
      `Errore nell'aggiungere l'attachment: ${response.statusText}`
    );
    process.exit(1);
  }

  console.log("Attachment GitHub aggiunto con successo alla card Trello");
}

async function checkAndLinkTrelloCard() {
  if (!isValidTrelloBoardId(trelloBoardId)) {
    core.setFailed(
      `Errore: L'ID della board Trello non sembra essere valido: ${trelloBoardId}`
    );
    process.exit(1);
  }

  const prCode = extractCodeFromPRTitle(prTitle);
  if (!prCode) {
    core.setFailed(
      `Errore: Il titolo della PR non inizia con un codice valido nel formato [#codice]`
    );
    process.exit(1);
  }

  try {
    const url = `https://api.trello.com/1/boards/${trelloBoardId}/cards?key=${trelloApiKey}&token=${trelloToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      core.setFailed(`HTTP error! status: ${response.status}`);
      process.exit(1);
    }

    const cards = await response.json();
    const matchingCard = cards.find((card) =>
      parseInt(prCode) === parseInt(card.idShort) &&
      card.name.startsWith(`#${prCode}`)
        ? card
        : null
    );

    if (!matchingCard) {
      core.setFailed(
        `Errore: Nessuna carta Trello trovata che inizia con il codice "${prCode}" nella board specificata.`
      );
      process.exit(1);
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
    process.exit(1);
  }
}

await checkAndLinkTrelloCard();
process.exit(0); // Indica successo
