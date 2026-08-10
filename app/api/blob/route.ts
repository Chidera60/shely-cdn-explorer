import { NextRequest, NextResponse } from "next/server";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { Network, AccountAddress } from "@aptos-labs/ts-sdk";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const account = searchParams.get("account");
  const blobName = searchParams.get("blobName");

  if (!account || !blobName) {
    return NextResponse.json(
      { error: "Missing required parameters: account and blobName" },
      { status: 400 },
    );
  }

  try {
    const apiKey =
      process.env.SHELBY_SECRET_API_KEY ||
      process.env.NEXT_PUBLIC_SHELBY_API_KEY ||
      "anonymous";
    const client = new ShelbyNodeClient({
      network: Network.MAINNET,
      apiKey,
    });

    const accountAddress = AccountAddress.from(account);
    const blobResponse = await client.download({
      account: accountAddress,
      blobName,
    });

    const headers = new Headers();
    if (blobResponse.contentLength) {
      headers.set("Content-Length", blobResponse.contentLength.toString());
    }

    // MIME type detection based on extension
    const cleanBlob = blobName.toLowerCase();
    if (cleanBlob.endsWith(".jpg") || cleanBlob.endsWith(".jpeg")) {
      headers.set("Content-Type", "image/jpeg");
    } else if (cleanBlob.endsWith(".png")) {
      headers.set("Content-Type", "image/png");
    } else if (cleanBlob.endsWith(".webp")) {
      headers.set("Content-Type", "image/webp");
    } else if (cleanBlob.endsWith(".gif")) {
      headers.set("Content-Type", "image/gif");
    } else if (cleanBlob.endsWith(".svg")) {
      headers.set("Content-Type", "image/svg+xml");
    } else if (cleanBlob.endsWith(".mp4")) {
      headers.set("Content-Type", "video/mp4");
    } else if (cleanBlob.endsWith(".webm")) {
      headers.set("Content-Type", "video/webm");
    } else if (cleanBlob.endsWith(".pdf")) {
      headers.set("Content-Type", "application/pdf");
    } else {
      headers.set("Content-Type", "application/octet-stream");
    }

    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(blobResponse.readable as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("API blob streaming error:", error);
    return NextResponse.json(
      {
        error: "Blob not found or pending mainnet indexing",
        message: error.message || "Blob does not exist for specified account",
      },
      { status: 404 },
    );
  }
}
