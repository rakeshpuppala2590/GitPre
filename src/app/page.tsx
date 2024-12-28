"use client";

import { useState } from "react";

interface FileContent {
  name: string;
  content: string;
}

interface SearchResult {
  pageContent: string;
  metadata: {
    source: string;
  };
}

export default function Home() {
  const [files, setFiles] = useState<FileContent[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function getGitHubContent(repoUrl: string) {
    try {
      const response = await fetch(
        `/api/github_content?repoUrl=${encodeURIComponent(repoUrl)}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setFiles(data);
      return data;
    } catch (error) {
      console.error("Error fetching GitHub content:", error);
      return null;
    }
  }

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Search failed");
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    }
  };
  const handleInsert = async () => {
    setIsLoading(true);
    try {
      await getGitHubContent(repoUrl);
      alert("Repository content inserted into FAISS successfully!");
    } catch (error) {
      console.error("Insert error:", error);
      alert("Failed to insert repository content");
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Repository Input Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">GitHub Repository</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter GitHub repository URL"
          />
          <button
            onClick={handleInsert}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Processing..." : "Insert into FAISS"}
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Search Repository</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your search query"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Search FAISS
          </button>
        </div>
      </div>

      {/* Search Results Section */}
      {searchResults.length > 0 && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Search Results</h2>
          <div className="space-y-4">
            {searchResults.map((result, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h3 className="font-bold text-lg text-blue-600">
                  {result.metadata.source}
                </h3>
                <pre className="mt-2 p-4 bg-gray-50 rounded-lg overflow-x-auto">
                  <code>{result.pageContent}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repository Files Section */}
      {files.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Repository Files</h2>
          <div className="space-y-4">
            {files.map((file, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h3 className="font-bold text-lg text-blue-600">{file.name}</h3>
                <pre className="mt-2 p-4 bg-gray-50 rounded-lg overflow-x-auto">
                  <code>{file.content}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
