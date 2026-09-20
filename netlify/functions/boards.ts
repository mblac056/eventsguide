import type { Config } from '@netlify/functions';
import { GoogleAuth } from 'google-auth-library';
import { handleBoardsRequest } from '../../src/lib/boardsApi';
import { createGoogleClient } from '../../src/lib/googleClient';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

let auth: GoogleAuth | null = null;

function googleAuth(): GoogleAuth {
  auth ??= new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });
  return auth;
}

async function accessToken(): Promise<string> {
  const client = await googleAuth().getClient();
  const { token } = await client.getAccessToken();
  if (!token) {
    throw new Error("Couldn't load the schedule.");
  }
  return token;
}

export default async (req: Request): Promise<Response> => {
  return handleBoardsRequest(req, {
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID ?? '',
    google: createGoogleClient(accessToken),
  });
};

export const config: Config = {
  path: ['/api/boards', '/api/boards/:slug'],
};
