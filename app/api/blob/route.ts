import { NextRequest, NextResponse } from "next/server";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { Network, AccountAddress } from "@aptos-labs/ts-sdk";
import { getStoredBlobData } from "@/lib/shelby/storage";

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

  // 1. Check local edge cache first
  const cached = getStoredBlobData(blobName);
  if (cached) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      status: 200,
      headers: {
        "Content-Type": cached.mimeType,
        "Content-Length": cached.buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "X-Shelby-Cache": "HIT",
      },
    });
  }

  // 2. Validate Aptos account address format
  let accountAddress: AccountAddress;
  try {
    accountAddress = AccountAddress.from(account);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid Aptos account address format: '${account}'` },
      { status: 400 },
    );
  }

  try {
    const apiKey =
      process.env.SHELBY_SECRET_API_KEY ||
      process.env.NEXT_PUBLIC_SHELBY_API_KEY ||
      "anonymous";

    const targetNetwork =
      process.env.NEXT_PUBLIC_SHELBY_NETWORK === "testnet"
        ? Network.TESTNET
        : (((Network as any).SHELBYNET || Network.TESTNET) as any);

    const client = new ShelbyNodeClient({
      network: targetNetwork,
      apiKey,
    });

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
    headers.set("X-Shelby-Cache", "MISS");

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
