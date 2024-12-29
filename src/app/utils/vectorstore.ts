import { Document } from "langchain/document";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

const INDEX_NAME = "gitpre";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const getEmbeddings = async () => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error("HUGGINGFACE_API_KEY is not set");
  }
  return new HuggingFaceInferenceEmbeddings({
    apiKey,
    model: "sentence-transformers/all-mpnet-base-v2",
  });
};

export async function createVectorStore(
  files: { name: string; content: string }[],
  namespace: string
) {
  try {
    const index = pinecone.Index(INDEX_NAME);
    const documents = files.map(
      (file) =>
        new Document({
          pageContent: `${file.name}\n${file.content}`,
          metadata: { source: file.name },
        })
    );

    const embeddings = await getEmbeddings();
    const vectorStore = await PineconeStore.fromDocuments(
      documents,
      embeddings,
      {
        pineconeIndex: index,
        namespace,
      }
    );

    return vectorStore;
  } catch (error) {
    console.error("Error creating vector store:", error);
    throw error;
  }
}

export async function queryVectorStore(query: string, namespace: string) {
  try {
    const index = pinecone.Index(INDEX_NAME);
    const embeddings = await getEmbeddings();
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace,
    });

    // Ensure we get exactly 5 results
    const results = await vectorStore.similaritySearch(query, 5);
    return results;
  } catch (error) {
    console.error("Error querying vector store:", error);
    throw error;
  }
}

export async function getAvailableNamespaces(): Promise<string[]> {
  try {
    const index = pinecone.Index(INDEX_NAME);
    const stats = await index.describeIndexStats();
    return Object.keys(stats.namespaces || {});
  } catch (error) {
    console.error("Error fetching namespaces:", error);
    throw error;
  }
}
