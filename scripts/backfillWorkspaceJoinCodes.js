#!/usr/bin/env node

require("dotenv").config();

const prisma = require("../src/prisma/client");

const CODE_PREFIX = "TF-";
const CODE_LENGTH = 5;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateWorkspaceJoinCode() {
  let suffix = "";
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    const charIndex = Math.floor(Math.random() * CODE_ALPHABET.length);
    suffix += CODE_ALPHABET[charIndex];
  }
  return `${CODE_PREFIX}${suffix}`;
}

async function generateUniqueJoinCode(reservedCodes) {
  while (true) {
    const candidate = generateWorkspaceJoinCode();
    if (reservedCodes.has(candidate)) {
      continue;
    }

    const existingWorkspace = await prisma.workspace.findUnique({
      where: { joinCode: candidate },
      select: { id: true },
    });

    if (!existingWorkspace) {
      reservedCodes.add(candidate);
      return candidate;
    }
  }
}

async function backfillWorkspaceJoinCodes() {
  const workspacesNeedingCodes = await prisma.workspace.findMany({
    where: {
      OR: [{ joinCode: null }, { joinCode: "" }],
    },
    select: {
      id: true,
      name: true,
      joinCode: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (workspacesNeedingCodes.length === 0) {
    console.log("No workspace join codes need backfill.");
    return;
  }

  const reservedCodes = new Set();

  for (const workspace of workspacesNeedingCodes) {
    if (workspace.joinCode && workspace.joinCode.trim().length > 0) {
      continue;
    }

    const joinCode = await generateUniqueJoinCode(reservedCodes);
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { joinCode },
      select: { id: true },
    });

    const workspaceName = workspace.name || "(unnamed workspace)";
    console.log(`Backfilled workspace ${workspace.id} (${workspaceName}) -> ${joinCode}`);
  }
}

backfillWorkspaceJoinCodes()
  .catch((error) => {
    console.error("Failed to backfill workspace join codes.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
