import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";

export async function GET() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const index = pinecone.Index(
      "gitpre",
      process.env.PINECONE_INDEX_HOST!.replace("https://", "")
    );

    const stats = await index.describeIndexStats();
    return NextResponse.json({
      namespaces: Object.keys(stats.namespaces || {}),
    });
  } catch (error) {
    console.error("Error in /api/namespaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch namespaces" },
      { status: 500 }
    );
  }
}
