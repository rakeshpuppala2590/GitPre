import { Document } from "langchain/document";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { RedisVectorStore } from "@langchain/community/vectorstores/redis";
import { createClient } from "redis";

const REDIS_URL = "redis://localhost:6379";
const INDEX_NAME = "code_repository";

const createRedisClient = async () => {
  const client = createClient({ url: REDIS_URL });
  await client.connect();
  return client;
};

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
  files: { name: string; content: string }[]
) {
  try {
    const client = await createRedisClient();
    const documents = files.map(
      (file) =>
        new Document({
          pageContent: `${file.name}\n${file.content}`,
          metadata: { source: file.name },
        })
    );

    const embeddings = await getEmbeddings();
    const vectorStore = await RedisVectorStore.fromDocuments(
      documents,
      embeddings,
      {
        redisClient: client,
        indexName: INDEX_NAME,
      }
    );

    return vectorStore;
  } catch (error) {
    console.error("Error creating vector store:", error);
    throw error;
  }
}

export async function queryVectorStore(query: string) {
  try {
    const client = await createRedisClient();
    const embeddings = await getEmbeddings();
    const vectorStore = new RedisVectorStore(embeddings, {
      redisClient: client,
      indexName: INDEX_NAME,
    });

    return await vectorStore.similaritySearch(query, 5);
  } catch (error) {
    console.error("Error querying vector store:", error);
    throw error;
  }
}
