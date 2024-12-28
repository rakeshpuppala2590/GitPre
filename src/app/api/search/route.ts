import { NextResponse } from "next/server";
import { queryVectorStore } from "../../utils/vectorstore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter required" },
      { status: 400 }
    );
  }

  try {
    const results = await queryVectorStore(query);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
