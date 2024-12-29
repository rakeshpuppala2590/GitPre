import { NextResponse } from "next/server";
import { queryVectorStore } from "@/app/utils/vectorstore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const namespace = searchParams.get("namespace");

    if (!query || !namespace) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const results = await queryVectorStore(query, namespace);
    console.log("Search results from Pinecone:", results);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
