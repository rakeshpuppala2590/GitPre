"use client";

import { useState, useEffect } from "react";

interface FileContent {
  name: string;
  content: string;
}

interface SearchResult {
  pageContent: string;
  metadata: {
    source: string;
  };
  score?: number;
}

export default function Home() {
  const [files, setFiles] = useState<FileContent[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [repoUrl, setRepoUrl] = useState("");
  const [availableNamespaces, setAvailableNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState("");
  const [isInserting, setIsInserting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchNamespaces = async () => {
      try {
        const response = await fetch("/api/namespaces", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data.namespaces)) {
          setAvailableNamespaces(data.namespaces);
        }
      } catch (error) {
        console.error("Error fetching namespaces:", error);
        setAvailableNamespaces([]);
      }
    };

    fetchNamespaces();
  }, []);

  const handleInsert = async () => {
    if (!repoUrl) return;
    setIsInserting(true);
    try {
      const response = await fetch(
        `/api/github_content?repoUrl=${encodeURIComponent(repoUrl)}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setFiles(data.files);
      const newNamespace = data.namespace;
      setAvailableNamespaces((prev) =>
        Array.from(new Set([...prev, newNamespace]))
      );
      setSelectedNamespace(newNamespace);
      setRepoUrl("");
      alert("Repository content inserted into Pinecone successfully!");
    } catch (error) {
      console.error("Insert error:", error);
      alert("Failed to insert repository content");
    } finally {
      setIsInserting(false);
    }
  };

  const handleSearch = async () => {
    if (!query || !selectedNamespace) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(
          query
        )}&namespace=${encodeURIComponent(selectedNamespace)}`
      );
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      console.log("Raw search response:", data);

      // Check if data is in expected format
      if (!Array.isArray(data)) {
        console.error("Unexpected response format:", data);
        throw new Error("Invalid response format");
      }

      // Process and set results
      const processedResults = data.map((result) => ({
        pageContent: result.pageContent,
        metadata: {
          source: result.metadata?.source || "Unknown",
        },
        score: result.score,
      }));

      console.log("Processed results:", processedResults);
      setSearchResults(processedResults);
    } catch (error) {
      console.error("Search error:", error);
      alert("Search failed");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Add Repository to Pinecone</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-grow p-3 border rounded-lg"
            placeholder="Enter GitHub repository URL"
            disabled={isInserting}
          />
          <button
            onClick={handleInsert}
            disabled={isInserting || !repoUrl}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isInserting ? "Adding to Pinecone..." : "Add Repository"}
          </button>
        </div>
      </div>

      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Search in Pinecone</h2>
        <div className="space-y-4">
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4"
          >
            <option value="">Select a repository</option>
            {availableNamespaces.map((namespace, index) => (
              <option key={index} value={namespace}>
                {namespace}
              </option>
            ))}
          </select>
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-grow p-3 border rounded-lg"
              placeholder="Enter your search query"
              disabled={!selectedNamespace || isSearching}
            />
            <button
              onClick={handleSearch}
              disabled={!selectedNamespace || !query || isSearching}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      {searchResults && searchResults.length > 0 && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">
            Top {Math.min(5, searchResults.length)} Search Results
          </h2>
          <div className="space-y-6">
            {searchResults.slice(0, 5).map((result, index) => (
              <div key={index} className="p-6 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-blue-600">
                    {result.metadata?.source || "Unknown source"}
                  </h3>
                  <span className="text-sm text-gray-500">
                    Match #{index + 1}
                  </span>
                </div>
                <pre className="p-4 bg-white rounded-lg overflow-x-auto border">
                  <code className="text-sm">
                    {result.pageContent || "No content"}
                  </code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
